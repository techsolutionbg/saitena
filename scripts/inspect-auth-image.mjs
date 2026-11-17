// Bind the private GHCR digest to its exact local image ID. No archive or credentials.
import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
export function validatePublicImage(info, { sha, image }) {
  if (
    !/^[a-f0-9]{40}$/.test(sha ?? "") ||
    !/^ghcr\.io\/techsolutionbg\/saitena\/public@sha256:[a-f0-9]{64}$/.test(
      image ?? "",
    ) ||
    !/^sha256:[a-f0-9]{64}$/.test(info.Id ?? "") ||
    !info.RepoDigests?.includes(image) ||
    info.Config?.User !== "node" ||
    info.Config?.Labels?.["org.opencontainers.image.revision"] !== sha ||
    info.Config?.Labels?.["org.opencontainers.image.source"] !==
      "https://github.com/techsolutionbg/saitena" ||
    info.Config?.Labels?.["io.saitena.release-mode"] !== "customer-auth"
  )
    throw Error("Exact public Auth image required");
  for (const value of info.Config.Env ?? []) {
    const split = value.indexOf("=");
    if (
      /^(APP_KEY|DB_PASSWORD|MAIL_PASSWORD|SMTP_PASSWORD|REDIS_PASSWORD|GH_TOKEN|GITHUB_TOKEN|DEPLOY_KEY)$/.test(
        value.slice(0, split),
      ) &&
      value.slice(split + 1)
    ) {
      throw Error("Unexpected sensitive image environment");
    }
  }
  return { schema: 1, sha, image, imageId: info.Id, publicSourceOnly: true };
}

if (process.argv[1]?.endsWith("inspect-auth-image.mjs")) {
  const { SHA: sha, IMAGE: image } = process.env;
  const info = JSON.parse(
    execFileSync("docker", ["image", "inspect", image], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  )[0];
  const proof = validatePublicImage(info, { sha, image });
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      "image_id=" + proof.imageId + "\n",
    );
  console.log("SAITENA_AUTH_IMAGE_IDENTITY=" + JSON.stringify(proof));
}
