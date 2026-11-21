import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { assertReleasePolicy } from "./release-policy.mjs";
import { deploymentProfile } from "./deployment-profile.mjs";

const repo = "techsolutionbg/saitena";
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
if (
  process.env.GITHUB_REPOSITORY !== repo ||
  process.env.GITHUB_REF !== "refs/heads/main" ||
  process.env.GITHUB_EVENT_NAME !== "workflow_run"
)
  throw Error("Only main CI completion can request automatic deployment");
const api = (path) =>
  JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8" }));
const id = event.workflow_run?.id;
if (!Number.isSafeInteger(id)) throw Error("Invalid CI identity");
const run = api(`repos/${repo}/actions/runs/${id}`);
if (
  run.repository?.full_name !== repo ||
  run.head_repository?.full_name !== repo ||
  run.id !== id
)
  throw Error("Foreign CI is ineligible");
const sha = run.head_sha;
const mainSha = execFileSync("git", ["rev-parse", "origin/main"], {
  encoding: "utf8",
}).trim();
const pulls = api(`repos/${repo}/commits/${sha}/pulls`);
if (
  !pulls.some(
    (pr) =>
      pr.merged_at &&
      pr.merge_commit_sha === sha &&
      pr.base?.ref === "main" &&
      pr.base?.repo?.full_name === repo,
  )
)
  throw Error("Exact commit must be merged through a main pull request");
const profile = deploymentProfile();
assertReleasePolicy({
  source: "main",
  sha,
  mainSha,
  run,
  jobs: api(`repos/${repo}/actions/runs/${id}/jobs?per_page=100&filter=latest`)
    .jobs,
  environment: api(`repos/${repo}/environments/production`),
  branchProtection: api(`repos/${repo}/branches/main/protection`),
  approvalPolicy: JSON.parse(
    readFileSync(".deployment/solo-maintainer.json", "utf8"),
  ),
  actor: process.env.GITHUB_ACTOR,
  triggeringActor: process.env.GITHUB_TRIGGERING_ACTOR,
  confirmation: sha,
  releaseMode: profile.mode,
  modeConfirmation: profile.mode,
  authApprovalOnly: profile.authApprovalOnly,
});
appendFileSync(
  process.env.GITHUB_OUTPUT,
  `sha=${sha}\nci_run=${id}\nrelease=main-${sha}\nmode=${profile.mode}\nprelaunch=${profile.prelaunch}\n`,
);
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `Verified merged main commit: \`${sha}\`\n\nCI: https://github.com/${repo}/actions/runs/${id}\n\nDeployment requires the production owner review. Auth images are approval-only; activation remains a separate coordinated owner SSH procedure.\n`,
  );
