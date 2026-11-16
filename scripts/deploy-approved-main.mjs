import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyPublicSite } from "./check-deployed-site.mjs";

const {
  DEPLOY_HOST: host,
  SHA: sha,
  IMAGE: image,
  RELEASE: release,
} = process.env;
if (
  !/^100\.\d+\.\d+\.\d+$/.test(host ?? "") ||
  !/^[a-f0-9]{40}$/.test(sha ?? "") ||
  release !== `main-${sha}` ||
  !/^ghcr\.io\/techsolutionbg\/saitena\/public@sha256:[a-f0-9]{64}$/.test(
    image ?? "",
  )
)
  throw Error("Invalid fixed deployment destination or identity");
if (
  !process.env.DEPLOY_KEY ||
  !process.env.KNOWN_HOSTS ||
  !process.env.REGISTRY_TOKEN ||
  process.env.REGISTRY_USER !== "techsolutionbg"
)
  throw Error("Missing deployment credentials");
const directory = mkdtempSync(join(tmpdir(), "saitena-approved-deploy-"));
const key = join(directory, "identity"),
  hosts = join(directory, "known_hosts");
const identity = { release, sha, image, mode: "public-demo" };
let provisional = false;
function request(action) {
  const payload = { ...identity, action };
  if (action === "deploy")
    payload.registry = {
      username: process.env.REGISTRY_USER,
      token: process.env.REGISTRY_TOKEN,
    };
  try {
    return JSON.parse(
      execFileSync(
        "ssh",
        [
          "-T",
          "-o",
          "BatchMode=yes",
          "-o",
          "IdentitiesOnly=yes",
          "-o",
          "ConnectTimeout=10",
          "-o",
          "ServerAliveInterval=15",
          "-o",
          "ServerAliveCountMax=3",
          "-o",
          "StrictHostKeyChecking=yes",
          "-o",
          `UserKnownHostsFile=${hosts}`,
          "-i",
          key,
          `saitena-deploy@${host}`,
          "deploy",
        ],
        {
          input: JSON.stringify(payload),
          encoding: "utf8",
          timeout: 300000,
          maxBuffer: 1024 * 1024,
          stdio: ["pipe", "pipe", "pipe"],
        },
      ),
    );
  } catch {
    // execFile errors include stdin/options; never forward the exception to logs.
    throw Error(
      `Restricted deployment ${action} failed; raw output suppressed`,
    );
  } finally {
    delete payload.registry;
  }
}
try {
  writeFileSync(key, process.env.DEPLOY_KEY + "\n", { mode: 0o600 });
  writeFileSync(hosts, process.env.KNOWN_HOSTS + "\n", { mode: 0o600 });
  const result = request("deploy");
  if (result.status === "already_deployed") {
    console.log(
      "Exact candidate was already accepted; server health rechecked.",
    );
  } else {
    provisional = true;
    if (
      result.status !== "awaiting_acceptance" ||
      result.sha !== sha ||
      result.image !== image
    )
      throw Error("Unexpected deployment response");
    const verification = await verifyPublicSite(result.expected);
    const accepted = request("accept");
    if (
      accepted.status !== "deployed" ||
      accepted.sha !== sha ||
      accepted.image !== image
    )
      throw Error("Acceptance failed");
    provisional = false;
    console.log(
      `Accepted exact candidate; ${verification.checked} external content checks passed.`,
    );
  }
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `Published https://saitena.com and https://www.saitena.com\n\nCommit: \`${sha}\`\n\nImage: \`${image}\`\n\nRoot-only backup retained; previous container retained. Origin guards unchanged. clients.saitena.com has a documented pre-existing HTTP 502 exception, not a healthy result.\n`,
    );
} catch {
  if (provisional) {
    try {
      request("rollback");
      console.error("Previous guarded version restored.");
    } catch {
      console.error(
        "Immediate rollback could not be confirmed; server watchdog remains responsible for guarded recovery. Owner inspection required.",
      );
    }
  }
  console.error(
    "Deployment not accepted; detailed subprocess output suppressed.",
  );
  process.exitCode = 1;
} finally {
  delete process.env.DEPLOY_KEY;
  delete process.env.REGISTRY_TOKEN;
  rmSync(directory, { recursive: true, force: true });
}
