import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const docker = (...args) =>
  execFileSync("docker", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
const prefix = `saitena-website-preview-deploy-${process.pid}-${Date.now()}`;
const runner = prefix + "-runner";
let created = false;
try {
  for (const version of ["old", "new"]) {
    const sha = createHash("sha256")
      .update(prefix + version)
      .digest("hex")
      .slice(0, 40);
    docker(
      "build",
      "--build-arg",
      `REVISION=${sha}`,
      "--build-arg",
      "RELEASE_MODE=private-preview",
      "-f",
      ".deployment/tests/fixture.Dockerfile",
      "-t",
      prefix + ":" + version,
      ".",
    );
  }
  docker(
    "build",
    "-f",
    ".deployment/tests/preview-runner.Dockerfile",
    "-t",
    "saitena-website-preview-runner:check",
    ".",
  );
  docker("network", "create", "--internal", prefix);
  docker("volume", "create", prefix + "-state");
  docker(
    "run",
    "-d",
    "--name",
    runner,
    "--network",
    prefix,
    "-e",
    `FIXTURE_PREFIX=${prefix}`,
    "--mount",
    `type=volume,source=${prefix}-state,target=/work`,
    "--mount",
    "type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock",
    "saitena-website-preview-runner:check",
  );
  created = true;
  const code = docker("wait", runner);
  process.stdout.write(docker("logs", runner) + "\n");
  if (code !== "0")
    throw Error(
      `Preview deployment fixture exited ${code}; retained prefix ${prefix}`,
    );
} catch (error) {
  process.stderr.write(error.stderr?.toString() ?? String(error));
  process.exitCode = 1;
} finally {
  // No global cleanup or volume deletion. Stop only containers created by this invocation.
  if (created)
    for (const name of [
      runner,
      prefix + "-caddy",
      prefix + "-old",
      "saitena-website-public-" +
        createHash("sha256")
          .update(prefix + "new")
          .digest("hex")
          .slice(0, 16),
    ]) {
      try {
        docker("stop", name);
      } catch {}
    }
}
