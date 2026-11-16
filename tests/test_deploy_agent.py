import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import fcntl
import subprocess
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("agent", Path(__file__).resolve().parents[1] / ".deployment/deploy_agent.py")
agent = importlib.util.module_from_spec(spec)
spec.loader.exec_module(agent)


class FakeRuntime:
    def __init__(self, fail=None):
        self.content = b"old-route"
        self.fail = fail
        self.staged = False
        self.applies = 0

    def route(self): return self.content
    def candidate_route(self, old, name): return b"new-route"
    def public_digest(self): return "old-page"
    def protected_checks(self): pass
    def validate(self, content): pass
    def stage(self, request, name):
        self.staged = True
        if self.fail == "stage": raise RuntimeError("fixture_failure")
    def candidate_checks(self, name): return "new-page"
    def apply(self, content):
        self.applies += 1
        if self.fail == "rollback" and content == b"old-route": raise RuntimeError("fixture_failure")
        self.content = content
    def public_checks(self, expected=None):
        if self.fail in ["public", "rollback"]: raise RuntimeError("fixture_failure")
    def rollback_checks(self, expected):
        if self.content != b"old-route": raise RuntimeError("fixture_failure")


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.config = {"image_repository":"ghcr.io/techsolutionbg/saitena/public", "state_dir":self.temp.name}
        self.request = {"release":"v1.0.0", "sha":"a"*40, "image":self.config["image_repository"]+"@sha256:"+"b"*64, "mode":"public"}
        registry=Path(self.temp.name)/"registry"
        registry.mkdir(mode=0o700)
        credentials=registry/"config.json"
        credentials.write_text("{}")
        credentials.chmod(0o600)
        self.addCleanup(patch.stopall)
        patch.object(agent,"REGISTRY_CONFIG",str(registry)).start()
    def phase(self): return json.loads((Path(self.temp.name)/"v1.0.0.json").read_text())["phase"]
    def test_success_and_idempotent_redeploy(self):
        runtime = FakeRuntime()
        self.assertEqual(agent.transact(self.request,self.config,runtime)["status"],"deployed")
        self.assertEqual(agent.transact(self.request,self.config,runtime)["status"],"already_deployed")
        self.assertEqual(runtime.applies,1)
    def test_startup_failure_never_switches_traffic(self):
        runtime=FakeRuntime("stage")
        with self.assertRaisesRegex(RuntimeError,"failed_before_switch"): agent.transact(self.request,self.config,runtime)
        self.assertEqual(runtime.content,b"old-route")
        self.assertEqual(runtime.applies,0)
    def test_failed_post_switch_restores_previous_route(self):
        runtime=FakeRuntime("public")
        with self.assertRaisesRegex(RuntimeError,"rolled_back"): agent.transact(self.request,self.config,runtime)
        self.assertEqual(runtime.content,b"old-route")
        self.assertEqual(self.phase(),"rolled_back")
        agent.recover(Path(self.temp.name)/"v1.0.0.json",runtime)
        agent.recover(Path(self.temp.name)/"v1.0.0.json",runtime)
    def test_failed_rollback_retains_journal_and_supports_manual_recovery(self):
        runtime=FakeRuntime("rollback")
        with self.assertRaisesRegex(RuntimeError,"manual_recovery_required"): agent.transact(self.request,self.config,runtime)
        self.assertEqual(self.phase(),"manual_recovery_required")
        runtime.fail=None
        agent.recover(Path(self.temp.name)/"v1.0.0.json",runtime)
        self.assertEqual(runtime.content,b"old-route")
    def test_mutated_identity_and_untrusted_image_are_rejected(self):
        for change in [{"release":"../bad"},{"image":"other/image:latest"},{"sha":"main"},{"extra":"arbitrary-command"}]:
            with self.assertRaises(ValueError): agent.validate_request(dict(self.request,**change),self.config["image_repository"])
    def test_concurrent_lock_refuses_second_deployment(self):
        path=Path(self.temp.name)/"lock"
        with path.open("a") as first, path.open("a") as second:
            fcntl.flock(first,fcntl.LOCK_EX|fcntl.LOCK_NB)
            with self.assertRaises(BlockingIOError): fcntl.flock(second,fcntl.LOCK_EX|fcntl.LOCK_NB)
    def test_recovery_refuses_unrelated_later_routing(self):
        runtime=FakeRuntime("public")
        with self.assertRaises(RuntimeError): agent.transact(self.request,self.config,runtime)
        runtime.content=b"later-release"
        with self.assertRaisesRegex(RuntimeError,"routing_changed_since"): agent.recover(Path(self.temp.name)/"v1.0.0.json",runtime)
    def test_automatic_rollback_preserves_concurrent_operator_edit(self):
        runtime=FakeRuntime()
        def changed(expected=None):
            runtime.content=b"operator-change"
            raise RuntimeError("fixture_failure")
        runtime.public_checks=changed
        with self.assertRaisesRegex(RuntimeError,"manual_recovery_required"): agent.transact(self.request,self.config,runtime)
        self.assertEqual(runtime.content,b"operator-change")

    def test_preview_mode_cannot_use_public_server_configuration(self):
        request = dict(self.request, mode="private-preview")
        with self.assertRaisesRegex(RuntimeError, "server_release_mode_mismatch"):
            agent.transact(request, self.config, FakeRuntime())

    def test_preview_recovery_cannot_restore_an_old_public_release(self):
        runtime=FakeRuntime()
        agent.transact(self.request,self.config,runtime)
        runtime.c={"release_mode":"private-preview"}
        applies=runtime.applies
        with self.assertRaisesRegex(RuntimeError,"recovery_release_mode_mismatch"):
            agent.recover(Path(self.temp.name)/"v1.0.0.json",runtime)
        self.assertEqual(runtime.applies,applies)

    def test_preview_rejects_public_image_before_container_start(self):
        env=Path(self.temp.name)/"preview.env"
        env.write_text("CONTACT_MAIL_MODE=disabled\n");env.chmod(0o600)
        runtime=agent.Runtime(dict(self.config,runtime_env=str(env)))
        runtime.registry_pull=lambda image: None
        calls=[]
        def command(*args):
            calls.append(args)
            if args[:3]==("docker","image","inspect"):
                return self.request["sha"] if "revision" in args[-1] else "public"
            return ""
        runtime.command=command
        with self.assertRaisesRegex(RuntimeError,"image_mode_mismatch"):
            runtime.stage(dict(self.request,mode="private-preview"),"never-started")
        self.assertFalse(any(c[:2]==("docker","run") for c in calls))

    def test_preview_requires_approved_access_exact_ips_and_guarded_rollback(self):
        config = dict(self.config, release_mode="private-preview", site_address="saitena.com",
                      preview_access={"approved":False,"secret_import":agent.PREVIEW_IMPORT,"owner_ips":["203.0.113.7"],"cloudflare_cidrs":["192.0.2.0/24"]})
        runtime = agent.Runtime(config)
        original = b"# BEGIN SAITENA PUBLIC\nold public routing\n# END SAITENA PUBLIC\n# api/admin/clients untouched\n"
        with self.assertRaisesRegex(RuntimeError,"preview_access_not_approved"):
            runtime.candidate_route(original,"candidate")
        config["preview_access"]["approved"]=True
        for bad in [[], ["0.0.0.0/0"], ["203.0.113.7 or true"]]:
            config["preview_access"]["owner_ips"]=bad
            with self.assertRaises(RuntimeError): runtime.candidate_route(original,"candidate")
        config["preview_access"]["owner_ips"]=["203.0.113.7"]
        candidate=runtime.candidate_route(original,"candidate")
        self.assertTrue(candidate.endswith(b"# api/admin/clients untouched\n"))
        self.assertIn(b"bind 127.0.0.1",candidate)
        self.assertIn(b"header_up -X-Saitena-Preview-Key",candidate)
        with self.assertRaisesRegex(RuntimeError,"guarded_preview_bootstrap_required"):
            runtime.preview_preflight(original,"candidate")
        runtime.preview_external_checks=lambda: None
        runtime.preview_preflight(candidate,"next-candidate")

    def test_inline_secret_or_alternate_import_is_rejected(self):
        for change in [{"origin_token":"fixture-only"},{"secret_import":"/tmp/other.caddy"}]:
            access={"approved":True,"secret_import":agent.PREVIEW_IMPORT,"owner_ips":["203.0.113.7"],"cloudflare_cidrs":["192.0.2.0/24"],**change}
            with self.assertRaisesRegex(RuntimeError,"preview_access_not_approved"):
                agent.Runtime({"preview_access":access}).preview_block("candidate")

    def test_candidate_validation_failure_prevents_staging_and_switch(self):
        runtime=FakeRuntime()
        def invalid(content): raise RuntimeError("invalid_candidate")
        runtime.validate=invalid
        with self.assertRaisesRegex(RuntimeError,"invalid_candidate"):
            agent.transact(self.request,self.config,runtime)
        self.assertFalse(runtime.staged)
        self.assertEqual(runtime.applies,0)

    def test_apply_validates_before_modifying_mounted_inode(self):
        route=Path(self.temp.name)/"Caddyfile"
        route.write_bytes(b"original")
        runtime=agent.Runtime({"caddy_file":str(route)})
        def invalid(content): raise RuntimeError("invalid_candidate")
        runtime.validate=invalid
        with self.assertRaisesRegex(RuntimeError,"invalid_candidate"): runtime.apply(b"invalid")
        self.assertEqual(route.read_bytes(),b"original")

    def test_registry_symlinks_and_broad_permissions_are_rejected(self):
        registry=Path(agent.REGISTRY_CONFIG)
        credentials=registry/"config.json"
        credentials.chmod(0o644)
        with self.assertRaisesRegex(RuntimeError,"unsafe_private_path_permissions"): agent.private_path(credentials)
        credentials.chmod(0o600)
        link=registry/"link"
        link.symlink_to(credentials)
        with self.assertRaisesRegex(RuntimeError,"unsafe_private_path_permissions"): agent.private_path(link)

    def test_registry_pull_uses_only_dedicated_root_config(self):
        runtime=agent.Runtime({"registry_config":"/client/supplied/ignored"})
        calls=[]
        runtime.command=lambda *args: calls.append(args)
        with patch.object(agent,"private_path") as metadata:
            runtime.registry_pull(self.request["image"])
            self.assertEqual(metadata.call_count,2)
        self.assertEqual(calls,[("docker","--config",agent.REGISTRY_CONFIG,"pull",self.request["image"])])

    def test_restricted_login_shell_rejects_interactive_and_arbitrary_commands(self):
        shell=Path(__file__).resolve().parents[1]/".deployment/restricted-shell"
        for args in [[],["-i"],["-c","id"],["-c","/bin/bash"],["-c","sudo anything"],["-c","/usr/bin/sudo -n /usr/local/libexec/saitena-deploy recover v1.0.0"]]:
            result=subprocess.run(["/bin/sh",str(shell),*args],capture_output=True,timeout=5)
            self.assertEqual(result.returncode,126)

    def test_http_probe_keeps_502_as_failure_and_sets_user_agent(self):
        from urllib.error import HTTPError
        def reject(request,timeout):
            self.assertEqual(request.get_header("User-agent"),agent.PROBE_USER_AGENT)
            raise HTTPError(request.full_url,502,"fixture failure",{},None)
        with patch.object(agent.urllib.request,"urlopen",side_effect=reject):
            with self.assertRaises(HTTPError):
                agent.Runtime({"protected_urls":["https://clients.example.test/"]}).protected_checks()

    def test_fail_closed_preserves_other_virtual_hosts(self):
        runtime=agent.Runtime({})
        prefix=b"# protected prefix\n"
        suffix=b"\napi.example.test { respond ok }\n"
        original=prefix+b"# BEGIN SAITENA PUBLIC\nold\n# END SAITENA PUBLIC"+suffix
        fallback=runtime.fail_closed_route(original)
        self.assertTrue(fallback.startswith(prefix))
        self.assertTrue(fallback.endswith(suffix))
        self.assertIn(b'respond "Forbidden" 403',fallback)
        self.assertNotIn(b"reverse_proxy",fallback)

    def test_preview_failed_rollback_closes_access_and_blocks_new_release(self):
        config=dict(self.config,release_mode="private-preview")
        request=dict(self.request,mode="private-preview")
        runtime=FakeRuntime("rollback")
        runtime.preview_preflight=lambda original,name: None
        runtime.fail_closed_route=lambda original: b"deny-all-route"
        def close(original): runtime.content=b"deny-all-route"
        runtime.fail_closed=close
        with self.assertRaisesRegex(RuntimeError,"fail_closed_manual_recovery_required"):
            agent.transact(request,config,runtime)
        self.assertEqual(runtime.content,b"deny-all-route")
        with self.assertRaisesRegex(RuntimeError,"unfinished_release_requires_recovery"):
            agent.transact(dict(request,release="v1.0.1"),config,runtime)
        runtime.fail=None
        runtime.c=config
        agent.recover(Path(self.temp.name)/"v1.0.0.json",runtime)
        self.assertEqual(runtime.content,b"old-route")


if __name__ == "__main__": unittest.main()
