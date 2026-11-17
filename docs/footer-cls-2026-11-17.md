# Streamed loading fallback and footer CLS — 17 November 2026

> Follow-up: the SEO rendering continuation removes the automatic loading
> boundaries so public content is visible without JavaScript. The final design
> and absence of footer shifts are covered by `tests/browser/public-rendering.mjs`
> (including delayed transport). This document records the earlier fallback fix
> and its historical measurements; use [the current report](seo-rendering-2026-11-17.md)
> for the implementation and browser commands that supersede the example below.

Baseline: deployed main `54909bc8d12a7c1e235c1950b68ffbc80943ecf0` (PR #3).
Correction branch: `codex/fix-footer-cls`. Production has not been updated by this work.

## Proven cause

The saved production Lighthouse desktop trace, run 2, records a **0.230048** shift
of `footer.site-footer` at monotonic timestamp `101833963369` µs. Its old visible
rectangle is x48/y707/1239×233; the maximum movement is 7204.15625px. The final
footer is near y7911. Trace screenshots immediately before the event show the
spinner and “Зареждаме страницата…” above a visible footer. Subsequent screenshots
show the home Hero in that space.

The actual prerendered HTML contains `main > template#B:0` and the shared route
loading fallback, followed by the shared footer. Completed home content arrives
in the hidden `S:0` segment. React's inline `$RV` stream-completion script replaces
the fallback; the large layout/shift follows that call. The fallback has
`min-height:60vh; min-height:60svh`. At the trace's 940px viewport height this is
564px; header 143px + fallback 564px explains the footer's **exact y707**.

This is an undersized **server-streamed loading placeholder**, rather than a
footer positioned incorrectly after the page has loaded.

### Alternative causes checked

- **CSS:** the three initial stylesheet responses completed roughly 75ms or more
  before the shift. Computed fallback/main height in reproduction is exactly
  564px. No content-visibility rule or asynchronous stylesheet change explains
  the 7204px jump.
- **Fonts:** the separate Latin Manrope font shift occurs approximately 141ms
  after the large shift and contributes only 0.000030 CLS. Font settings and
  the approved variable fonts remain unchanged.
- **Images:** existing image dimensions and final page geometry are unchanged.
  Blocking every image still reproduces the large footer shift.
- **Hydration:** the first external Next JavaScript evaluation starts 42ms after
  the large shift. Blocking all external scripts still reproduces it: React's
  inline HTML stream replacement runs before hydration. No client/hydration
  error occurred in the full-resource regression runs.
- **Dynamic content:** the arriving content is the prerendered home page in a
  Suspense boundary. No API response, account state or newly inserted client
  widget is required to reproduce the event.

## Controlled reproduction and correction

An isolated local HTTP proxy delivers the **actual built HTML** up to its hidden
`S:0` content, waits 900ms, then delivers the remainder unchanged. This makes the
fallback's first paint observable without altering application behavior.

At 1350×940, with external scripts/fonts/images blocked equally on both sides:

| One-variable experiment               | Initial footer top | Final footer top | Footer shift |
| ------------------------------------- | -----------------: | ---------------: | -----------: |
| Original fallback 60svh               |              707px |         7921.5px |     0.230246 |
| Only CSS min-height changed to 100svh |             1083px |         7921.5px |        **0** |

The application correction changes just the fallback's two minimum-height values
to **100vh / 100svh**. The shared footer stays below the initial viewport while
streamed content replaces the fallback. The existing spinner, status text,
streaming, route navigation, reduced-motion handling and final page design remain.
No footer hiding, artificial fixed page height, client loading gate, font change
or animation removal is used. Small remaining font/animation CLS is not claimed fixed.

## Regression and visual checks

`tests/browser/loading-layout.mjs` exercises real compiled HTML/CSS with a delayed
stream, records layout-shift attribution and screenshots, and asserts that the
fallback does not expose the shared footer and completion produces no footer shift.
It also checks final content readiness, theme, overflow and client/hydration errors.

- Old build fails the test as expected: visible footer at y709, footer shift
  0.219532 at 375×940.
- Corrected release build passes **8/8** cases: 375, 768, 1366, 1920px, light/dark.
- At 375px, baseline/corrected final main text and exact main/H1/footer rectangles
  match: footer y10795.953125, width335, height1304.578125. Both viewport and delayed
  loading screenshots were inspected. The correction affects transient fallback
  space; it does not add whitespace to completed pages.

The browser test uses a separately supplied Puppeteer module and Chrome binary;
it introduces no application dependency or CI/CD pipeline. Example with the
existing local Lighthouse/Chrome test image (replace the isolated build IP):

```powershell
docker run --rm --cap-drop ALL --security-opt no-new-privileges `
  --mount "type=bind,source=${PWD},target=/app,readonly" `
  --mount "type=bind,source=${PWD}/qa-output/footer-cls,target=/reports" `
  -e BASE_URL=http://172.17.0.6:3000 `
  -e PUPPETEER_MODULE=/usr/local/lib/node_modules/lighthouse/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js `
  -e OUTPUT_DIR=/reports/browser-fixed --entrypoint node `
  saitena-website-lighthouse:13.6.0 /app/tests/browser/loading-layout.mjs
```

## Comparable Lighthouse measurements

Twelve fresh-profile runs, interleaved baseline/candidate: three per device per
version. Same Linux Docker host, Lighthouse13.6.0/Chrome157.0.8103.38, valid local
trusted HTTPS/HTTP2, gzip, simulated mobile/desktop presets, QUIC disabled only
in the auditor. All reports used h2 and had no runtime errors, run warnings or
failed resource responses. No other browser/load test ran concurrently.

| Median      | Mobile before | Mobile after | Desktop before | Desktop after |
| ----------- | ------------: | -----------: | -------------: | ------------: |
| Performance |            99 |           99 |            100 |           100 |
| FCP         |        1.054s |       1.057s |         0.285s |        0.285s |
| LCP         |        2.104s |       2.107s |         0.569s |        0.571s |
| TBT         |          70ms |         61ms |            0ms |           0ms |
| CLS         |      0.006937 |     0.006937 |       0.000030 |      0.000030 |
| Speed Index |        1.054s |       1.057s |         0.367s |        0.338s |

All three corrected mobile LCP runs are 2.017–2.107s. FCP/LCP differences of a few
milliseconds are within observed run variation. The rapid local baseline does
not expose its fallback during these ordinary Lighthouse runs; the delayed-stream
regression and original production trace establish the intermittent failure and fix.
No adverse run was discarded. These local results are separate from production/
Cloudflare measurements; production needs a separately approved deployment.

## Other checks and release scope

ESLint, TypeScript and 36 Node tests passed locally. The public-demo Docker release
build passed build-time content/asset gates. The existing GitHub Actions workflow
performs the complete CI suite, including Python and deployment/rollback rehearsals.
Windows' Python launcher is unavailable in this environment; local Python tests
were not marked successful. Their actual result must come from the existing CI.

No workflow, Dockerfile, dependency, origin guard, Cloudflare, noindex, disabled
mail/auth, legal restriction or other service configuration is modified. The
candidate is submitted on a separate branch/PR; merge and production Environment
approval remain required before deployment.

Raw trace frames, causal A/B results, full Lighthouse reports/traces, regression
screenshots and build/test logs are retained under ignored `qa-output/footer-cls/`.
