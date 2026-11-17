import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const docker = (...args) =>
  execFileSync("docker", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
const mode = process.env.SAITENA_DEPLOY_TEST_MODE ?? "private-preview";
if (!["private-preview", "public-demo"].includes(mode))
  throw Error("Unknown fixture mode");
const versions =
  mode === "public-demo"
    ? ["old", "new", "bad", "timeout", "fallback", "drift"]
    : ["old", "new"];
const revision = (version) =>
  createHash("sha256")
    .update(prefix + version)
    .digest("hex")
    .slice(0, 40);
const prefix = `saitena-website-${mode}-deploy-${process.pid}-${Date.now()}`;
const runner = prefix + "-runner";
let created = false;
try {
  for (const version of versions) {
    const sha = createHash("sha256")
      .update(prefix + version)
      .digest("hex")
      .slice(0, 40);
    docker(
      "build",
      "--build-arg",
      `REVISION=${sha}`,
      "--build-arg",
      `RELEASE_MODE=${mode}`,
      "-f",
      ".deployment/tests/fixture.Dockerfile",
      "-t",
      prefix + ":" + version,
      ".",
    );
  }
  docker(
    "build",
    "--build-arg",
    `FIXTURE_TEST_TYPE=${mode === "public-demo" ? "public_demo" : "preview"}`,
    "-f",
    ".deployment/tests/preview-runner.Dockerfile",
    "-t",
    "saitena-website-preview-runner:check",
    ".",
  );
  // Long-lived local review environments may exhaust Docker's default pool.
  // Choose a free small INTERNAL test subnet; never prune existing networks.
  const ids = docker("network", "ls", "-q").split(/\s+/);
  const networks = JSON.parse(docker("network", "inspect", ...ids));
  const range = (cidr) => {
    const [ip, bits] = cidr.split("/");
    const value = ip
      .split(".")
      .reduce((result, part) => result * 256 + Number(part), 0);
    const size = 2 ** (32 - Number(bits));
    const first = Math.floor(value / size) * size;
    return [first, first + size - 1];
  };
  const occupied = networks
    .flatMap((n) => n.IPAM.Config ?? [])
    .filter((c) => c.Subnet?.includes("."))
    .map((c) => range(c.Subnet));
  let subnet;
  for (let third = 240; third < 256 && !subnet; third++)
    for (let fourth = 0; fourth < 256; fourth += 16) {
      const candidate = `10.253.${third}.${fourth}/28`,
        [first, last] = range(candidate);
      if (!occupied.some(([start, end]) => first <= end && last >= start)) {
        subnet = candidate;
        break;
      }
    }
  if (!subnet)
    throw Error(
      "No nonoverlapping internal fixture subnet; existing resources preserved",
    );
  docker("network", "create", "--internal", "--subnet", subnet, prefix);
  docker("volume", "create", prefix + "-state");
  const volumeRoot = JSON.parse(
    docker("volume", "inspect", prefix + "-state"),
  )[0].Mountpoint;
  docker(
    "run",
    "-d",
    "--name",
    runner,
    "--network",
    prefix,
    "-e",
    `FIXTURE_PREFIX=${prefix}`,
    "-e",
    `FIXTURE_VOLUME_ROOT=${volumeRoot}`,
    "--mount",
    `type=volume,source=${prefix}-state,target=/work`,
    "--mount",
    `type=volume,source=${prefix}-state,target=${volumeRoot}`,
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
      ...versions
        .filter((v) => v !== "old")
        .map((v) => "saitena-website-public-" + revision(v).slice(0, 16)),
    ]) {
      try {
        docker("stop", name);
      } catch {}
    }
}
