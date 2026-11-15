export function assertReleasePolicy({
  tag,
  release,
  sha,
  run,
  jobs,
  environment,
  branchProtection,
}) {
  const reject = (message) => {
    throw new Error(message);
  };
  const contexts = [
    ...(branchProtection?.required_status_checks?.contexts ?? []),
    ...(branchProtection?.required_status_checks?.checks ?? []).map(
      (c) => c.context,
    ),
  ];
  if (
    !contexts.includes("verify") ||
    branchProtection?.required_status_checks?.strict !== true ||
    (branchProtection?.required_pull_request_reviews
      ?.required_approving_review_count ?? 0) < 1 ||
    branchProtection?.required_pull_request_reviews?.dismiss_stale_reviews !==
      true ||
    branchProtection?.enforce_admins?.enabled !== true ||
    branchProtection?.allow_force_pushes?.enabled !== false ||
    branchProtection?.allow_deletions?.enabled !== false
  )
    reject(
      "Actual main protection with required CI and independent PR review is required",
    );
  if (
    !/^v\d+\.\d+\.\d+$/.test(tag) ||
    release.tag_name !== tag ||
    release.draft ||
    release.prerelease ||
    !release.published_at
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
    "Run node scripts/audit-git-candidate.mjs",
    "Run npm run build",
    "Run node scripts/check-production-candidate.mjs",
    "Isolated HTTPS and SMTP integration",
    "Deployment failure and rollback rehearsal",
  ]) {
    if (
      !jobs[0].steps.some((s) => s.name === name && s.conclusion === "success")
    )
      reject(`Required check missing: ${name}`);
  }
  const rule = environment.protection_rules?.find(
    (r) => r.type === "required_reviewers",
  );
  if (
    !rule?.reviewers?.length ||
    rule.prevent_self_review !== true ||
    environment.deployment_branch_policy?.protected_branches !== true
  )
    reject(
      "Protected production environment with independent reviewers is required",
    );
}
