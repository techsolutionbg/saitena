import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import fcntl

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
                      preview_access={"approved":False,"origin_token":"f"*64,"owner_ips":["203.0.113.7"],"cloudflare_cidrs":["192.0.2.0/24"]})
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


if __name__ == "__main__": unittest.main()
