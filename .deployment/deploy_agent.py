#!/usr/bin/python3
"""Root-owned forced-command helper. NOT installed or enabled by this PR.

Only a fixed root-owned config supplies paths, network and protected URLs.
Client input is limited to stable release, SHA and immutable repository digest.
"""
import base64
import fcntl
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import signal
import stat
import subprocess
import sys
import time
import tempfile
import contextlib
import urllib.request
import urllib.error

PREVIEW_IMPORT = "/config/caddy/saitena-preview-key.caddy"
REGISTRY_CONFIG = "/etc/saitena-deploy/registry"
PROBE_USER_AGENT = "SaitenaReadOnlyPreflight/1.0"


def private_path(path, directory=False):
    info = Path(path).lstat()
    expected_type = stat.S_ISDIR if directory else stat.S_ISREG
    if info.st_uid != 0 or info.st_mode & 0o077 or not expected_type(info.st_mode):
        raise RuntimeError("unsafe_private_path_permissions")


def http_open(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": PROBE_USER_AGENT}), timeout=15)


def validate_request(request, repository):
    if set(request) != {"release", "sha", "image", "mode"}:
        raise ValueError("invalid_request")
    if request["mode"] not in ["public", "private-preview", "public-demo"]:
        raise ValueError("invalid_release_mode")
    if not re.fullmatch(r"(?:v\d+\.\d+\.\d+|main-[a-f0-9]{40})", request["release"]) or not re.fullmatch(r"[a-f0-9]{40}", request["sha"]):
        raise ValueError("invalid_revision")
    if request["release"].startswith("main-") and request["release"] != "main-" + request["sha"]:
        raise ValueError("release_revision_mismatch")
    if request["mode"] == "public-demo" and request["release"] != "main-" + request["sha"]:
        raise ValueError("public_demo_requires_exact_main_identity")
    if not re.fullmatch(re.escape(repository) + r"@sha256:[a-f0-9]{64}", request["image"]):
        raise ValueError("invalid_image")


def save(path, value):
    temp = path.with_suffix(".tmp")
    with open(temp, "w", opener=lambda p, f: os.open(p, f, 0o600)) as stream:
        json.dump(value, stream)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temp, path)
    directory = os.open(path.parent, os.O_RDONLY)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)


