import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:net";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const socket = createServer();
await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
const port = socket.address().port;
await new Promise((resolve) => socket.close(resolve));
const base = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let log = "";
server.stdout.on("data", (data) => (log = (log + data).slice(-16000)));
server.stderr.on("data", (data) => (log = (log + data).slice(-16000)));
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      ready = (await fetch(base, { signal: AbortSignal.timeout(1000) })).ok;
    } catch {}
    if (ready) break;
    if (server.exitCode !== null) throw Error(log);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert(ready, log);
  const env = { ...process.env, BASE_URL: base };
  for (const script of [
    "tests/browser/public-rendering.mjs",
    "tests/browser/seo-layout.mjs",
  ])
    execFileSync(process.execPath, [script], { stdio: "inherit", env });
  const auditFile = "qa-output/seo-rendering/http-audit.json";
  execFileSync(process.execPath, ["scripts/audit-public-seo.mjs"], {
    stdio: "inherit",
    env: { ...env, OUTPUT_FILE: auditFile },
  });
  const audit = JSON.parse(readFileSync(auditFile, "utf8"));
  assert.deepEqual(
    audit.linkChecks.filter(
      (link) => link.status >= 400 || link.fragmentExists === false,
    ),
    [],
    "Broken internal links",
  );
  assert.deepEqual(
    audit.assetChecks.filter((asset) => asset.status >= 400),
    [],
    "Broken images",
  );
} finally {
  server.kill("SIGTERM");
}
