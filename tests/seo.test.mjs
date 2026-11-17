import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";

// Node strips TS types; resolve the extensionless local imports used by Next.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && context.parentURL?.includes("/src/")) {
      const url = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(url)) return nextResolve(url.href, context);
    }
    return nextResolve(specifier, context);
  },
});
const { allPages, articles } = await import("../src/lib/content.ts");
const {
  pageMetadata,
  getPageSEO,
  publicSitemap,
  publicRobots,
  pageStructuredData,
  serializeJsonLd,
} = await import("../src/lib/seo.ts");
const { isIndexingEnabled } = await import("../src/lib/seo-policy.mjs");

function withRelease(mode, enabled, run) {
  const original = { ...process.env };
  try {
    process.env.NEXT_PUBLIC_RELEASE_MODE = mode;
    process.env.NEXT_PUBLIC_INDEXING_ENABLED = enabled;
    run();
  } finally {
    process.env = original;
  }
}

test("all real public routes have unique metadata and absolute clean canonical/social URLs", () => {
  const titles = new Set(),
    descriptions = new Set();
  for (const path of allPages) {
    const seo = getPageSEO(path);
    assert(seo, path);
    assert(seo.description?.length > 50, path);
    assert(!titles.has(seo.title), `duplicate title: ${path}`);
    assert(
      !descriptions.has(seo.description),
      `duplicate description: ${path}`,
    );
    titles.add(seo.title);
    descriptions.add(seo.description);
    const metadata = pageMetadata(path);
    const url = path ? `https://saitena.com/${path}` : "https://saitena.com";
    assert.equal(metadata.alternates.canonical, url);
    assert.equal(metadata.openGraph.url, url);
    assert.equal(metadata.openGraph.title, seo.title);
    assert.equal(metadata.openGraph.description, seo.description);
    assert.equal(metadata.twitter.title, seo.title);
    assert.equal(metadata.twitter.description, seo.description);
    assert.equal(metadata.twitter.card, "summary_large_image");
    assert.equal(
      metadata.openGraph.images[0].url,
      metadata.twitter.images[0].url,
    );
    assert(existsSync(new URL(`../public${seo.image}`, import.meta.url)), path);
  }
  assert.equal(getPageSEO("not-a-route"), undefined);
  assert.throws(() => pageMetadata("not-a-route"), /Unknown SEO route/);
});

test("indexing defaults closed and cannot be enabled in either preview profile", () => {
  assert.equal(isIndexingEnabled({}), false);
  assert.equal(
    isIndexingEnabled({ NEXT_PUBLIC_INDEXING_ENABLED: "TRUE" }),
    false,
  );
  for (const mode of ["private-preview", "public-demo", "public"]) {
    withRelease(mode, "false", () => {
      assert.deepEqual(publicSitemap(), []);
      assert.deepEqual(publicRobots(), {
        rules: { userAgent: "*", disallow: "/" },
      });
      for (const path of allPages) {
        assert.equal(pageMetadata(path).robots.index, false);
        assert.equal(pageMetadata(path).robots.follow, false);
        assert.equal(pageMetadata(path).robots.googleBot.index, false);
      }
    });
    if (mode !== "public")
      withRelease(mode, "true", () => {
        assert.deepEqual(publicSitemap(), []);
        assert.equal(pageMetadata("").robots.index, false);
      });
  }
});

test("approved future public profile has a complete sitemap and keeps samples/legal drafts noindex", () => {
  withRelease("public", "true", () => {
    const sitemap = publicSitemap();
    const expected = allPages.filter(
      (path) => !path.startsWith("legal/") && !path.startsWith("blog/"),
    );
    assert.deepEqual(
      sitemap.map((p) => p.url),
      expected.map((p) =>
        p ? `https://saitena.com/${p}` : "https://saitena.com",
      ),
    );
    assert.equal(new Set(sitemap.map((p) => p.url)).size, sitemap.length);
    assert(
      sitemap.every(
        (p) =>
          !p.lastModified &&
          !p.url.includes("?") &&
          !p.url.includes("concepts"),
      ),
    );
    assert.equal(publicRobots().sitemap, "https://saitena.com/sitemap.xml");
    assert.equal(publicRobots().rules.allow, "/");
    assert(!publicRobots().rules.disallow.includes("/_next/"));
    for (const path of allPages) {
      const robots = pageMetadata(path).robots;
      assert.equal(robots.index, expected.includes(path), path);
      assert.equal(robots.follow, true, path);
    }
  });
});

test("JSON-LD identifies the brand and actual services without invented business claims", () => {
  for (const path of allPages.filter((p) => !p.startsWith("legal/"))) {
    const data = pageStructuredData(path);
    assert.equal(data["@context"], "https://schema.org");
    const graph = data["@graph"];
    assert.equal(
      graph.find((n) => n["@type"] === "Organization").name,
      "Saitena",
    );
    assert.equal(graph.find((n) => n["@type"] === "WebSite").inLanguage, "bg");
    assert(
      !/aggregateRating|reviewCount|taxID|legalName|datePublished|BlogPosting/.test(
        JSON.stringify(data),
      ),
    );
    if (path.startsWith("portfolio/") || path.startsWith("blog/")) {
      const crumbs = graph.find(
        (n) => n["@type"] === "BreadcrumbList",
      ).itemListElement;
      assert.deepEqual(
        crumbs.map((c) => c.position),
        [1, 2],
      );
      assert.equal(crumbs[1].item, `https://saitena.com/${path}`);
    }
  }
  const services = pageStructuredData("services")["@graph"].filter(
    (n) => n["@type"] === "Service",
  );
  assert.equal(services.length, 6);
  assert(
    services.every(
      (s) =>
        s.description &&
        s.provider["@id"] === "https://saitena.com/#organization",
    ),
  );
  assert.equal(pageStructuredData("legal/privacy"), undefined);
  assert.equal(pageStructuredData("missing"), undefined);
  assert.equal(
    articles.length,
    2,
    "Reassess publication metadata when the catalog changes",
  );
});

test("JSON-LD cannot terminate its script element", () => {
  const value = { text: "</script><script>alert(1)</script>" };
  const serialized = serializeJsonLd(value);
  assert(!serialized.includes("<"));
  assert.deepEqual(JSON.parse(serialized), value);
});