class Runtime:
    def __init__(self, config):
        self.c = config

    def command(self, *args):
        return self.command_bytes(*args).decode().strip()

    def command_bytes(self, *args, input=None):
        # Never forward subprocess stderr or SMTP environment values to CI logs.
        result = subprocess.run(args, input=input, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=180, check=False)
        if result.returncode:
            raise RuntimeError("operation_failed")
        return result.stdout

    def route(self):
        return Path(self.c["caddy_file"]).read_bytes()

    def guarded_parts(self, original):
        # The live route already has an external secret import. No bootstrap or
        # regeneration of its guard is allowed during routine deployments.
        start = self.c["public_block_start"].encode()
        end = self.c["public_block_end"].encode()
        if original.count(start) != 1 or original.count(end) != 1:
            raise RuntimeError("public_route_boundary_changed")
        prefix, rest = original.split(start)
        block, suffix = rest.split(end)
        pattern = rb"reverse_proxy (saitena-website-[a-zA-Z0-9_-]+):3000"
        if len(re.findall(pattern, block)) != 1:
            raise RuntimeError("public_upstream_ambiguous")
        normalized = prefix + start + re.sub(pattern, b"reverse_proxy APPROVED_UPSTREAM:3000", block) + end + suffix
        if hashlib.sha256(normalized).hexdigest() != self.c["route_template_sha256"]:
            raise RuntimeError("approved_origin_guard_or_other_routes_changed")
        if PREVIEW_IMPORT.encode() not in block:
            raise RuntimeError("external_origin_guard_missing")
        return prefix, start, block, end, suffix

    def native(self, content):
        return json.loads(self.command_bytes("docker", "exec", "-i", self.c["caddy_container"], "caddy", "adapt", "--config", "-", "--adapter", "caddyfile", input=content))

    def backup(self, original, journal):
        self.guarded_parts(original)
        container = json.loads(self.command_bytes("docker", "inspect", self.c["caddy_container"]))[0]
        active = self.command_bytes("docker", "exec", self.c["caddy_container"], "wget", "-qO-", "http://127.0.0.1:2019/config/")
        if json.loads(active) != self.native(original):
            raise RuntimeError("active_caddy_drift")
        mounts = container["Mounts"]
        if not any(m["Destination"] == "/etc/caddy/Caddyfile" and m["Source"] == self.c["caddy_file"] for m in mounts):
            raise RuntimeError("caddy_mount_changed")
        root = Path(next(m["Source"] for m in mounts if m["Destination"] == "/config")) / "caddy"
        directory = journal.with_suffix(".backup")
        directory.mkdir(mode=0o700)
        # These files can contain the origin token. Never return or upload them.
        payloads = {"Caddyfile": original, "active.json": active,
                    "autosave.json": (root / "autosave.json").read_bytes(),
                    "secret-import.caddy": (root / "saitena-preview-key.caddy").read_bytes(),
                    "mounts.json": json.dumps(mounts).encode()}
        private_path(root / "saitena-preview-key.caddy")
        for name, data in payloads.items():
            fd = os.open(directory / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
            with os.fdopen(fd, "wb") as stream:
                stream.write(data)
                stream.flush()
                os.fsync(stream.fileno())
        info = Path(self.c["caddy_file"]).stat()
        if Path(self.c["caddy_file"]).is_symlink() or info.st_uid != 0 or info.st_mode & 0o022:
            raise RuntimeError("unsafe_caddy_source_permissions")
        save(directory / "source-metadata.json", {"inode": info.st_ino, "device": info.st_dev, "uid": info.st_uid, "gid": info.st_gid, "mode": stat.S_IMODE(info.st_mode)})

    def arm_watchdog(self, journal):
        child = subprocess.Popen([sys.executable, str(Path(__file__).resolve()), "watchdog", str(journal)], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True, close_fds=True)
        ready = journal.with_suffix(".watchdog-ready")
        for _ in range(50):
            if child.poll() is not None:
                raise RuntimeError("watchdog_not_started")
            if ready.exists() and json.loads(ready.read_bytes()).get("pid") == child.pid:
                return
            time.sleep(0.1)
        raise RuntimeError("watchdog_not_ready")

    def validate_upstream_change(self, original, candidate, name, journal):
        old_upstream = re.findall(rb"reverse_proxy (saitena-website-[a-zA-Z0-9_-]+):3000", self.guarded_parts(original)[2])[0].decode() + ":3000"
        replacements = [0]
        def replace_upstream(value):
            if isinstance(value, dict): return {key: replace_upstream(item) for key, item in value.items()}
            if isinstance(value, list): return [replace_upstream(item) for item in value]
            if value == old_upstream:
                replacements[0] += 1
                return name + ":3000"
            return value
        baseline_native = json.loads((journal.with_suffix(".backup") / "active.json").read_bytes())
        if replace_upstream(baseline_native) != self.native(candidate) or replacements[0] != 1:
            raise RuntimeError("native_config_change_exceeds_public_upstream")

    def origin_checks(self):
        addresses = self.c.get("origin_addresses", [])
        if {ipaddress.ip_address(v).version for v in addresses} != {4, 6}:
            raise RuntimeError("dual_stack_origin_addresses_required")
        for address in addresses:
            family = ipaddress.ip_address(address).version
            target = "[" + address + "]" if family == 6 else address
            for host in ["saitena.com", "www.saitena.com"]:
                for spoof in [False, True]:
                    args = ["curl", "-" + str(family), "--noproxy", "*", "--silent", "--max-time", "12", "--resolve", host + ":443:" + target, "--output", "/dev/null", "--write-out", "%{http_code}"]
                    if spoof:
                        args += ["--header", "CF-Connecting-IP: 95.43.161.43", "--header", "X-Saitena-Preview-Key: deliberately-invalid"]
                    if self.command(*args, "https://" + host + "/") != "403":
                        raise RuntimeError("direct_origin_not_denied")

    def load_backup_guard(self, journal):
        directory = journal.with_suffix(".backup")
        self.allowed_native = [json.loads((directory / name).read_bytes()) for name in ["active.json", "candidate.json", "fallback.json"]]
        self.source_metadata = json.loads((directory / "source-metadata.json").read_bytes())

    def preview_access(self):
        access = self.c.get("preview_access", {})
        if access.get("approved") is not True or access.get("secret_import") != PREVIEW_IMPORT or "origin_token" in access:
            raise RuntimeError("preview_access_not_approved")
        owners = access.get("owner_ips", [])
        peers = access.get("cloudflare_cidrs", [])
        if not owners or not peers:
            raise RuntimeError("preview_allowlist_missing")
        # Exact home addresses only. Broad IPv6/prefix access requires separate design/review.
        try:
            for value in owners: ipaddress.ip_address(value)
            for value in peers:
                network = ipaddress.ip_network(value, strict=True)
                if network.prefixlen == 0: raise ValueError()
        except ValueError:
            raise RuntimeError("invalid_preview_ip") from None
        return access

    def preview_block(self, name):
        access = self.preview_access()
        address = self.c.get("site_address", "saitena.com")
        # Only tests use an alternate address. main() fixes real production to saitena.com.
        hosts = "saitena.com, www.saitena.com" if address == "saitena.com" else address
        owners = " ".join(access["owner_ips"])
        peers = " ".join(access["cloudflare_cidrs"])
        canonical = "  redir @www https://saitena.com{uri} 302\n" if address == "saitena.com" else ""
        return f'''# SAITENA PRIVATE PREVIEW
{hosts} {{
 header >X-Robots-Tag "noindex, nofollow, noarchive"
 header >Cache-Control "private, no-store"
 @denied not {{
  remote_ip {peers}
  import {PREVIEW_IMPORT}
  header CF-Connecting-IP {owners}
 }}
 @worker header CF-Worker *
 @www host www.saitena.com
 route {{
  handle @denied {{
   request_header -X-Saitena-Preview-Key
   respond "Forbidden" 403
  }}
  handle @worker {{
   request_header -X-Saitena-Preview-Key
   respond "Forbidden" 403
  }}
  handle {{
  request_header -X-Saitena-Preview-Key
{canonical}  reverse_proxy {name}:3000 {{
   header_up -X-Saitena-Preview-Key
  }}
  }}
 }}
}}
# Internal verification only: no host port, DNS or external listener.
http://127.0.0.1:9080 {{
 bind 127.0.0.1
 reverse_proxy {name}:3000
}}
'''.encode()

    def candidate_route(self, original, name):
        if not re.fullmatch(r"[a-zA-Z0-9_-]+", name):
            raise RuntimeError("invalid_container_name")
        if self.c.get("release_mode") == "public-demo":
            prefix, start, block, end, suffix = self.guarded_parts(original)
            block = re.sub(rb"reverse_proxy saitena-website-[a-zA-Z0-9_-]+:3000", ("reverse_proxy " + name + ":3000").encode(), block)
            return prefix + start + block + end + suffix
        begin, end = b"# BEGIN SAITENA PUBLIC\n", b"# END SAITENA PUBLIC"
        if original.count(begin) != 1 or original.count(end) != 1:
            raise RuntimeError("approved_routing_bootstrap_required")
        prefix, rest = original.split(begin)
        _, suffix = rest.split(end)
        address = self.c.get("site_address", "saitena.com")
        block = f"{address} {{\n encode zstd gzip\n reverse_proxy {name}:3000\n}}\n".encode()
        if address == "saitena.com":
            block += b"www.saitena.com {\n redir https://saitena.com{uri} 301\n}\n"
        if self.c.get("release_mode", "public") == "private-preview":
            block = self.preview_block(name)
        # Everything outside this separately approved block is preserved exactly.
        return prefix + begin + block + end + suffix

    def validate(self, content):
        # Resolve imports inside the real container before touching the mounted file.
        self.command_bytes("docker", "exec", "-i", self.c["caddy_container"], "caddy", "validate", "--config", "-", "--adapter", "caddyfile", input=content)

    def apply(self, content):
        self.validate(content)
        if self.c.get("release_mode") == "public-demo":
            info = Path(self.c["caddy_file"]).lstat()
            if stat.S_ISLNK(info.st_mode):
                raise RuntimeError("source_identity_changed")
            if info.st_ino != self.source_metadata["inode"] or info.st_dev != self.source_metadata["device"] or info.st_uid != self.source_metadata["uid"] or info.st_gid != self.source_metadata["gid"] or stat.S_IMODE(info.st_mode) != self.source_metadata["mode"]:
                raise RuntimeError("source_identity_changed")
            active = json.loads(self.command_bytes("docker", "exec", self.c["caddy_container"], "wget", "-qO-", "http://127.0.0.1:2019/config/"))
            if active not in self.allowed_native:
                raise RuntimeError("unknown_active_caddy_refused")
        # Write same inode: existing production uses a single-file bind mount.
        # Durable journal is saved before this call and contains complete original.
        with open(self.c["caddy_file"], "r+b") as stream:
            stream.write(content)
            stream.truncate()
            stream.flush()
            os.fsync(stream.fileno())
        self.command("docker", "exec", self.c["caddy_container"], "caddy", "validate", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile")
        self.command("docker", "exec", self.c["caddy_container"], "caddy", "reload", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile")
        if self.c.get("release_mode") == "public-demo":
            active = json.loads(self.command_bytes("docker", "exec", self.c["caddy_container"], "wget", "-qO-", "http://127.0.0.1:2019/config/"))
            if active != self.native(content):
                raise RuntimeError("reloaded_caddy_mismatch")

    def registry_pull(self, image):
        credential = getattr(self, "registry_credential", None)
        if credential is not None:
            # Job-scoped GITHUB_TOKEN, packages:read. No persistent PAT/reader.
            try:
                if set(credential) != {"username", "token"} or credential["username"] != "techsolutionbg" or not isinstance(credential["token"], str) or not 20 <= len(credential["token"]) <= 4096:
                    raise RuntimeError("invalid_registry_credential")
                with tempfile.TemporaryDirectory(prefix="saitena-registry-") as directory:
                    self.command_bytes("docker", "--config", directory, "login", "ghcr.io", "--username", credential["username"], "--password-stdin", input=credential["token"].encode())
                    self.command("docker", "--config", directory, "pull", image)
            finally:
                self.registry_credential = None
                credential.clear()
            return
        private_path(REGISTRY_CONFIG, directory=True)
        private_path(Path(REGISTRY_CONFIG) / "config.json")
        self.command("docker", "--config", REGISTRY_CONFIG, "pull", image)

    def stage(self, request, name):
        env_file = Path(self.c["runtime_env"])
        if env_file.stat().st_mode & 0o077:
            raise RuntimeError("runtime_env_permissions")
        values = dict(line.split("=", 1) for line in env_file.read_text().splitlines() if "=" in line and not line.startswith("#"))
        if request["mode"] in ["private-preview", "public-demo"]:
            if values != {"CONTACT_MAIL_MODE": "disabled"}:
                raise RuntimeError("preview_runtime_must_disable_mail")
        else:
            for key in ["CONTACT_SMTP_HOST", "CONTACT_SMTP_PORT", "CONTACT_SMTP_USER", "CONTACT_SMTP_PASSWORD", "CONTACT_MAIL_FROM", "CONTACT_MAIL_TO"]:
                if not values.get(key):
                    raise RuntimeError("runtime_settings_missing")
            if values.get("CONTACT_MAIL_MODE") != "smtp":
                raise RuntimeError("production_smtp_required")
        self.registry_pull(request["image"])
        revision = self.command("docker", "image", "inspect", request["image"], "--format", '{{index .Config.Labels "org.opencontainers.image.revision"}}')
        if revision != request["sha"]:
            raise RuntimeError("image_revision_mismatch")
        mode = self.command("docker", "image", "inspect", request["image"], "--format", '{{index .Config.Labels "io.saitena.release-mode"}}')
        if mode != request["mode"]:
            raise RuntimeError("image_mode_mismatch")
        self.command("docker", "run", "-d", "--name", name, "--network", self.c["network"], "--init", "--restart", "unless-stopped", "--read-only", "--tmpfs", "/tmp:rw,nosuid,nodev,size=64m,uid=1000,gid=1000", "--tmpfs", "/app/.next/cache:rw,nosuid,nodev,size=64m,uid=1000,gid=1000", "--user", "1000:1000", "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--pids-limit", "128", "--memory", "512m", "--cpus", "1", "--log-driver", "local", "--log-opt", "max-size=10m", "--log-opt", "max-file=3", "--env-file", str(env_file), "--health-cmd", "node -e \"fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\"", "--health-interval", "5s", "--health-timeout", "5s", "--health-retries", "12", request["image"])
        for _ in range(60):
            health = self.command("docker", "inspect", name, "--format", "{{.State.Health.Status}}")
            if health == "healthy":
                return
            if health == "unhealthy":
                break
            time.sleep(2)
        raise RuntimeError("candidate_not_healthy")

    def candidate_checks(self, name):
        if self.c.get("release_mode") == "public-demo":
            script = r"""const fs=require('fs'),crypto=require('crypto');(async()=>{const base='http://127.0.0.1:3000',out={};for(const p of ['/', '/services','/prices','/portfolio','/about','/contact','/blog','/faq',...JSON.parse(fs.readFileSync('/app/release-assets.json')).map(a=>'/'+a.path.slice(7))]){const r=await fetch(base+p),b=Buffer.from(await r.arrayBuffer());if(r.status!==200||!b.length)throw Error('route');out[p]=crypto.createHash('sha256').update(b).digest('hex');if(r.headers.get('content-type')?.includes('text/html'))for(const m of b.toString().matchAll(/(?:src|href)="(\/_next\/(?:static\/[^"?]+|image\?[^" ]+))"/g)){const path=m[1].replaceAll('&amp;','&');if(out[path])continue;const r=await fetch(base+path,{headers:{Accept:'*/*'}});if(r.status!==200)throw Error('resource');out[path]=crypto.createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex')}}if((await(await fetch(base+'/api/health')).json()).releaseMode!=='public-demo')throw Error('mode');for(const p of ['/legal/privacy','/legal/terms'])if((await fetch(base+p)).status!==404)throw Error('legal');if((await fetch(base+'/api/contact',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}'})).status!==403)throw Error('mail');console.log(JSON.stringify(out))})().catch(()=>process.exitCode=1)"""
            return json.loads(self.command("docker", "exec", name, "node", "-e", script))
        # No registration or SMTP submission. Validate assets, pages and a safe rejected form.
        script = """const fs=require('fs');(async()=>{for(const p of ['/', '/services','/prices','/contact','/api/health','/robots.txt','/sitemap.xml']){const r=await fetch('http://127.0.0.1:3000'+p);if(!r.ok)throw Error('route');const b=await r.text();if(!b.length)throw Error('empty')}const m=JSON.parse(fs.readFileSync('/app/release-assets.json'));for(const a of m.filter(x=>x.path.startsWith('public/')&&x.decision!=='exclude-local-archive')){if(!(await fetch('http://127.0.0.1:3000/'+a.path.slice(7))).ok)throw Error('asset')}const r=await fetch('http://127.0.0.1:3000/api/contact',{method:'POST',headers:{Origin:'https://invalid.example','Content-Type':'application/json'},body:'{}'});if(r.status!==403)throw Error('origin');const b=await(await fetch('http://127.0.0.1:3000/')).text();console.log(require('crypto').createHash('sha256').update(b).digest('hex'))})().catch(()=>process.exitCode=1)"""
        if self.c.get("release_mode", "public") == "private-preview":
            checks = """(async()=>{const base='http://127.0.0.1:3000';for(const p of ['/legal/privacy','/legal/terms','/legal/cookies','/legal/subscription-terms']){if((await fetch(base+p)).status!==404)throw Error('legal')}const h=await fetch(base);if(!h.headers.get('x-robots-tag')?.includes('noindex'))throw Error('index');if((await(await fetch(base+'/api/health')).json()).releaseMode!=='private-preview')throw Error('mode');if(!(await(await fetch(base+'/robots.txt')).text()).includes('Disallow: /'))throw Error('robots');if((await fetch(base+'/api/contact',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}'})).status!==403)throw Error('mail')})().catch(()=>process.exitCode=1)"""
            self.command("docker", "exec", name, "node", "-e", checks)
        return self.command("docker", "exec", name, "node", "-e", script)

    def protected_checks(self):
        for url in self.c["protected_urls"]:
            # Exact, documented pre-existing clients 502 is not a healthy result.
            expected = self.c.get("preexisting_failures", {}).get(url, 200)
            if expected != 200 and not (url == "https://clients.saitena.com/" and expected == 502):
                raise RuntimeError("unsupported_health_exception")
            try:
                with http_open(url) as response:
                    status = response.status
            except urllib.error.HTTPError as error:
                status = error.code
            if status != expected:
                raise RuntimeError("protected_service_changed")

    def public_digest(self):
        if self.c.get("release_mode", "public") == "private-preview":
            return hashlib.sha256(self.preview_probe("/")).hexdigest()
        with http_open(self.c["public_url"]) as response:
            body = response.read()
            if response.status != 200 or not body:
                raise RuntimeError("public_page_failed")
            return hashlib.sha256(body).hexdigest()

    def preview_probe(self, path):
        if path not in ["/", "/api/health"]:
            raise RuntimeError("unsupported_probe_path")
        return self.command_bytes("docker", "exec", self.c["caddy_container"], "wget", "-qO-", "http://127.0.0.1:9080" + path)

    def preview_external_checks(self):
        for base in [self.c["public_url"], "https://www.saitena.com/"]:
            for path in ["", "api/health", "robots.txt"]:
                try:
                    with http_open(base.rstrip("/") + "/" + path):
                        pass
                except urllib.error.HTTPError as error:
                    if error.code == 403 and error.headers.get("CF-Ray"):
                        continue
                raise RuntimeError("preview_edge_not_blocked")

    def preview_preflight(self, original, name):
        # A failed first release must restore an already guarded baseline, never reopen the site.
        candidate = self.candidate_route(original, name)
        normalize = lambda value: re.sub(rb"reverse_proxy [a-zA-Z0-9_-]+:3000", b"reverse_proxy UPSTREAM:3000", value)
        if normalize(candidate) != normalize(original):
            raise RuntimeError("guarded_preview_bootstrap_required")
        block = original.split(b"# BEGIN SAITENA PUBLIC\n")[1].split(b"# END SAITENA PUBLIC")[0]
        if len(set(re.findall(rb"reverse_proxy ([a-zA-Z0-9_-]+):3000", block))) != 1:
            raise RuntimeError("preview_probe_upstream_mismatch")
        self.preview_external_checks()

    def rollback_checks(self, expected):
        if self.public_digest() != expected:
            raise RuntimeError("restored_page_mismatch")
        self.protected_checks()
        if self.c.get("release_mode", "public") == "private-preview":
            self.preview_external_checks()

    def public_checks(self, expected=None):
        if self.c.get("release_mode") == "public-demo":
            for url in [self.c["public_url"], "https://www.saitena.com/"]:
                with http_open(url) as response:
                    if response.status != 200 or not response.headers.get("CF-Ray") or "noindex" not in response.headers.get("X-Robots-Tag", "") or "no-store" not in response.headers.get("Cache-Control", ""):
                        raise RuntimeError("public_origin_or_privacy_failed")
                    if expected and hashlib.sha256(response.read()).hexdigest() != expected["/"]:
                        raise RuntimeError("public_identity_failed")
            self.protected_checks()
            return
        if self.c.get("release_mode", "public") == "private-preview":
            health = json.loads(self.preview_probe("/api/health"))
            if health.get("status") != "ok" or health.get("service") != "saitena" or health.get("releaseMode") != "private-preview":
                raise RuntimeError("preview_health_failed")
            # Hash exact bytes, including trailing whitespace, as in candidate_checks.
            if expected is not None and self.public_digest() != expected:
                raise RuntimeError("preview_page_mismatch")
            self.preview_external_checks()
            self.protected_checks()
            return
        with http_open(self.c["public_url"].rstrip("/") + "/api/health") as response:
            value = json.load(response)
            if response.status != 200 or value.get("service") != "saitena" or value.get("status") != "ok":
                raise RuntimeError("public_health_failed")
        if expected is not None and self.public_digest() != expected:
            raise RuntimeError("public_page_mismatch")
        self.protected_checks()


    def fail_closed_route(self, original):
        if self.c.get("release_mode") == "public-demo":
            prefix, start, block, end, suffix = self.guarded_parts(original)
            # Keep the host header; replace only this vhost with a deny response.
            return prefix + start + b'\n header >X-Robots-Tag "noindex, nofollow, noarchive"\n header >Cache-Control "private, no-store"\n respond "Forbidden" 403\n}\n\n' + end + suffix
        # Preserve other vhosts byte for byte even if restoring the old upstream fails.
        begin, end = b"# BEGIN SAITENA PUBLIC\n", b"# END SAITENA PUBLIC"
        prefix, rest = original.split(begin)
        _, suffix = rest.split(end)
        address = self.c.get("site_address", "saitena.com")
        hosts = "saitena.com, www.saitena.com" if address == "saitena.com" else address
        deny = (hosts + ''' {
 header >X-Robots-Tag "noindex, nofollow, noarchive"
 header >Cache-Control "private, no-store"
 request_header -X-Saitena-Preview-Key
 respond "Forbidden" 403
}
''').encode()
        return prefix + begin + deny + end + suffix

    def fail_closed(self, original):
        self.apply(self.fail_closed_route(original))


def transact(request, config, runtime):
    validate_request(request, config["image_repository"])
    if request["mode"] != config.get("release_mode", "public"):
        raise RuntimeError("server_release_mode_mismatch")
    if request["mode"] == "public-demo":
        return guarded_transact(request, config, runtime)
    state = Path(config["state_dir"])
    state.mkdir(mode=0o700, parents=True, exist_ok=True)
    journal = state / (request["release"] + ".json")
    for pending in state.glob("v*.json"):
        if json.loads(pending.read_text())["phase"] in ["switching", "manual_recovery_required", "fail_closed_manual_recovery_required", "staging"]:
            raise RuntimeError("unfinished_release_requires_recovery")
    if journal.exists():
        previous = json.loads(journal.read_text())
        if previous["request"] != request:
            raise RuntimeError("release_identity_conflict")
        if previous["phase"] == "complete":
            runtime.public_checks(previous.get("expected_digest"))
            return {"status": "already_deployed", "sha": request["sha"]}
        raise RuntimeError("manual_recovery_or_new_release_required")
    runtime.protected_checks()
    original = runtime.route()
    name = "saitena-website-public-" + request["sha"][:16]
    candidate = runtime.candidate_route(original, name)
    if request["mode"] == "private-preview":
        runtime.preview_preflight(original, name)
        runtime.validate(runtime.fail_closed_route(original))
    runtime.validate(candidate)
    entry = {"request": request, "phase": "staging", "container": name, "original": base64.b64encode(original).decode(), "candidate_sha256": hashlib.sha256(candidate).hexdigest(), "baseline_digest": runtime.public_digest()}
    save(journal, entry)
    switched = False
    try:
        runtime.stage(request, name)
        entry["expected_digest"] = runtime.candidate_checks(name)
        if runtime.route() != original:
            raise RuntimeError("routing_changed_during_staging")
        entry["phase"] = "switching"
        save(journal, entry)
        switched = True
        runtime.apply(candidate)
        runtime.public_checks(entry["expected_digest"])
        entry["phase"] = "complete"
        save(journal, entry)
        return {"status": "deployed", "sha": request["sha"], "image": request["image"]}
    except Exception:
        if switched:
            try:
                if runtime.route() not in [candidate, original]:
                    raise RuntimeError("concurrent_routing_change_rollback_refused")
                runtime.apply(original)
                runtime.rollback_checks(entry["baseline_digest"])
                entry["phase"] = "rolled_back"
            except Exception:
                entry["phase"] = "manual_recovery_required"
                if request["mode"] == "private-preview" and runtime.route() in [candidate, original]:
                    try:
                        runtime.fail_closed(original)
                        entry["fallback_sha256"] = hashlib.sha256(runtime.route()).hexdigest()
                        entry["phase"] = "fail_closed_manual_recovery_required"
                    except Exception:
                        pass
        else:
            entry["phase"] = "failed_before_switch"
        save(journal, entry)
        # Preserve container and bounded logs for diagnosis; never prune volumes/images.
        raise RuntimeError(entry["phase"])


def recover(journal, runtime):
    entry = json.loads(journal.read_text())
    if entry["request"].get("mode", "public") != getattr(runtime, "c", {}).get("release_mode", "public"):
        raise RuntimeError("recovery_release_mode_mismatch")
    original = base64.b64decode(entry["original"])
    current = runtime.route()
    if current != original and hashlib.sha256(current).hexdigest() not in [entry["candidate_sha256"], entry.get("fallback_sha256")]:
        raise RuntimeError("routing_changed_since_release_manual_review_required")
    runtime.apply(original)
    runtime.rollback_checks(entry["baseline_digest"])
    entry["phase"] = "rolled_back"
    save(journal, entry)


@contextlib.contextmanager
def mutation_lock(state):
    with open(Path(state) / "mutation.lock", "a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        yield


def guarded_recover(journal, runtime):
    entry = json.loads(journal.read_bytes())
    runtime.load_backup_guard(journal)
    try:
        recover(journal, runtime)
    except Exception:
        original = base64.b64decode(entry["original"])
        entry["phase"] = "manual_recovery_required"
        if runtime.route() in [original, runtime.candidate_route(original, entry["container"])]:
            try:
                runtime.fail_closed(original)
                entry["fallback_sha256"] = hashlib.sha256(runtime.route()).hexdigest()
                entry["phase"] = "fail_closed_manual_recovery_required"
            except Exception:
                pass
        save(journal, entry)
        raise RuntimeError(entry["phase"])


def guarded_transact(request, config, runtime):
    state = Path(config["state_dir"])
    journal = state / (request["release"] + ".json")
    for pending in state.glob("*.json"):
        previous = json.loads(pending.read_bytes())
        if previous["phase"] in ["staging", "prepared", "switching", "awaiting_acceptance", "manual_recovery_required", "fail_closed_manual_recovery_required"]:
            raise RuntimeError("unfinished_release_requires_recovery")
    if journal.exists():
        previous = json.loads(journal.read_bytes())
        if previous["request"] != request or previous["phase"] != "complete":
            raise RuntimeError("release_identity_conflict")
        runtime.public_checks(previous["expected_digest"])
        return {"status": "already_deployed", "sha": request["sha"]}
    runtime.protected_checks()
    runtime.origin_checks()
    original = runtime.route()
    name = "saitena-website-public-" + request["sha"][:16]
    candidate = runtime.candidate_route(original, name)
    fallback = runtime.fail_closed_route(original)
    runtime.validate(candidate)
    runtime.validate(fallback)
    runtime.backup(original, journal)
    runtime.validate_upstream_change(original, candidate, name, journal)
    for key, content in [("candidate", candidate), ("fallback", fallback)]:
        save(journal.with_suffix(".backup") / (key + ".json"), runtime.native(content))
    runtime.load_backup_guard(journal)
    entry = {"request": request, "phase": "staging", "container": name,
             "original": base64.b64encode(original).decode(), "candidate_sha256": hashlib.sha256(candidate).hexdigest(),
             "baseline_digest": runtime.public_digest()}
    save(journal, entry)
    switched = False
    try:
        runtime.stage(request, name)
        entry["expected_digest"] = runtime.candidate_checks(name)
        entry.update(phase="prepared", deadline=time.time() + 240)
        save(journal, entry)
        runtime.arm_watchdog(journal)
        with mutation_lock(state):
            if runtime.route() != original or time.time() >= entry["deadline"]:
                raise RuntimeError("pre_switch_drift_or_timeout")
            entry["phase"] = "switching"
            save(journal, entry)
            switched = True
            runtime.apply(candidate)
        runtime.public_checks(entry["expected_digest"])
        runtime.origin_checks()
        with mutation_lock(state):
            current = json.loads(journal.read_bytes())
            if current["phase"] != "switching" or time.time() >= entry["deadline"]:
                raise RuntimeError("acceptance_deadline_expired")
            entry["phase"] = "awaiting_acceptance"
            save(journal, entry)
        return {"status": "awaiting_acceptance", "sha": request["sha"], "image": request["image"], "expected": entry["expected_digest"]}
    except Exception:
        with mutation_lock(state):
            if switched:
                guarded_recover(journal, runtime)
                raise RuntimeError("rolled_back")
            entry["phase"] = "failed_before_switch"
            save(journal, entry)
        raise RuntimeError("failed_before_switch")


def finish_request(action, request, config, runtime):
    validate_request(request, config["image_repository"])
    journal = Path(config["state_dir"]) / (request["release"] + ".json")
    with mutation_lock(config["state_dir"]):
        entry = json.loads(journal.read_bytes())
        if entry["request"] != request or request["mode"] != config["release_mode"]:
            raise RuntimeError("release_identity_conflict")
        if action == "rollback":
            guarded_recover(journal, runtime)
            return {"status": "rolled_back"}
        if entry["phase"] != "awaiting_acceptance" or time.time() >= entry["deadline"]:
            raise RuntimeError("release_not_awaiting_acceptance")
        if hashlib.sha256(runtime.route()).hexdigest() != entry["candidate_sha256"]:
            raise RuntimeError("routing_changed_before_acceptance")
        runtime.public_checks(entry["expected_digest"])
        if time.time() >= entry["deadline"]:
            raise RuntimeError("acceptance_deadline_expired")
        entry["phase"] = "complete"
        save(journal, entry)
        return {"status": "deployed", "sha": request["sha"], "image": request["image"]}


def watchdog(journal, runtime):
    while True:
        entry = json.loads(journal.read_bytes())
        if entry["phase"] not in ["prepared", "switching", "awaiting_acceptance"]:
            return
        if time.time() >= entry["deadline"]:
            with mutation_lock(runtime.c["state_dir"]):
                if json.loads(journal.read_bytes())["phase"] in ["prepared", "switching", "awaiting_acceptance"]:
                    guarded_recover(journal, runtime)
            return
        time.sleep(2)


def main():
    os.umask(0o077)
    def interrupted(signum, frame):
        raise RuntimeError("deployment_interrupted")
    for signum in [signal.SIGTERM, signal.SIGINT, signal.SIGHUP]:
        signal.signal(signum, interrupted)
    if os.geteuid() != 0:
        raise RuntimeError("restricted_root_helper_required")
    path = Path("/etc/saitena-deploy/config.json")
    private_path(path)
    config = json.loads(path.read_text())
    if config.get("enabled") is not True or config["public_url"] != "https://saitena.com/" or config.get("site_address", "saitena.com") != "saitena.com" or len(config.get("protected_urls", [])) < 4:
        raise RuntimeError("deployment_not_activated")
    if config.get("release_mode") == "private-preview":
        private_path(config["preview_access"]["secret_host_file"])
    Path(config["state_dir"]).mkdir(mode=0o700, parents=True, exist_ok=True)
    for protected in [Path(config["runtime_env"]), Path(config["state_dir"])]:
        if protected.stat().st_uid != 0 or protected.stat().st_mode & 0o077:
            raise RuntimeError("unsafe_private_path_permissions")
    if len(sys.argv) == 3 and sys.argv[1] == "watchdog":
        journal = Path(sys.argv[2])
        if journal.parent != Path(config["state_dir"]) or not re.fullmatch(r"main-[a-f0-9]{40}\.json", journal.name):
            raise RuntimeError("invalid_watchdog_path")
        private_path(journal)
        entry = json.loads(journal.read_bytes())
        validate_request(entry["request"], config["image_repository"])
        if config["release_mode"] != "public-demo" or entry["request"]["mode"] != "public-demo" or entry["phase"] != "prepared":
            raise RuntimeError("invalid_watchdog_state")
        save(journal.with_suffix(".watchdog-ready"), {"pid": os.getpid()})
        watchdog(journal, Runtime(config))
        return
    with open(Path(config["state_dir"]) / "deploy.lock", "a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if len(sys.argv) == 3 and sys.argv[1] == "recover" and re.fullmatch(r"(?:v\d+\.\d+\.\d+|main-[a-f0-9]{40})", sys.argv[2]):
            recovery = guarded_recover if config["release_mode"] == "public-demo" else recover
            recovery(Path(config["state_dir"]) / (sys.argv[2] + ".json"), Runtime(config))
            print(json.dumps({"status": "rolled_back"}))
        elif len(sys.argv) == 1:
            data = sys.stdin.buffer.read(8193)
            if len(data) > 8192:
                raise RuntimeError("oversized_request")
            request = json.loads(data)
            runtime = Runtime(config)
            runtime.registry_credential = request.pop("registry", None)
            action = request.pop("action", "deploy")
            if action not in ["deploy", "accept", "rollback"] or (action != "deploy" and config["release_mode"] != "public-demo"):
                raise RuntimeError("unsupported_action")
            result = transact(request, config, runtime) if action == "deploy" else finish_request(action, request, config, runtime)
            print(json.dumps(result))
        else:
            raise RuntimeError("unsupported_action")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Only controlled codes; no raw subprocess output, credentials or stack traces.
        code = str(error)
        if not re.fullmatch(r"[a-z_]+", code):
            code = "deployment_failed"
        print(json.dumps({"status": "failed", "code": code}), file=sys.stderr)
        sys.exit(1)
