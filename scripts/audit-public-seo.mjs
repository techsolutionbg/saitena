const { chromium, request } = await import(
  process.env.PLAYWRIGHT_MODULE ?? "playwright"
);
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

// Read-only HTTP/HTML audit. The parser never executes scripts from the site.
const base = process.env.BASE_URL ?? "https://saitena.com";
const output = resolve(process.env.OUTPUT_FILE ?? "qa-output/seo/live.json");
const paths = [
  "/",
  "/services",
  "/prices",
  "/about",
  "/portfolio",
  "/blog",
  "/faq",
  "/contact",
  "/sitemap",
  "/legal/privacy",
  "/legal/cookies",
  "/legal/terms",
  "/legal/subscription-terms",
  "/portfolio/forma-studio",
  "/portfolio/bloom-botanics",
  "/portfolio/dobreva-consult",
  "/portfolio/studio-move",
  "/blog/what-is-a-website-subscription",
  "/blog/how-to-prepare-website-content",
];
const aliases = [
  "/uslugi",
  "/planove",
  "/plans",
  "/za-nas",
  "/kontakti",
  "/vuprosi",
  "/zapitvane",
  "/inquiry",
  "/karta-na-saita",
  "/pravni/poveritelnost",
  "/pravni/biskvitki",
  "/pravni/uslovia",
  "/pravni/abonamentni-uslovia",
  "/blog/kakvo-e-sait-na-abonament",
  "/blog/kak-da-podgotvite-sadarzhanie",
];
const http = await request.newContext({ userAgent: "bingbot", timeout: 30000 });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const parser = await browser.newPage();
const pages = [];
try {
  for (const path of paths) {
    const response = await http.get(base + path, { maxRedirects: 0 });
    const html = await response.text();
    const data = await parser.evaluate((source) => {
      const doc = new DOMParser().parseFromString(source, "text/html");
      return {
        title: doc.title,
        meta: Object.fromEntries(
          [...doc.querySelectorAll("meta[name],meta[property]")].map((el) => [
            el.getAttribute("name") ?? el.getAttribute("property"),
            el.content,
          ]),
        ),
        canonicals: [...doc.querySelectorAll('link[rel="canonical"]')].map(
          (el) => el.getAttribute("href"),
        ),
        headings: [...doc.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((el) => ({
          level: Number(el.tagName[1]),
          text: el.textContent.trim(),
        })),
        links: [...doc.querySelectorAll("a[href]")].map((el) =>
          el.getAttribute("href"),
        ),
        ids: [...doc.querySelectorAll("[id]")].map((el) => el.id),
        images: [...doc.querySelectorAll("img")].map((el) => ({
          src: el.getAttribute("src"),
          alt: el.getAttribute("alt"),
        })),
        structuredData: [
          ...doc.querySelectorAll('script[type="application/ld+json"]'),
        ].map((el) => JSON.parse(el.textContent)),
        lang: doc.documentElement.lang,
      };
    }, html);
    pages.push({
      path,
      status: response.status(),
      headers: {
        robots: response.headers()["x-robots-tag"],
        cacheControl: response.headers()["cache-control"],
      },
      bytes: Buffer.byteLength(html),
      ...data,
    });
  }
  const probes = [];
  for (const path of [
    ...aliases,
    ...aliases.map((p) => "/concepts/clarity" + p),
    "/services/",
    "/seo-audit-missing-20261117",
    "/blog/not-a-real-post",
    "/concepts/clarity/services",
    "/robots.txt",
    "/sitemap.xml",
    "/blog?category=seo",
    "/contact?plan=START",
  ]) {
    const r = await http.get(base + path, { maxRedirects: 0 });
    probes.push({
      path,
      status: r.status(),
      location: r.headers().location,
      ...(path.endsWith(".txt") || path.endsWith(".xml")
        ? { body: await r.text() }
        : {}),
    });
  }
  const internal = new Set(
    pages
      .flatMap((p) => p.links)
      .filter((href) => href.startsWith("/") && !href.startsWith("//")),
  );
  const linkChecks = [];
  for (const href of internal) {
    const url = new URL(href, base);
    if (
      /^\/(?:api|login|register|forgot-password|reset-password|verify-email)(?:\/|$)/.test(
        url.pathname,
      )
    )
      continue;
    const r = await http.get(url.href, { maxRedirects: 0 });
    const target = pages.find((p) => p.path === url.pathname);
    linkChecks.push({
      href,
      status: r.status(),
      location: r.headers().location,
      ...(url.hash && target
        ? {
            fragmentExists: target.ids.includes(
              decodeURIComponent(url.hash.slice(1)),
            ),
          }
        : {}),
    });
  }
  const assetChecks = [];
  for (const src of new Set(pages.flatMap((p) => p.images.map((i) => i.src)))) {
    const r = await http.get(new URL(src, base).href);
    assetChecks.push({
      src,
      status: r.status(),
      type: r.headers()["content-type"],
    });
  }
  const result = {
    capturedAt: new Date().toISOString(),
    base,
    pages,
    probes,
    linkChecks,
    assetChecks,
  };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(result, null, 2) + "\n");
  console.log(
    JSON.stringify(
      {
        output,
        pages: pages.length,
        probes: probes.length,
        brokenLinks: linkChecks.filter(
          (p) => p.status >= 400 || p.fragmentExists === false,
        ),
        brokenImages: assetChecks.filter((p) => p.status >= 400),
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  await http.dispose();
}
