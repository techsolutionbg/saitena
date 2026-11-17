import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { publicSecurityHeaders } from "../src/lib/security-headers.mjs";

// Run against a previously built, auth-disabled information-only candidate.
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "13100",
  ],
  { stdio: "inherit" },
);
const base = "http://127.0.0.1:13100";
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      ready = (await fetch(`${base}/api/health`)).ok;
    } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready, "Candidate did not become ready");
  const paths = [
    "/",
    "/about",
    "/services",
    "/prices",
    "/portfolio",
    "/blog",
    "/faq",
    "/contact",
    "/legal/privacy",
    "/legal/cookies",
    "/legal/terms",
    "/legal/subscription-terms",
  ];
  const assets = new Set();
  for (const path of paths) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200, path);
    for (const { key, value } of publicSecurityHeaders(true))
      assert.equal(response.headers.get(key), value, `${path}: ${key}`);
    assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/, path);
    const html = await response.text();
    assert.match(html, /name="robots"[^>]+noindex/, `robots metadata: ${path}`);
    if (path === "/prices")
      assert.ok(
        html.includes("https://saitena.com/prices"),
        "Absolute production canonical",
      );
    for (const match of html.matchAll(
      /(?:src|href)="(\/(?:_next\/static\/|brand\/)[^"?#]+)(?:[^" ]*)"/g,
    ))
      assets.add(match[1]);
  }
  for (const path of assets) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200, path);
    for (const { key, value } of publicSecurityHeaders(true))
      assert.equal(response.headers.get(key), value, `${path}: ${key}`);
  }
  const manifest = JSON.parse(
    readFileSync("docs/binary-review-manifest.json", "utf8"),
  );
  const runtimeAssets = manifest.filter(
    (a) =>
      a.path.startsWith("public/") && a.decision !== "exclude-local-archive",
  );
  for (const asset of runtimeAssets)
    assert.equal(
      (await fetch(`${base}/${asset.path.slice(7)}`)).status,
      200,
      asset.path,
    );
  for (const path of [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ]) {
    const response = await fetch(`${base}${path}`, { redirect: "manual" });
    assert.equal(response.status, 307, path);
    assert.equal(response.headers.get("location"), "/", path);
  }
  assert.match(
    await (await fetch(`${base}/robots.txt`)).text(),
    /Disallow: \//,
  );
  assert.equal((await fetch(`${base}/sitemap.xml`)).status, 200);
  console.log(
    JSON.stringify({
      passed: true,
      pages: paths.length,
      staticAssets: assets.size,
      runtimeAssets: runtimeAssets.length,
      authRoutesDisabled: 5,
    }),
  );
} finally {
  server.kill("SIGTERM");
}
