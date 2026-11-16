import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

// A capability report, not release authorization. The deployment authorization
// always refuses inaccessible policy APIs; this report never changes that gate.
const repo = "techsolutionbg/saitena";
const results = {};
for (const path of ["branches/main/protection", "environments/production"]) {
  try {
    execFileSync("gh", ["api", `repos/${repo}/${path}`], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    results[path] = "readable";
  } catch {
    results[path] =
      "unavailable: owner read-only policy credential may be required";
  }
}
console.log(JSON.stringify(results));
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `\nDeployment API capability report (no deployment):\n\n${Object.entries(
      results,
    )
      .map(([path, result]) => `- ${path}: ${result}`)
      .join("\n")}\n`,
  );
