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
import subprocess
import sys
import time
import urllib.request
import urllib.error


def validate_request(request, repository):
    if set(request) != {"release", "sha", "image", "mode"}:
        raise ValueError("invalid_request")
    if request["mode"] not in ["public", "private-preview"]:
        raise ValueError("invalid_release_mode")
    if not re.fullmatch(r"v\d+\.\d+\.\d+", request["release"]) or not re.fullmatch(r"[a-f0-9]{40}", request["sha"]):
        raise ValueError("invalid_revision")
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

    def command_bytes(self, *args):
        # Never forward subprocess stderr or SMTP environment values to CI logs.
        result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=180, check=False)
        if result.returncode:
            raise RuntimeError("operation_failed")
        return result.stdout

    def route(self):
        return Path(self.c["caddy_file"]).read_bytes()

    def preview_access(self):
        access = self.c.get("preview_access", {})
        if access.get("approved") is not True or not re.fullmatch(r"[a-f0-9]{64}", access.get("origin_token", "")):
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
        token = access["origin_token"]
        canonical = "  redir @www https://saitena.com{uri} 302\n" if address == "saitena.com" else ""
        return f'''# SAITENA PRIVATE PREVIEW
{hosts} {{
 header >X-Robots-Tag "noindex, nofollow, noarchive"
 header >Cache-Control "private, no-store"
 @denied not {{
  remote_ip {peers}
  header X-Saitena-Preview-Key {token}
  header CF-Connecting-IP {owners}
 }}
 @worker header CF-Worker *
 @www host www.saitena.com
 route {{
  respond @denied "Forbidden" 403
  respond @worker "Forbidden" 403
{canonical}  reverse_proxy {name}:3000 {{
   header_up -X-Saitena-Preview-Key
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

    def apply(self, content):
        # Write same inode: existing production uses a single-file bind mount.
        # Durable journal is saved before this call and contains complete original.
        with open(self.c["caddy_file"], "r+b") as stream:
            stream.write(content)
            stream.truncate()
            stream.flush()
            os.fsync(stream.fileno())
        self.command("docker", "exec", self.c["caddy_container"], "caddy", "validate", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile")
        self.command("docker", "exec", self.c["caddy_container"], "caddy", "reload", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile")

    def stage(self, request, name):
        env_file = Path(self.c["runtime_env"])
        if env_file.stat().st_mode & 0o077:
            raise RuntimeError("runtime_env_permissions")
        values = dict(line.split("=", 1) for line in env_file.read_text().splitlines() if "=" in line and not line.startswith("#"))
        if request["mode"] == "private-preview":
            if values != {"CONTACT_MAIL_MODE": "disabled"}:
                raise RuntimeError("preview_runtime_must_disable_mail")
        else:
            for key in ["CONTACT_SMTP_HOST", "CONTACT_SMTP_PORT", "CONTACT_SMTP_USER", "CONTACT_SMTP_PASSWORD", "CONTACT_MAIL_FROM", "CONTACT_MAIL_TO"]:
                if not values.get(key):
                    raise RuntimeError("runtime_settings_missing")
            if values.get("CONTACT_MAIL_MODE") != "smtp":
                raise RuntimeError("production_smtp_required")
        self.command("docker", "pull", request["image"])
        revision = self.command("docker", "image", "inspect", request["image"], "--format", '{{index .Config.Labels "org.opencontainers.image.revision"}}')
        if revision != request["sha"]:
            raise RuntimeError("image_revision_mismatch")
        mode = self.command("docker", "image", "inspect", request["image"], "--format", '{{index .Config.Labels "io.saitena.release-mode"}}')
        if mode != request["mode"]:
            raise RuntimeError("image_mode_mismatch")
        self.command("docker", "run", "-d", "--name", name, "--network", self.c["network"], "--init", "--restart", "unless-stopped", "--user", "1000:1000", "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--pids-limit", "128", "--memory", "512m", "--cpus", "1", "--log-driver", "local", "--log-opt", "max-size=10m", "--log-opt", "max-file=3", "--env-file", str(env_file), "--health-cmd", "node -e \"fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\"", "--health-interval", "5s", "--health-timeout", "5s", "--health-retries", "12", request["image"])
        for _ in range(60):
            health = self.command("docker", "inspect", name, "--format", "{{.State.Health.Status}}")
            if health == "healthy":
                return
            if health == "unhealthy":
                break
            time.sleep(2)
        raise RuntimeError("candidate_not_healthy")

    def candidate_checks(self, name):
        # No registration or SMTP submission. Validate assets, pages and a safe rejected form.
        script = """const fs=require('fs');(async()=>{for(const p of ['/', '/services','/prices','/contact','/api/health','/robots.txt','/sitemap.xml']){const r=await fetch('http://127.0.0.1:3000'+p);if(!r.ok)throw Error('route');const b=await r.text();if(!b.length)throw Error('empty')}const m=JSON.parse(fs.readFileSync('/app/release-assets.json'));for(const a of m.filter(x=>x.path.startsWith('public/')&&x.decision!=='exclude-local-archive')){if(!(await fetch('http://127.0.0.1:3000/'+a.path.slice(7))).ok)throw Error('asset')}const r=await fetch('http://127.0.0.1:3000/api/contact',{method:'POST',headers:{Origin:'https://invalid.example','Content-Type':'application/json'},body:'{}'});if(r.status!==403)throw Error('origin');const b=await(await fetch('http://127.0.0.1:3000/')).text();console.log(require('crypto').createHash('sha256').update(b).digest('hex'))})().catch(()=>process.exitCode=1)"""
        if self.c.get("release_mode", "public") == "private-preview":
            checks = """(async()=>{const base='http://127.0.0.1:3000';for(const p of ['/legal/privacy','/legal/terms','/legal/cookies','/legal/subscription-terms']){if((await fetch(base+p)).status!==404)throw Error('legal')}const h=await fetch(base);if(!h.headers.get('x-robots-tag')?.includes('noindex'))throw Error('index');if((await(await fetch(base+'/api/health')).json()).releaseMode!=='private-preview')throw Error('mode');if(!(await(await fetch(base+'/robots.txt')).text()).includes('Disallow: /'))throw Error('robots');if((await fetch(base+'/api/contact',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}'})).status!==403)throw Error('mail')})().catch(()=>process.exitCode=1)"""
            self.command("docker", "exec", name, "node", "-e", checks)
        return self.command("docker", "exec", name, "node", "-e", script)

    def protected_checks(self):
        for url in self.c["protected_urls"]:
            with urllib.request.urlopen(url, timeout=15) as response:
                if response.status != 200:
                    raise RuntimeError("protected_service_failed")

    def public_digest(self):
        if self.c.get("release_mode", "public") == "private-preview":
            return hashlib.sha256(self.preview_probe("/")).hexdigest()
        with urllib.request.urlopen(self.c["public_url"], timeout=15) as response:
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
                    urllib.request.urlopen(base.rstrip("/") + "/" + path, timeout=15)
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
        with urllib.request.urlopen(self.c["public_url"].rstrip("/") + "/api/health", timeout=15) as response:
            value = json.load(response)
            if response.status != 200 or value.get("service") != "saitena" or value.get("status") != "ok":
                raise RuntimeError("public_health_failed")
        if expected is not None and self.public_digest() != expected:
            raise RuntimeError("public_page_mismatch")
        self.protected_checks()


def transact(request, config, runtime):
    validate_request(request, config["image_repository"])
    if request["mode"] != config.get("release_mode", "public"):
        raise RuntimeError("server_release_mode_mismatch")
    state = Path(config["state_dir"])
    state.mkdir(mode=0o700, parents=True, exist_ok=True)
    journal = state / (request["release"] + ".json")
    for pending in state.glob("v*.json"):
        if json.loads(pending.read_text())["phase"] in ["switching", "manual_recovery_required", "staging"]:
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
    if current != original and hashlib.sha256(current).hexdigest() != entry["candidate_sha256"]:
        raise RuntimeError("routing_changed_since_release_manual_review_required")
    runtime.apply(original)
    runtime.rollback_checks(entry["baseline_digest"])
    entry["phase"] = "rolled_back"
    save(journal, entry)


def main():
    os.umask(0o077)
    def interrupted(signum, frame):
        raise RuntimeError("deployment_interrupted")
    for signum in [signal.SIGTERM, signal.SIGINT, signal.SIGHUP]:
        signal.signal(signum, interrupted)
    if os.geteuid() != 0:
        raise RuntimeError("restricted_root_helper_required")
    path = Path("/etc/saitena-deploy/config.json")
    if path.stat().st_uid != 0 or path.stat().st_mode & 0o022:
        raise RuntimeError("unsafe_config_permissions")
    config = json.loads(path.read_text())
    if config.get("enabled") is not True or config["public_url"] != "https://saitena.com/" or config.get("site_address", "saitena.com") != "saitena.com" or len(config.get("protected_urls", [])) < 4:
        raise RuntimeError("deployment_not_activated")
    Path(config["state_dir"]).mkdir(mode=0o700, parents=True, exist_ok=True)
    for protected in [Path(config["runtime_env"]), Path(config["state_dir"])]:
        if protected.stat().st_uid != 0 or protected.stat().st_mode & 0o077:
            raise RuntimeError("unsafe_private_path_permissions")
    with open(Path(config["state_dir"]) / "deploy.lock", "a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if len(sys.argv) == 3 and sys.argv[1] == "recover" and re.fullmatch(r"v\d+\.\d+\.\d+", sys.argv[2]):
            recover(Path(config["state_dir"]) / (sys.argv[2] + ".json"), Runtime(config))
            print(json.dumps({"status": "rolled_back"}))
        elif len(sys.argv) == 1:
            data = sys.stdin.buffer.read(8193)
            if len(data) > 8192:
                raise RuntimeError("oversized_request")
            print(json.dumps(transact(json.loads(data), config, Runtime(config))))
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
