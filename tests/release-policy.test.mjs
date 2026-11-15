import test from "node:test";
import assert from "node:assert/strict";
import { assertReleasePolicy } from "../scripts/release-policy.mjs";
const sha = "a".repeat(40);
const names = [
  "Run npm run lint",
  "Run npm run typecheck",
  "Run node --test tests/*.test.mjs",
  "Run node scripts/audit-git-candidate.mjs",
  "Run npm run build",
  "Run node scripts/check-production-candidate.mjs",
  "Isolated HTTPS and SMTP integration",
  "Deployment failure and rollback rehearsal",
];
const fixture = () => ({
  tag: "v1.0.0",
  sha,
  release: {
    tag_name: "v1.0.0",
    draft: false,
    prerelease: false,
    published_at: "2026-11-15",
  },
  run: {
    head_sha: sha,
    head_branch: "main",
    event: "push",
    status: "completed",
    conclusion: "success",
    path: ".github/workflows/checks.yml",
  },
  jobs: [
    {
      name: "verify",
      status: "completed",
      conclusion: "success",
      steps: names.map((name) => ({
        name,
        status: "completed",
        conclusion: "success",
      })),
    },
  ],
  environment: {
    protection_rules: [
      {
        type: "required_reviewers",
        prevent_self_review: true,
        reviewers: [{ type: "Team" }],
      },
    ],
    deployment_branch_policy: { protected_branches: true },
  },
});
test("only an exact protected main release passes", () =>
  assert.doesNotThrow(() => assertReleasePolicy(fixture())));
test("failed/skipped/cancelled/incomplete CI can never authorize deployment", () => {
  for (const conclusion of ["failure", "skipped", "cancelled", null]) {
    const x = fixture();
    x.run.conclusion = conclusion;
    assert.throws(() => assertReleasePolicy(x));
  }
  for (const conclusion of ["failure", "skipped", null]) {
    const x = fixture();
    x.jobs[0].steps[0].conclusion = conclusion;
    assert.throws(() => assertReleasePolicy(x));
  }
});
test("PR artifacts, wrong SHA, missing tests, draft releases and unprotected environment are refused", () => {
  for (const mutate of [
    (x) => (x.run.event = "pull_request"),
    (x) => (x.run.head_sha = "b".repeat(40)),
    (x) => x.jobs[0].steps.pop(),
    (x) => (x.release.draft = true),
    (x) => (x.environment.protection_rules = []),
    (x) => (x.tag = "arbitrary-commit"),
  ]) {
    const x = fixture();
    mutate(x);
    assert.throws(() => assertReleasePolicy(x));
  }
});
