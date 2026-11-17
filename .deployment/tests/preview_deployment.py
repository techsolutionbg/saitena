"""Real isolated Caddy/Docker preview rehearsal. CF edge and registry transport are fixtures."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.request
import deploy_agent as agent

def docker(*args):
    return subprocess.check_output(["docker", *args], text=True, stderr=subprocess.STDOUT).strip()

prefix=os.environ["FIXTURE_PREFIX"]
network=prefix
caddy_name=prefix+"-caddy"
volume=prefix+"-state"
images={}
for version in ["old","new"]:
    image=prefix+":"+version
    digest=docker("image","inspect",image,"--format","{{.Id}}")
    images["ghcr.io/techsolutionbg/saitena/public@"+digest]=image
old=prefix+"-old"
docker("run","-d","--name",old,"--network",network,images[next(iter(images))])
cidr=json.loads(docker("network","inspect",network))[0]["IPAM"]["Config"][0]["Subnet"]
config={"release_mode":"private-preview","image_repository":"ghcr.io/techsolutionbg/saitena/public","network":network,
        "runtime_env":"/work/contact.env","caddy_file":"/work/Caddyfile","caddy_container":caddy_name,
        "site_address":"http://:8080","public_url":"http://"+caddy_name+":8080/",
        "protected_urls":["http://"+caddy_name+":8081/protected"],
        "preview_access":{"approved":True,"owner_ips":["203.0.113.7"],"cloudflare_cidrs":[cidr],"secret_import":agent.PREVIEW_IMPORT}}

# Only a disposable, known fixture value. No production key is mounted/read.
secret=Path('/work/saitena-preview-key.caddy')
secret.write_text('header X-Saitena-Preview-Key '+"f"*64+'\n');secret.chmod(0o600)
agent.REGISTRY_CONFIG='/work/registry'
Path(agent.REGISTRY_CONFIG).mkdir(mode=0o700)
credentials=Path(agent.REGISTRY_CONFIG)/'config.json'
credentials.write_text('{}');credentials.chmod(0o600)
env=Path(config["runtime_env"])
env.write_text("CONTACT_MAIL_MODE=disabled\n");env.chmod(0o600)
route=Path(config["caddy_file"])
original=b"# BEGIN SAITENA PUBLIC\n"+agent.Runtime(config).preview_block(old)+b"# END SAITENA PUBLIC\nhttp://:8081 {\n respond /protected ok 200\n}\n"
route.write_bytes(original)
docker("run","-d","--name",caddy_name,"--network",network,"--mount",f"type=volume,source={volume},target=/etc/caddy","--mount",f"type=volume,source={volume},target=/config/caddy","caddy:2.10-alpine")

def get(path="", headers=None):
    return urllib.request.urlopen(urllib.request.Request(config["public_url"]+path,headers=headers or {}),timeout=10)

class FixtureRuntime(agent.Runtime):
    fail=False
    def registry_pull(self,image):
        if image not in images:raise RuntimeError("unknown_fixture_image")
    def command(self,*args):
        return super().command(*(images.get(arg,arg) for arg in args))
    def preview_external_checks(self):
        # Real Caddy denial, simulated edge: no CF-Ray assertion in an offline fixture.
        for path in ["","api/health","robots.txt"]:
            try:get(path)
            except urllib.error.HTTPError as e:
                if e.code==403:continue
            raise RuntimeError("fixture_external_not_blocked")
    def public_checks(self,expected=None):
        super().public_checks(expected)
        if self.fail:raise RuntimeError("injected_preview_post_switch_failure")
    def apply(self,content):
        if self.fail=='rollback' and content==original:
            raise RuntimeError('injected_restore_failure')
        return super().apply(content)

runtime=FixtureRuntime(config)
for attempt in range(60):
    try:runtime.public_checks();break
    except Exception:time.sleep(1)
else:raise RuntimeError("preview_fixture_not_ready")

allowed={"X-Saitena-Preview-Key":"f"*64,"CF-Connecting-IP":"203.0.113.7"}
assert get(headers=allowed).status==200
assert get('preview-header-present',headers=allowed).read()==b'absent'
with get('conflicting-cache-headers',headers=allowed) as response:
    assert response.headers.get('Cache-Control')=='private, no-store','upstream cache policy was not overridden'
    assert response.headers.get('X-Robots-Tag')=='noindex, nofollow, noarchive','upstream indexing policy was not overridden'
denials=0
for headers in [{},{"CF-Connecting-IP":"203.0.113.7"},dict(allowed,**{"CF-Connecting-IP":"203.0.113.8"}),dict(allowed,**{"CF-Worker":"other.example"}),dict(allowed,**{"X-Saitena-Preview-Key":"e"*64})]:
    try:get(headers=headers)
    except urllib.error.HTTPError as e:
        assert e.code==403;denials+=1;continue
    raise AssertionError("unexpected preview access")
# Even the correct token and spoofed home header cannot bypass the CF peer check from loopback.
try:docker("exec",caddy_name,"wget","-qO-","--header=X-Saitena-Preview-Key: "+"f"*64,"--header=CF-Connecting-IP: 203.0.113.7","http://127.0.0.1:8080/")
except subprocess.CalledProcessError:denials+=1
else:raise AssertionError("direct peer bypass")

sha=hashlib.sha256((prefix+"new").encode()).hexdigest()[:40]
image=list(images)[1]
request={"release":"v2.0.1","sha":sha,"image":image,"mode":"private-preview"}
for fail in [False,'post-switch','rollback']:
    config["state_dir"]="/work/"+(fail or "success")
    runtime.fail=fail
    try:
        result=agent.transact(request,config,runtime)
        assert not fail and result["status"]=="deployed"
    except RuntimeError as error:
        assert fail and str(error)==('fail_closed_manual_recovery_required' if fail=='rollback' else 'rolled_back'),str(error)
        if fail=='rollback':
            try:get(headers=allowed)
            except urllib.error.HTTPError as denied:
                assert denied.code==403
            else:raise AssertionError('fallback allowed access')
    runtime.fail=False
    journal=Path(config["state_dir"])/(request["release"]+".json")
    agent.recover(journal,runtime);agent.recover(journal,runtime)
    assert route.read_bytes()==original
    assert docker("inspect",old,"--format","{{.State.Running}}" )=="true"
    # Keep image/journal/volume; only remove the newly created test candidate so the next scenario can stage it.
    name="saitena-website-public-"+sha[:16]
    docker("stop",name);docker("rm",name)
print(json.dumps({"passed":True,"allowed_fixture_request":True,"denial_cases":denials,"real_preview_switch":True,"post_switch_rollback":True,"failed_rollback_denies_access":True,"idempotent_recovery":True,"old_container_retained":True,"external_boundaries":"CF and registry simulated; no production access"}))
