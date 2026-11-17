import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ?? "playwright"
);

const base = process.env.BASE_URL ?? "http://127.0.0.1:13118";
const output = resolve(process.env.OUTPUT_DIR ?? "qa-output/seo/browser");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.BROWSER_CHANNEL === "bundled" ? {} : { channel: "chrome" }),
  headless: true,
});
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
  "/portfolio/forma-studio",
  "/portfolio/bloom-botanics",
  "/portfolio/dobreva-consult",
  "/portfolio/studio-move",
  "/blog/what-is-a-website-subscription",
  "/blog/how-to-prepare-website-content",
];
const results = [];
try {
  for (const width of [375, 768, 1366]) {
    const context = await browser.newContext({
      viewport: { width, height: 940 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    for (const path of paths) {
      const errors = [];
      const onError = (error) => errors.push(error.message);
      page.on("pageerror", onError);
      const response = await page.goto(base + path, {
        waitUntil: "networkidle",
      });
      assert.equal(response.status(), 200, path);
      await page.evaluate(() => document.fonts.ready);
      const data = await page.evaluate(() => {
        const visible = (el) =>
          el.checkVisibility({
            checkOpacity: true,
            checkVisibilityCSS: true,
          }) && !el.closest('[aria-hidden="true"]');
        const headings = [
          ...document.querySelectorAll(
            "main h1,main h2,main h3,main h4,main h5,main h6",
          ),
        ]
          .filter(visible)
          .map((el) => ({
            level: Number(el.tagName[1]),
            text: el.textContent.trim(),
          }));
        return {
          h1: [...document.querySelectorAll("main h1")].filter(visible).length,
          headings,
          jumps: headings.filter(
            (h, i) => i && h.level > headings[i - 1].level + 1,
          ),
          overflow: document.documentElement.scrollWidth > innerWidth,
          missingAlt: document.querySelectorAll("img:not([alt])").length,
          mainTextLength: document.querySelector("main").innerText.length,
          breadcrumb: document.querySelector(
            'nav[aria-label="Навигационна пътека"] [aria-current="page"]',
          )?.textContent,
          visibleLegalLinks: [
            ...document.querySelectorAll('a[href^="/legal/"]'),
          ].filter(visible).length,
        };
      });
      results.push({ width, path, errors, ...data });
      assert.equal(data.h1, 1, `${width}: ${path} H1`);
      assert.equal(data.overflow, false, `${width}: ${path} overflow`);
      assert.equal(data.missingAlt, 0, path);
      assert.equal(
        data.jumps.length,
        0,
        `${width}: ${path}: ${JSON.stringify(data.jumps)}`,
      );
      assert.equal(errors.length, 0, `${path}: ${errors}`);
      assert(data.mainTextLength > 100, path);
      if (width === 375 && ["/", "/services", "/portfolio"].includes(path))
        await page.screenshot({
          path: resolve(
            output,
            `mobile-${path === "/" ? "home" : path.slice(1)}.png`,
          ),
          fullPage: true,
        });
      page.off("pageerror", onError);
    }
    await context.close();
  }
  const context = await browser.newContext({
    viewport: { width: 375, height: 940 },
    reducedMotion: "reduce",
  });
  await context.addInitScript(() =>
    localStorage.setItem("saitena-text-size", "150"),
  );
  const page = await context.newPage();
  for (const path of ["/", "/services", "/prices", "/contact"]) {
    await page.goto(base + path, { waitUntil: "networkidle" });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${path}: text 150% overflow`,
    );
  }
  await context.close();
  const noJS = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 940 },
  });
  const crawler = await noJS.newPage();
  const noJSResults = [];
  for (const path of [
    "/",
    "/services",
    "/blog/what-is-a-website-subscription",
  ]) {
    await crawler.goto(base + path, { waitUntil: "load" });
    noJSResults.push({
      path,
      ...(await crawler.evaluate(() => ({
        mainText: document.querySelector("main").innerText.slice(0, 250),
        h1InHTML: !!document.querySelector("h1"),
        h1Visible: document.querySelector("h1")?.checkVisibility(),
        canonical: document.querySelector('link[rel="canonical"]')?.href,
      }))),
    });
  }
  await noJS.close();
  for (const result of noJSResults) {
    assert.equal(result.h1Visible, true, result.path);
    assert(!result.mainText.includes("Зареждаме страницата"), result.path);
  }
  await writeFile(
    resolve(output, "results.json"),
    JSON.stringify({ results, enlargedTextChecks: 4, noJSResults }, null, 2),
  );
  console.log(
    JSON.stringify({
      passed: true,
      viewports: 3,
      pageChecks: results.length,
      enlargedTextChecks: 4,
      noJSResults,
    }),
  );
} finally {
  await writeFile(
    resolve(output, "partial-results.json"),
    JSON.stringify(results, null, 2),
  );
  await browser.close();
}
