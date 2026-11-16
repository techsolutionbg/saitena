import test from "node:test";
import assert from "node:assert/strict";
import { assertReleasePolicy } from "../scripts/release-policy.mjs";
const sha = "a".repeat(40);
const names = [
  "Run npm run lint",
  "Run npm run typecheck",
  "Run node --test tests/*.test.mjs",
  "Run python3 -m unittest discover -s tests -p 'test_deploy_agent.py' -v",
  "Run node scripts/audit-git-candidate.mjs",
  "Run npm run build",
  "Run node scripts/check-production-candidate.mjs",
  "Isolated HTTPS and SMTP integration",
  "Deployment failure and rollback rehearsal",
  "Private Preview build and privacy checks",
];
const fixture = () => ({
  approvalPolicy: { mode: "solo-maintainer", maintainers: ["techsolutionbg"] },
  actor: "techsolutionbg",
  triggeringActor: "techsolutionbg",
  confirmation: "v1.0.0",
  releaseMode: "public",
  modeConfirmation: "public",
  branchProtection: {
    required_status_checks: { contexts: ["verify"], strict: true },
    required_pull_request_reviews: {
      required_approving_review_count: 0,
      dismiss_stale_reviews: false,
    },
    enforce_admins: { enabled: true },
    allow_force_pushes: { enabled: false },
    allow_deletions: { enabled: false },
  },
  tag: "v1.0.0",
  sha,
  release: {
    tag_name: "v1.0.0",
    draft: false,
    prerelease: false,
    published_at: "2026-11-15",
    author: { login: "techsolutionbg" },
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
    can_admins_bypass: false,
    protection_rules: [
      {
        type: "required_reviewers",
        prevent_self_review: false,
        reviewers: [{ type: "User", reviewer: { login: "techsolutionbg" } }],
      },
    ],
    deployment_branch_policy: { protected_branches: true },
  },
});
test("only an exact protected main release passes", () =>
  assert.doesNotThrow(() => assertReleasePolicy(fixture())));
test("preview retains main, owner and environment gates and needs its own mode confirmation", () => {
  const x = fixture();
  x.releaseMode = x.modeConfirmation = "private-preview";
  assert.doesNotThrow(() => assertReleasePolicy(x));
  for (const mutate of [
    (y) => (y.modeConfirmation = "public"),
    (y) => (y.releaseMode = "other"),
    (y) => (y.run.head_branch = "dev"),
    (y) => (y.environment.can_admins_bypass = true),
    (y) => (y.actor = "other"),
  ]) {
    const y = structuredClone(x);
    mutate(y);
    assert.throws(() => assertReleasePolicy(y));
  }
});
test("solo approval is explicit and cannot be silently treated as independent review", () => {
  for (const mutate of [
    (x) => (x.actor = "other"),
    (x) => (x.triggeringActor = "other"),
    (x) => (x.confirmation = ""),
    (x) => (x.release.author.login = "other"),
    (x) => (x.environment.can_admins_bypass = true),
    (x) => (x.environment.protection_rules[0].reviewers = []),
    (x) => (x.environment.protection_rules[0].prevent_self_review = true),
    (x) => (x.branchProtection.required_pull_request_reviews = null),
    (x) =>
      (x.branchProtection.required_pull_request_reviews.required_approving_review_count = 1),
  ]) {
    const x = fixture();
    mutate(x);
    assert.throws(() => assertReleasePolicy(x));
  }
});
test("missing or bypassable main protection is not an approved release", () => {
  for (const mutate of [
    (x) => (x.branchProtection = undefined),
    (x) => (x.branchProtection.required_status_checks.contexts = []),
    (x) => (x.branchProtection.allow_force_pushes.enabled = true),
    (x) => (x.branchProtection.enforce_admins.enabled = false),
  ]) {
    const x = fixture();
    mutate(x);
    assert.throws(() => assertReleasePolicy(x));
  }
});
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
    (x) => (x.run.head_branch = "dev"),
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
