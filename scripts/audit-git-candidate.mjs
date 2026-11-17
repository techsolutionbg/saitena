import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { isPrivatePlatformPath } from "./public-source-boundary.mjs";
const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 80 * 1024 * 1024 });
const paths = [
  ...new Set(
    git("ls-files", "--cached", "--others", "--exclude-standard", "-z")
      .split("\0")
      .filter(Boolean),
  ),
];
const forbidden =
  /(^|\/)(?:\.env(?:\.(?!example$).*)?|node_modules|\.next|qa-output|secrets)(?:\/|$)|\.(?:pem|key|pfx|p12|tar|zip|bak|log)$/i;
const patterns = [
  /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/,
  /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsk_live_[A-Za-z0-9]{16,}/,
  /(?:password|api[_-]?key|secret|token)\s*[:=]\s*["'][^"'\s]{20,}["']/i,
];
const findings = [];
let binary = 0;
for (const path of paths) {
  if (isPrivatePlatformPath(path))
    findings.push({ path, kind: "private-platform-in-public-repository" });
  if (
    (forbidden.test(path) || /(?:^|\/)[^/]*\.env(?:\.[^/]*)?$/i.test(path)) &&
    !path.endsWith(".env.example")
  )
    findings.push({ path, kind: "forbidden-path" });
  if (!statSync(path).isFile()) continue;
  const data = readFileSync(path);
  if (data.includes(0)) {
    binary++;
    continue;
  }
  const lines = data.toString("utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (patterns.some((pattern) => pattern.test(line)))
      findings.push({ path, line: index + 1, kind: "review-secret-pattern" });
  });
}
// History scan reports hashes only; never prints a matching secret value.
const history = [];
for (const commit of git("rev-list", "--all")
  .trim()
  .split("\n")
  .filter(Boolean)) {
  const patch = git("show", "--format=", "--no-ext-diff", commit);
  if (patterns.some((pattern) => pattern.test(patch))) history.push(commit);
}
console.log(
  JSON.stringify(
    {
      files: paths.length,
      binaryFilesRequiringManualReview: binary,
      findings,
      historyCommitsWithPatterns: history,
    },
    null,
    2,
  ),
);
if (findings.length || history.length) process.exitCode = 1;
