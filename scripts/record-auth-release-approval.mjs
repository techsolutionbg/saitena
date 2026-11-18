// This step runs behind the EXISTING production Environment; it never deploys.
import { appendFileSync } from "node:fs";
import { deploymentProfile } from "./deployment-profile.mjs";
const { SHA: sha, IMAGE: image, IMAGE_ID: imageId } = process.env;
if (
  deploymentProfile().mode !== "customer-auth" ||
  !/^[a-f0-9]{40}$/.test(sha ?? "") ||
  !/^ghcr\.io\/techsolutionbg\/saitena\/public@sha256:[a-f0-9]{64}$/.test(
    image ?? "",
  ) ||
  !/^sha256:[a-f0-9]{64}$/.test(imageId ?? "") ||
  !/^[1-9][0-9]*$/.test(process.env.GITHUB_RUN_ID ?? "") ||
  !/^[1-9][0-9]*$/.test(process.env.GITHUB_RUN_ATTEMPT ?? "")
)
  throw Error("Exact coordinated Auth identity required");
console.log(
  "SAITENA_AUTH_RELEASE_APPROVAL=" +
    JSON.stringify({
      schema: 1,
      mode: "customer-auth",
      sha,
      image,
      imageId,
      runId: Number(process.env.GITHUB_RUN_ID),
      attempt: Number(process.env.GITHUB_RUN_ATTEMPT),
      approvalOnly: true,
      published: false,
      registration: false,
    }),
);
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `Owner Environment gate completed for coordinated Auth candidate. **No production deployment executed.**\n\nCommit: \`${sha}\`\nImage: \`${image}\`\n\nPublication still requires personal admin-SSH approval and the reviewed coordinated backup/rollback controller. Registrations remain disabled.\n`,
  );
