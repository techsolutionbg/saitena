import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { assertReleasePolicy } from "./release-policy.mjs";
const tag = process.env.RELEASE_TAG;
const repo = process.env.GITHUB_REPOSITORY;
if (
  !/^v\d+\.\d+\.\d+$/.test(tag ?? "") ||
  repo !== "techsolutionbg/saitena" ||
  process.env.GITHUB_REF !== "refs/heads/main"
)
  throw new Error(
    "Release must be dispatched from main in the approved repository",
  );
const api = (path) =>
  JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8" }));
const sha = execFileSync("git", ["rev-parse", `${tag}^{commit}`], {
  encoding: "utf8",
}).trim();
execFileSync("git", ["merge-base", "--is-ancestor", sha, "origin/main"]);
const release = api(`repos/${repo}/releases/tags/${tag}`);
const runs = api(
  `repos/${repo}/actions/workflows/checks.yml/runs?branch=main&event=push&head_sha=${sha}&per_page=100`,
).workflow_runs;
const run = runs.find((r) => r.head_sha === sha);
if (!run) throw new Error("No CI run for exact release commit");
const jobs = api(`repos/${repo}/actions/runs/${run.id}/jobs?per_page=100`).jobs;
const environment = api(`repos/${repo}/environments/production`);
const branchProtection = api(`repos/${repo}/branches/main/protection`);
assertReleasePolicy({ tag, release, sha, run, jobs, environment, branchProtection });
appendFileSync(process.env.GITHUB_OUTPUT, `sha=${sha}\nci_run=${run.id}\n`);
