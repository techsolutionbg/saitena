import assert from "node:assert/strict";
import https from "node:https";
import { isIP } from "node:net";

// Run separately on confirmed home and external networks AFTER approved activation.
// No mail, registration, Cloudflare write or certificate verification bypass exists here.
const expected = process.argv[2];
const origin = process.argv[3];
if (
  !["allowed", "blocked"].includes(expected) ||
  (origin && (!isIP(origin) || expected !== "blocked"))
)
  throw Error(
    "Usage: node scripts/check-preview-access.mjs allowed|blocked [origin-IP-for-blocked-probe]",
  );
function get(host, path) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      {
        hostname: origin ?? host,
        servername: host,
        headers: { Host: host },
        path,
        rejectUnauthorized: true,
        timeout: 10000,
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
          if (body.length > 2_000_000)
            request.destroy(Error("oversized response"));
        });
        response.on("end", () =>
          resolve({
            status: response.statusCode,
            headers: response.headers,
            body,
          }),
        );
      },
    );
    request.on("timeout", () => request.destroy(Error("timeout")));
    request.on("error", reject);
  });
}
let checks = 0;
for (const host of ["saitena.com", "www.saitena.com"]) {
  for (const path of [
    "/",
    "/api/health",
    "/robots.txt",
    "/preview/illustration.svg",
    "/legal/privacy",
  ]) {
    let r = await get(host, path);
    if (
      expected === "allowed" &&
      host === "www.saitena.com" &&
      r.status === 302
    ) {
      assert.equal(r.headers.location, "https://saitena.com" + path);
      r = await get("saitena.com", path);
    }
    if (expected === "blocked") assert.equal(r.status, 403, `${host}${path}`);
    else {
      assert.equal(
        r.status,
        path.startsWith("/legal/") ? 404 : 200,
        `${host}${path}`,
      );
      assert.match(r.headers["x-robots-tag"] ?? "", /noindex/);
      if (path === "/") {
        assert.match(r.body, /data-release-mode="private-preview"/);
        assert(!/Private Preview|PRIVATE PREVIEW/.test(r.body));
      }
      if (path === "/api/health")
        assert.equal(JSON.parse(r.body).releaseMode, "private-preview");
      if (path === "/robots.txt") assert(r.body.includes("Disallow: /"));
    }
    checks++;
  }
}
console.log(
  JSON.stringify({
    passed: true,
    expectation: expected,
    transport: origin ? "direct-origin" : "Cloudflare-DNS",
    checks,
  }),
);
