import { releaseBlockers } from "./release-readiness.mjs";
const blockers = releaseBlockers();
if (blockers.length) {
  console.error("PUBLIC RELEASE BLOCKED:\n" + blockers.join("\n"));
  process.exitCode = 1;
}
