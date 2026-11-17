import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ?? "playwright"
);

const base = new URL(process.env.BASE_URL ?? "http://127.0.0.1:13118");
assert(
  ["127.0.0.1", "localhost"].includes(base.hostname),
  "Local isolated build only",
);
const output = resolve(
  process.env.OUTPUT_DIR ?? "qa-output/seo-rendering/candidate",
);
await mkdir(output, { recursive: true });
const baseline = process.env.BASELINE_RESULTS
  ? JSON.parse(await readFile(process.env.BASELINE_RESULTS, "utf8"))
  : undefined;
const captureOnly = process.env.CAPTURE_ONLY === "true";
const browser = await chromium.launch({
  ...(process.env.BROWSER_CHANNEL === "bundled" ? {} : { channel: "chrome" }),
  headless: true,
});
const results = [],
  transport = [],
  noJS = [];
const server = createServer(async (request, response) => {
  try {
    const source = await fetch(new URL(request.url, base));
    const bytes = Buffer.from(await source.arrayBuffer());
    response.writeHead(source.status, {
      "Content-Type":
        source.headers.get("content-type") ?? "application/octet-stream",
    });
    if (request.url === "/") {
      const html = bytes.toString();
      const main = html.indexOf('<main id="main"');
      const footer = html.indexOf("<footer");
      assert(main > 0 && footer > main);
      response.write(html.slice(0, main));
      await new Promise((resolve) => setTimeout(resolve, 350));
      response.write(html.slice(main, footer));
      await new Promise((resolve) => setTimeout(resolve, 650));
      response.end(html.slice(footer));
    } else response.end(bytes);
  } catch (error) {
    response.destroy(error);
  }
});
try {
  for (const width of [375, 768, 1366, 1920])
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({
        viewport: { width, height: 940 },
        reducedMotion: "reduce",
      });
      await context.addInitScript(
        (theme) => localStorage.setItem("saitena-theme", theme),
        theme,
      );
      const page = await context.newPage();
      const paths =
        width === 375 || width === 1366
          ? ["/", "/services", "/prices", "/faq"]
          : ["/"];
      for (const path of paths) {
        const errors = [];
        const listener = (error) => errors.push(error.message);
        page.on("pageerror", listener);
        assert.equal(
          (
            await page.goto(new URL(path, base).href, {
              waitUntil: "networkidle",
            })
          ).status(),
          200,
        );
        await page.evaluate(() => document.fonts.ready);
        const data = await page.evaluate(() => ({
          mainText: document.querySelector("main").innerText,
          overflow: document.documentElement.scrollWidth > innerWidth,
          geometry: ["main", "main h1", "footer.site-footer"].map(
            (selector) => {
              const rect = document
                .querySelector(selector)
                .getBoundingClientRect();
              return {
                selector,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              };
            },
          ),
        }));
        assert.equal(data.overflow, false, `${width} ${theme} ${path}`);
        assert.deepEqual(errors, []);
        const previous = baseline?.results.find(
          (r) => r.width === width && r.theme === theme && r.path === path,
        );
        if (previous) {
          assert.equal(
            data.mainText,
            previous.mainText,
            `${path}: content changed`,
          );
          for (let i = 0; i < data.geometry.length; i++)
            for (const key of ["x", "y", "width", "height"])
              assert(
                Math.abs(data.geometry[i][key] - previous.geometry[i][key]) <=
                  1,
                `${width} ${theme} ${path}: ${data.geometry[i].selector} ${key}`,
              );
        }
        results.push({ width, theme, path, errors, ...data });
        if (path === "/faq" && !captureOnly) {
          const entry = page.locator("details.faq-item").first();
          await entry.locator("summary").click();
          await entry.locator(".faq-answer p").waitFor({ state: "visible" });
          assert.notEqual(await entry.getAttribute("open"), null);
          await entry.locator("summary").click();
          assert.equal(await entry.getAttribute("open"), null);
        }
        if (path === "/")
          await page.screenshot({
            path: resolve(output, `${width}-${theme}.png`),
            fullPage: false,
          });
        page.off("pageerror", listener);
      }
      await context.close();
    }
  if (!captureOnly) {
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const delayed = `http://127.0.0.1:${server.address().port}/`;
    for (const width of [375, 768, 1366, 1920])
      for (const theme of ["light", "dark"]) {
        const context = await browser.newContext({
          viewport: { width, height: 940 },
        });
        await context.addInitScript((theme) => {
          localStorage.setItem("saitena-theme", theme);
          window.footerShifts = [];
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries())
              if (
                !entry.hadRecentInput &&
                entry.sources.some((source) =>
                  source.node?.matches?.("footer.site-footer"),
                )
              )
                window.footerShifts.push(entry.value);
          }).observe({ type: "layout-shift", buffered: true });
        }, theme);
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(delayed, { waitUntil: "networkidle" });
        const data = await page.evaluate(() => ({
          shifts: window.footerShifts,
          footerTop: document.querySelector("footer").getBoundingClientRect()
            .top,
          loading: document.querySelector("main > [role=status]") !== null,
        }));
        assert.deepEqual(data.shifts, [], `${width} ${theme}: footer CLS`);
        assert(data.footerTop > 940);
        assert.equal(data.loading, false);
        assert.deepEqual(errors, []);
        transport.push({ width, theme, errors, ...data });
        await context.close();
      }
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
    for (const userAgent of [
      "NoJS browser",
      "Googlebot",
      "bingbot",
      "OAI-SearchBot",
      "PerplexityBot",
      "Claude-SearchBot",
    ]) {
      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width: 375, height: 940 },
        userAgent,
      });
      const page = await context.newPage();
      for (const path of userAgent === "NoJS browser"
        ? paths
        : [
            "/",
            "/services",
            "/contact",
            "/blog/what-is-a-website-subscription",
          ]) {
        assert.equal(
          (
            await page.goto(new URL(path, base).href, { waitUntil: "load" })
          ).status(),
          200,
        );
        const data = await page.evaluate(() => ({
          h1Visible: document.querySelector("main h1")?.checkVisibility(),
          mainTextLength: document.querySelector("main").innerText.length,
          canonical: document.head
            .querySelector('link[rel="canonical"]')
            ?.getAttribute("href"),
          robots: document.head.querySelector('meta[name="robots"]')?.content,
          loading: !!document.querySelector("main > [role=status]"),
          structuredData: [
            ...document.querySelectorAll('script[type="application/ld+json"]'),
          ].map((el) => JSON.parse(el.textContent)),
        }));
        assert.equal(data.h1Visible, true, `${userAgent} ${path}`);
        assert.equal(data.loading, false, path);
        assert(data.mainTextLength > 100, path);
        assert.equal(
          data.canonical,
          path === "/" ? "https://saitena.com" : `https://saitena.com${path}`,
        );
        assert.match(data.robots, /noindex/);
        assert.equal(data.structuredData.length, 1);
        if (userAgent === "NoJS browser" && path === "/faq") {
          const entry = page.locator("details.faq-item").first();
          await entry.locator("summary").click();
          assert(
            await entry.locator(".faq-answer p").isVisible(),
            "FAQ answer must open without JavaScript",
          );
          assert(
            (await entry.locator(".faq-answer p").innerText()).length > 10,
          );
        }
        noJS.push({ userAgent, path, ...data });
      }
      await context.close();
    }
  }
} finally {
  await writeFile(
    resolve(output, "results.json"),
    JSON.stringify({ results, transport, noJS }, null, 2),
  );
  await browser.close();
  if (server.listening) await new Promise((resolve) => server.close(resolve));
}
console.log(
  JSON.stringify({
    passed: true,
    geometryChecks: results.length,
    baselineCompared: !!baseline,
    footerCLSChecks: transport.length,
    noJSChecks: noJS.length,
  }),
);
