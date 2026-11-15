"""Disposable local real-Docker/Caddy rehearsal; no production endpoint or secret.

Registry authentication/pull is the sole stubbed boundary: locally built fixture
image IDs map to strict digest-shaped requests. Routing/health/recovery are real.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.request

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("agent", root / ".deployment/deploy_agent.py")
agent = importlib.util.module_from_spec(spec)
spec.loader.exec_module(agent)


def docker(*args):
    return subprocess.check_output(["docker", *args], text=True, stderr=subprocess.STDOUT).strip()


suffix = str(os.getpid())
prefix = "saitena-website-deploy-test-" + suffix
directory = root / "qa-output" / prefix
directory.mkdir(parents=True)
network = prefix
docker("network", "create", network)
images = {}
revisions = {}
for version in ["old", "good", "post-failure", "rollback-failure"]:
    sha = hashlib.sha256((prefix + version).encode()).hexdigest()[:40]
    tag = prefix + ":" + version
    docker("build", "--build-arg", "REVISION=" + sha, "-f", str(root / ".deployment/tests/fixture.Dockerfile"), "-t", tag, str(root))
    image_id = docker("image", "inspect", tag, "--format", "{{.Id}}")
    ref = "ghcr.io/techsolutionbg/saitena/public@" + image_id
    images[ref] = tag
    revisions[version] = (sha, ref)
old = prefix + "-old"
docker("run", "-d", "--name", old, "--network", network, images[revisions["old"][1]])
caddy = directory / "Caddyfile"
caddy.write_text(f"# BEGIN SAITENA PUBLIC\nhttp://localhost:8080 {{\n reverse_proxy {old}:3000\n}}\n# END SAITENA PUBLIC\nhttp://localhost:8081 {{\n respond /protected ok 200\n}}\n")
env = directory / "contact.env"
env.write_text("CONTACT_MAIL_MODE=smtp\nCONTACT_SMTP_HOST=mail.invalid\nCONTACT_SMTP_PORT=465\nCONTACT_SMTP_USER=fixture\nCONTACT_SMTP_PASSWORD=fixture-only\nCONTACT_MAIL_FROM=sender@example.test\nCONTACT_MAIL_TO=inbox@example.test\n")
env.chmod(0o600)
container = prefix + "-caddy"
docker("run", "-d", "--name", container, "--network", network, "-p", "127.0.0.1:18091:8080", "-p", "127.0.0.1:18092:8081", "--mount", f"type=bind,source={caddy},target=/etc/caddy/Caddyfile", "caddy:2.10-alpine")
config = {"image_repository":"ghcr.io/techsolutionbg/saitena/public", "network":network, "runtime_env":str(env), "caddy_file":str(caddy), "caddy_container":container, "public_url":"http://localhost:18091/", "site_address":"http://localhost:8080", "protected_urls":["http://localhost:18092/protected"]}
for attempt in range(60):
    try:
        agent.Runtime(config).public_checks()
        break
    except Exception:
        time.sleep(1)
else:
    raise RuntimeError("staging_fixture_failed_to_start")


class LocalRuntime(agent.Runtime):
    def __init__(self, config, failure=None):
        super().__init__(config)
        self.failure = failure
    def command(self, *args):
        if args[:2] == ("docker", "pull"):
            if args[2] not in images: raise RuntimeError("unreviewed_fixture")
            return "local fixture"
        return super().command(*(images.get(arg, arg) for arg in args))
    def apply(self, content):
        if self.failure == "rollback" and content == original:
            raise RuntimeError("simulated_reload_permission_failure")
        return super().apply(content)
    def public_checks(self, expected=None):
        super().public_checks(expected)
        if self.failure: raise RuntimeError("simulated_post_switch_failure")


results = []
for index, version in enumerate(["good", "post-failure", "rollback-failure"], start=1):
    original = caddy.read_bytes()
    sha, image = revisions[version]
    request = {"release":f"v1.0.{index}", "sha":sha, "image":image, "mode":"public"}
    config["state_dir"] = str(directory / version)
    runtime = LocalRuntime(config, None if version == "good" else "rollback" if version == "rollback-failure" else "post")
    try:
        result = agent.transact(request,config,runtime)
        assert version == "good" and result["status"] == "deployed"
    except RuntimeError as error:
        assert str(error) == ("manual_recovery_required" if version == "rollback-failure" else "rolled_back"), str(error)
    journal = Path(config["state_dir"]) / (request["release"] + ".json")
    runtime.failure = None
    agent.recover(journal,runtime)
    agent.recover(journal,runtime)
    assert caddy.read_bytes() == original
    assert docker("inspect", old, "--format", "{{.State.Running}}") == "true"
    results.append(version)
print(json.dumps({"passed":True,"real_container_scenarios":results,"old_container_running":True,"idempotent_recovery":True,"registry_boundary":"local-fixture-map-only"}))
# Resources stay isolated for diagnosis. No global cleanup or volume operations.
