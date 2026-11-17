import { releaseBlockers } from "./release-readiness.mjs";
const mode = process.env.SAITENA_RELEASE_MODE ?? "public";
const blockers = releaseBlockers(process.cwd(), mode);
if (blockers.length) {
  console.error(
    `${mode.toUpperCase()} RELEASE BLOCKED:\n` + blockers.join("\n"),
  );
  process.exitCode = 1;
}
