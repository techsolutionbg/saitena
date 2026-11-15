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
        self.request = {"release":"v1.0.0", "sha":"a"*40, "image":self.config["image_repository"]+"@sha256:"+"b"*64}
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


if __name__ == "__main__": unittest.main()
