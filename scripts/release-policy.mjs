export function assertReleasePolicy({
  tag,
  release,
  sha,
  run,
  jobs,
  environment,
  branchProtection,
  approvalPolicy,
  actor,
  triggeringActor,
  confirmation,
  releaseMode = "public",
  modeConfirmation,
  source = "release",
  mainSha,
}) {
  const reject = (message) => {
    throw new Error(message);
  };
  if (
    !["public", "private-preview", "public-demo"].includes(releaseMode) ||
    modeConfirmation !== releaseMode
  )
    reject("Explicit release mode confirmation is required");
  if (
    approvalPolicy?.mode !== "solo-maintainer" ||
    !approvalPolicy.maintainers?.includes(actor) ||
    !approvalPolicy.maintainers.includes(triggeringActor) ||
    (source === "release" &&
      (confirmation !== tag ||
        !approvalPolicy.maintainers.includes(release?.author?.login))) ||
    (source === "main" && (confirmation !== sha || mainSha !== sha)) ||
    !["release", "main"].includes(source)
  )
    reject("Explicit solo-maintainer release authorization is required");
  const contexts = [
    ...(branchProtection?.required_status_checks?.contexts ?? []),
    ...(branchProtection?.required_status_checks?.checks ?? []).map(
      (c) => c.context,
    ),
  ];
  if (
    !contexts.includes("verify") ||
    branchProtection?.required_status_checks?.strict !== true ||
    branchProtection?.required_pull_request_reviews
      ?.required_approving_review_count !== 0 ||
    branchProtection?.required_pull_request_reviews
      ?.require_code_owner_reviews === true ||
    branchProtection?.required_pull_request_reviews
      ?.require_last_push_approval === true ||
    branchProtection?.enforce_admins?.enabled !== true ||
    branchProtection?.allow_force_pushes?.enabled !== false ||
    branchProtection?.allow_deletions?.enabled !== false
  )
    reject("Actual solo main protection with mandatory CI and PR is required");
  if (
    source === "release" &&
    (!/^v\d+\.\d+\.\d+$/.test(tag) ||
      release.tag_name !== tag ||
      release.draft ||
      release.prerelease ||
      !release.published_at)
  )
    reject("A published stable release is required");
  if (!/^[a-f0-9]{40}$/.test(sha)) reject("Invalid commit SHA");
  if (
    run.head_sha !== sha ||
    run.head_branch !== "main" ||
    run.event !== "push" ||
    run.status !== "completed" ||
    run.conclusion !== "success" ||
    run.path !== ".github/workflows/checks.yml"
  )
    reject("Exact main commit must have successful push CI");
  if (
    jobs.length !== 1 ||
    jobs[0].name !== "verify" ||
    jobs[0].status !== "completed" ||
    jobs[0].conclusion !== "success" ||
    !jobs[0].steps.length ||
    jobs[0].steps.some(
      (s) => s.status !== "completed" || s.conclusion !== "success",
    )
  )
    reject("Failed, skipped or incomplete CI is not eligible");
  for (const name of [
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
  ]) {
    if (
      !jobs[0].steps.some((s) => s.name === name && s.conclusion === "success")
    )
      reject(`Required check missing: ${name}`);
  }
  if (source === "main" && releaseMode !== "public-demo")
    reject(
      "Automatic deployment may only update the approved public-demo site",
    );
  if (
    source === "main" &&
    !jobs[0].steps.some(
      (s) =>
        s.name === "Public demo origin guard and rollback rehearsal" &&
        s.conclusion === "success",
    )
  )
    reject("Public demo guard and rollback rehearsal is required");
  if (
    releaseMode === "public-demo" &&
    !jobs[0].steps.some(
      (s) =>
        s.name === "Public demo build and privacy checks (no publication)" &&
        s.conclusion === "success",
    )
  )
    reject("Public demo CI is required");
  const rule = environment.protection_rules?.find(
    (r) => r.type === "required_reviewers",
  );
  if (
    !rule?.reviewers?.length ||
    !rule.reviewers.some(
      (r) =>
        r.type === "User" &&
        approvalPolicy.maintainers.includes(r.reviewer?.login),
    ) ||
    rule.prevent_self_review !== false ||
    environment.can_admins_bypass !== false ||
    environment.deployment_branch_policy?.protected_branches !== true
  )
    reject(
      "Protected production environment with explicit owner review is required (not independent review)",
    );
}
