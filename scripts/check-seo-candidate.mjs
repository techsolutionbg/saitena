import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";

const routes = JSON.parse(
  readFileSync(".next/prerender-manifest.json", "utf8"),
).routes;
const auth = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);
const paths = [
  ...new Set([
    ...Object.keys(routes).filter(
      (p) =>
        !auth.has(p) &&
        !p.startsWith("/_") &&
        !p.startsWith("/media/") &&
        !["/robots.txt", "/sitemap.xml"].includes(p),
    ),
    "/blog",
    "/contact",
  ]),
];
const indexed = process.env.NEXT_PUBLIC_INDEXING_ENABLED === "true";
const preview = ["public-demo", "private-preview"].includes(
  process.env.NEXT_PUBLIC_RELEASE_MODE,
);
assert(!(indexed && preview), "Cannot index preview");
const socket = createServer();
await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
const port = socket.address().port;
await new Promise((resolve) => socket.close(resolve));
const base = `http://127.0.0.1:${port}`;
const runtimeEnv = { ...process.env };
// Standalone images do not repeat the build-time NEXT_PUBLIC_ arguments at runtime.
if (process.env.TEST_RUNTIME_WITHOUT_PUBLIC_SEO_ENV === "true") {
  delete runtimeEnv.NEXT_PUBLIC_INDEXING_ENABLED;
  delete runtimeEnv.NEXT_PUBLIC_RELEASE_MODE;
}
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
  { stdio: ["ignore", "pipe", "pipe"], env: runtimeEnv },
);
let serverLog = "";
server.stdout.on("data", (chunk) => (serverLog += chunk));
server.stderr.on("data", (chunk) => (serverLog += chunk));
const get = (path) =>
  fetch(base + path, {
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
    headers: { "User-Agent": "bingbot" },
  });
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      ready = (await get("/")).ok;
    } catch {}
    if (ready) break;
    if (server.exitCode !== null) throw new Error(serverLog);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert(ready, serverLog);
  const titles = new Set(),
    descriptions = new Set();
  for (const path of paths) {
    const r = await get(path);
    assert.equal(r.status, 200, path);
    const html = await r.text();
    const canonical =
      path === "/" ? "https://saitena.com" : `https://saitena.com${path}`;
    assert.equal(
      [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].length,
      1,
      path,
    );
    assert(html.includes(`<link rel="canonical" href="${canonical}"`), path);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(
      /<meta name="description" content="([^"]+)"/,
    )?.[1];
    assert(title && !titles.has(title), `title: ${path}`);
    assert(
      description && !descriptions.has(description),
      `description: ${path}`,
    );
    titles.add(title);
    descriptions.add(description);
    for (const name of [
      "og:title",
      "og:description",
      "og:image",
      "og:url",
      "twitter:card",
      "twitter:title",
      "twitter:description",
      "twitter:image",
    ])
      assert(html.includes(`="${name}"`), `${path}: ${name}`);
    const draft = path.startsWith("/blog/") || path.startsWith("/legal/");
    assert.match(
      html,
      new RegExp(
        `name="robots" content="${indexed && !draft ? "index" : "noindex"}, ${indexed ? "follow" : "nofollow"}`,
      ),
      path,
    );
    if (!indexed) assert.match(r.headers.get("x-robots-tag"), /noindex/);
    const ld = [
      ...html.matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
      ),
    ].map((m) => JSON.parse(m[1]));
    if (!path.startsWith("/legal/")) {
      assert.equal(ld.length, 1, path);
      const graph = ld[0]["@graph"];
      assert(graph.some((n) => n["@type"] === "Organization"));
      assert(graph.some((n) => n["@type"] === "WebSite"));
      if (path === "/services")
        assert.equal(graph.filter((n) => n["@type"] === "Service").length, 6);
      if (/^\/(blog|portfolio)\//.test(path))
        assert(graph.some((n) => n["@type"] === "BreadcrumbList"));
      assert(!graph.some((n) => n["@type"] === "BlogPosting"));
    }
    if (preview) assert(!html.includes('href="/legal/'), path);
  }
  for (const path of [
    "/seo-audit-missing-20261117",
    "/blog/not-a-real-post",
    "/concepts/no-such-concept/services",
    "/not-a-real-parent/deep",
    "/images/seo-audit-missing.webp",
  ]) {
    const r = await get(path);
    assert.equal(r.status, 404, path);
    const html = await r.text();
    assert(html.includes("Тази страница не е намерена"), path);
    assert.match(r.headers.get("x-robots-tag"), /noindex/);
    assert(!html.includes('rel="canonical"'), path);
  }
  for (const [path, destination] of [
    ["/uslugi", "/services"],
    ["/plans", "/prices"],
    ["/services/", "/services"],
    ["/concepts/clarity/services", "/services"],
    ["/concepts/clarity/contact?plan=START", "/contact?plan=START"],
  ]) {
    const r = await get(path);
    assert.equal(r.status, 308, path);
    assert.equal(
      new URL(r.headers.get("location"), base).pathname +
        new URL(r.headers.get("location"), base).search,
      destination,
    );
  }
  for (const path of [
    "/blog?category=seo",
    "/blog?search=test&page=99",
    "/contact?plan=START",
  ]) {
    const r = await get(path);
    assert.equal(r.status, 200, path);
    assert(
      (await r.text()).includes(
        `rel="canonical" href="https://saitena.com${path.split("?")[0]}"`,
      ),
    );
  }
  const robots = await (await get("/robots.txt")).text();
  const sitemapResponse = await get("/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (indexed) {
    assert(robots.includes("Allow: /"));
    assert(robots.includes("Sitemap: https://saitena.com/sitemap.xml"));
    assert.equal(urls.length, 13);
    assert.equal(new Set(urls).size, 13);
    assert(
      !urls.some((url) => /\/legal\/|\/blog\/|\?|concepts|login/.test(url)),
    );
    assert(urls.includes("https://saitena.com/blog"));
    assert(urls.includes("https://saitena.com/portfolio/studio-move"));
  } else {
    assert(robots.includes("Disallow: /"));
    assert.equal(urls.length, 0);
  }
  if (preview)
    for (const path of ["/legal/privacy", "/legal/terms"])
      assert.equal((await get(path)).status, 404);
  console.log(
    JSON.stringify({
      passed: true,
      indexed,
      preview,
      pages: paths.length,
      sitemapURLs: urls.length,
      missingPages404: 5,
      permanentRedirects: 5,
      queryCanonicals: 3,
    }),
  );
} finally {
  server.kill("SIGTERM");
}
