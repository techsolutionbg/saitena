// Run against an isolated production build. See docs/footer-cls-2026-11-17.md.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const upstream = new URL(process.env.BASE_URL);
assert.equal(upstream.protocol, "http:");
assert.match(upstream.hostname, /^(127\.0\.0\.1|localhost|172\.17\.\d+\.\d+)$/);
const { default: puppeteer } = await import(process.env.PUPPETEER_MODULE);
const output = resolve(
  process.env.OUTPUT_DIR ?? "qa-output/footer-cls/browser",
);
await mkdir(output, { recursive: true });

// Deliver the actual built fallback first, then the completed Suspense boundary.
// This controls transport timing without changing the page, CSS or React code.
const observer = `<script>
window.loadingEvidence = { shifts: [] };
new PerformanceObserver(list => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) loadingEvidence.shifts.push({
      value: entry.value,
      sources: entry.sources.map(source => ({
        footer: source.node?.matches('footer.site-footer') ?? false,
        previousY: source.previousRect.y, currentY: source.currentRect.y
      }))
    });
  }
}).observe({ type: 'layout-shift', buffered: true });
</script>`;
const server = createServer(async (request, response) => {
  try {
    const source = await fetch(new URL(request.url, upstream));
    const bytes = Buffer.from(await source.arrayBuffer());
    response.writeHead(source.status, {
      "Content-Type":
        source.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    if (request.url === "/") {
      const html = bytes.toString().replace("</head>", observer + "</head>");
      const boundary = html.search(/<div hidden id="S:\d+">/);
      assert(
        boundary > 0,
        "Built HTML must contain the real streamed boundary",
      );
      response.write(html.slice(0, boundary));
      setTimeout(() => response.end(html.slice(boundary)), 900);
    } else response.end(bytes);
  } catch {
    response.destroy();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-extensions"],
});
const results = [];
try {
  for (const width of [375, 768, 1366, 1920]) {
    for (const theme of ["light", "dark"]) {
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewport({ width, height: 940, deviceScaleFactor: 1 });
      await page.evaluateOnNewDocument((value) => {
        localStorage.setItem("saitena-theme", value);
      }, theme);
      const navigation = page.goto(url, { waitUntil: "load" });
      await page.waitForSelector("#main > [role=status]");
      const fallback = await page.evaluate(() => ({
        top: document
          .querySelector("footer.site-footer")
          .getBoundingClientRect().top,
        viewport: innerHeight,
        status: document.querySelector("#main > [role=status]").textContent,
      }));
      await page.screenshot({
        path: resolve(output, `${width}-${theme}-loading.png`),
      });
      await navigation;
      await page.waitForSelector("#home-title");
      await page.evaluate(() => document.fonts.ready);
      await new Promise((done) => setTimeout(done, 1400));
      const completed = await page.evaluate(() => ({
        shifts: window.loadingEvidence.shifts,
        loading: !!document.querySelector("#main > [role=status]"),
        overflow: document.documentElement.scrollWidth > innerWidth,
        theme: document.documentElement.dataset.theme,
        mainText: document.querySelector("#main").innerText,
        geometry: ["#main", "#home-title", "footer.site-footer"].map(
          (selector) => {
            const bounds = document
              .querySelector(selector)
              .getBoundingClientRect();
            return {
              selector,
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
            };
          },
        ),
      }));
      await page.screenshot({
        path: resolve(output, `${width}-${theme}-ready.png`),
      });
      const footerShifts = completed.shifts.filter((entry) =>
        entry.sources.some((source) => source.footer),
      );
      const evidence = {
        width,
        theme,
        fallback,
        ...completed,
        footerShifts,
        errors,
      };
      results.push(evidence);
      await writeFile(
        resolve(output, "results.json"),
        JSON.stringify(results, null, 2) + "\n",
      );
      assert(
        fallback.top >= fallback.viewport,
        "Loading fallback exposed the shared footer",
      );
      assert.equal(
        footerShifts.length,
        0,
        "Stream completion moved a visible footer",
      );
      assert.equal(completed.loading, false);
      assert.equal(completed.overflow, false);
      assert.equal(completed.theme, theme);
      assert.deepEqual(errors, [], "Unexpected client/hydration error");
      console.log(
        JSON.stringify({ width, theme, passed: true, footerShifts: 0 }),
      );
      await page.close();
    }
  }
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
