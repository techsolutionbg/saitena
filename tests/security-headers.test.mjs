import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { publicSecurityHeaders } from "../src/lib/security-headers.mjs";

test("production protects framing and MIME handling without duplicate headers", () => {
  const entries = publicSecurityHeaders(true);
  const headers = Object.fromEntries(
    entries.map(({ key, value }) => [key, value]),
  );
  assert.equal(Object.keys(headers).length, entries.length);
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Strict-Transport-Security"], "max-age=300");
  assert(
    !/includeSubDomains|preload/i.test(headers["Strict-Transport-Security"]),
  );
  assert.equal(
    headers["Content-Security-Policy"],
    undefined,
    "Do not overwrite Next Image's own enforcing policy",
  );
});

test("CSP rollout observes real violations without blanket script/style exemptions", () => {
  const csp = publicSecurityHeaders(true).find(
    ({ key }) => key === "Content-Security-Policy-Report-Only",
  ).value;
  const directives = new Map(
    csp.split("; ").map((item) => {
      const [name, ...sources] = item.split(" ");
      return [name, sources.join(" ")];
    }),
  );
  assert.equal(directives.size, csp.split("; ").length);
  for (const name of [
    "object-src",
    "frame-ancestors",
    "script-src-attr",
    "style-src-attr",
    "frame-src",
  ])
    assert.equal(directives.get(name), "'none'");
  for (const name of [
    "default-src",
    "base-uri",
    "script-src",
    "style-src",
    "font-src",
    "form-action",
  ])
    assert.equal(directives.get(name), "'self'");
  assert(!/unsafe-inline|unsafe-eval|\*|https:;/.test(csp));
  assert.equal(
    directives.get("img-src"),
    "'self' data: https://tile.openstreetmap.org",
  );
  assert.equal(directives.get("connect-src"), "'self' https://api.saitena.com");
});

test("development does not widen production CSP or persist HSTS for local hosts", () => {
  const headers = publicSecurityHeaders(false);
  assert(
    !headers.some(({ key }) => /Strict-Transport|Content-Security/i.test(key)),
  );
  assert(
    headers.some(
      ({ key, value }) => key === "X-Frame-Options" && value === "DENY",
    ),
  );
});

test("review-only Caddy defaults match the application policy for normal and error routes", () => {
  const fragment = readFileSync(
    new URL(
      "../.deployment/Caddyfile.security-headers.fragment",
      import.meta.url,
    ),
    "utf8",
  );
  for (const { key, value } of publicSecurityHeaders(true)) {
    const line = `?${key} "${value}"`;
    assert.equal(fragment.split(line).length - 1, 2, key);
  }
  const errors = fragment.slice(fragment.indexOf("handle_errors {"));
  assert(errors.includes('>X-Robots-Tag "noindex, nofollow, noarchive"'));
  assert(errors.includes('>Cache-Control "private, no-store"'));
  assert(
    !/^\s*(?:reverse_proxy|request_header|tls|trusted_proxies)\b/m.test(
      fragment,
    ),
  );
});

test("enabling indexing in a disposable public config does not remove security headers", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      'const {default:c}=await import("./next.config.ts");console.log(JSON.stringify(await c.headers()))',
    ],
    {
      cwd: new URL("../", import.meta.url),
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "production",
        NEXT_PUBLIC_RELEASE_MODE: "public",
        NEXT_PUBLIC_INDEXING_ENABLED: "true",
        NEXT_PUBLIC_AUTH_ENABLED: "false",
      },
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const headers = JSON.parse(result.stdout)[0].headers;
  for (const expected of publicSecurityHeaders(true))
    assert(
      headers.some(
        ({ key, value }) => key === expected.key && value === expected.value,
      ),
    );
  assert(!headers.some(({ key }) => key === "X-Robots-Tag"));
});
