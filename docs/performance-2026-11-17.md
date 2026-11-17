# Saitena LCP optimization — 17 November 2026

Baseline source: deployed main `4f0cb52293c189549529607658c3b9adb4275c4d`.
Candidate branch: `codex/performance-lcp`. Production is unchanged by this work.

## Diagnosis

The supplied [PageSpeed report](https://pagespeed.web.dev/analysis/https-saitena-com/nm9u1p4dn5?form_factor=mobile)
reports Performance 78, FCP 0.948 s, LCP 5.260 s, TBT 9 ms, CLS 0.008 and SI 4.200 s.
Its LCP node is the home Hero **section/background**, `section[aria-labelledby="home-title"]`.
The existing mobile background is already a 15,746-byte WebP. The report's observed
trace attribution is resource discovery 1440 ms, download 120 ms and render delay 920 ms
(TTFB displayed 0 ms). Observed trace subparts must not be added to or confused with
the simulated 5.260 s Lighthouse metric.

The waterfall shows render-blocking shared CSS, late background discovery, static
Manrope weights/subsets, below-fold Lora and the embedded-raster SVG brand assets.
Each original logo/favicon SVG transfers about 500 KB without compression locally.
The Hero is already server-rendered/static. Canvas and the existing staggered
content animation are decorative; neither is removed or made a rendering gate.

## Comparable before / after

Median of three fresh browser-profile runs per version and device, same local
Docker host, trusted local HTTPS/HTTP2, gzip, Lighthouse 13.6.0, Chrome for Testing
157.0.8103.38. No TLS error bypass, warm browser cache or reduced motion is used
for Lighthouse. Mobile:412×823/DPR1.75, Moto G Power, simulated Slow 4G 150 ms /
1638.4Kbps / CPU4×. Desktop:1350×940/DPR1,40ms /10240Kbps / CPU1×.

| Metric      | Mobile before | Mobile after | Desktop before | Desktop after |
| ----------- | ------------: | -----------: | -------------: | ------------: |
| Performance |            81 |           99 |             99 |           100 |
| FCP         |        1.056s |       1.059s |         0.285s |        0.287s |
| LCP         |        5.113s |       2.107s |         0.965s |        0.571s |
| TBT         |        75.5ms |       54.5ms |            0ms |           0ms |
| CLS         |      0.007462 |     0.006937 |       0.000356 |      0.000030 |
| Speed Index |        1.630s |       1.059s |         0.434s |        0.337s |

Mobile LCP improves 59%; the sub-2.5s target is met in the controlled HTTP2 suite.
FCP changes by only2–3ms, within run variance. These results are local lab evidence;
a new Google PSI result for production requires a separately approved deployment.
The reported PSI TBT 9 ms is from different hardware and is not the controlled baseline.

Median mobile simulated LCP attribution (individual medians need not sum exactly):

| Subpart                | Before |  After |
| ---------------------- | -----: | -----: |
| TTFB                   |  606ms |  609ms |
| Resource load delay    | 1852ms |    0ms |
| Resource load duration |  334ms |  150ms |
| Element render delay   | 2395ms | 1350ms |

Initial-load bytes drop from1,442,461 to423,787 (about71%); font requests 13→7.
The local runtime image drops from about 874 MB to 320 MB (about63%).

Initial Windows/HTTP1 diagnostics are retained separately: mobile baseline78 /
6.02s; intermediate optimized92 /3.35s. They are not mixed with the HTTP2 table.
An experimental CSS-inlining variant worsened TBT/CLS and was rejected; no
experimental inlining flag is included in the candidate.

## Changes and preserved behavior

- Responsive high-priority preload for the existing home light-theme CSS artwork,
  matching the768px breakpoint. No LCP lazy loading, new artwork or image quality
  reduction. The default theme is light; an existing stored dark choice still uses
  the original dark CSS background. SSR cannot read localStorage, so that case can
  additionally fetch the small light preload. No theme behavior is changed.
- `next/font/local` uses Manrope variable 5.3.0, the **same v20 /4.504 source** as
  static Manrope 5.3.0. All six subsets and weights 200–800 remain available, with
  original unicode ranges; only above-fold Cyrillic is preloaded. All 30 tested
  subset/weight combinations400–800 retain glyph coverage and identical ascent,
  descent, line gap and advance widths (maximum difference 0 units). Lora is kept.
- Three fixed static routes rasterize approved SVGs at build time. Full-resolution
  light/dark PNGs have exactly the same RGBA pixels as rendering their source SVGs;
  the favicon uses the same mark at64×64. No arbitrary paths or user input are used.
  `next/image` serves responsive brand versions with sizes210px and quality90.
  Unknown `/media` paths are rejected before React streaming can turn notFound into200.
- Original public files, rights records and source hashes remain unchanged. The
  release test permits only these fixed derivatives of manifest-approved sources
  and compares their dimensions and raw pixels. Other manifest/hash checks stay.
- Standalone Docker output explicitly includes `public`, `.next/static`, traced
  server dependencies, release-assets.json and font licenses. It runs `node server.js`
  as the existing nonroot user with the same health/cache/readonly constraints.
- Existing pages stay static; the new image routes are statically generated.
  Interactive navigation, FAQ, theme, text scaling and Canvas controls are retained.
  No client dependency is removed at the cost of functionality or browser support.

## Server / security checks

Read-only production samples: median Cloudflare TTFB 155.68 ms; application loopback
TTFB 97.95 ms. The internal path is SSH→docker exec existing frontend→loopback HTTP;
it excludes TLS/Caddy/Cloudflare and does not read the origin token or bypass its guard.
CSS/JS return gzip, Vary:Accept-Encoding, private/no-store and CF-cache-status:DYNAMIC.
The existing guard/cache bypass intentionally overrides static caching; no WAF,
Caddy, SSH, DNS, subdomain or production cache policy is changed.

Noindex/nofollow/noarchive, disabled auth/orders/mail, legal denials, exact asset
rights gates and owner deployment approval remain. No sensitive data is cached.

## Validation and evidence

Local lint, TypeScript and 36 Node tests pass; production dependency audit has 0
vulnerabilities and the file/history secret audit has no findings. Existing release
checks pass against both public-demo (23 original assets) and closed preview
(4 substitute assets), including disabled mail/auth, legal/alias denials and raw
asset hashes. The public test additionally validates all three lossless derivatives.

Chrome comparisons at375/768/1366/1920px in both themes retain all visible text,
with no horizontal overflow or broken completed images. Maximum measured element
geometry difference is 0.266 px. Seven other public routes retain their text and
noindex; mobile menu, FAQ toggle, theme and 150% text controls work without overflow.
Temporary viewport/motion overrides and appearance settings are restored.

Raw Lighthouse JSON/HTML, traces, devtools waterfalls, all runs/configuration,
font equivalence, server samples and screenshots are intentionally ignored in
`qa-output/performance-lcp/`. `comparison-linux.json` is the primary paired dataset;
`linux-before-*.report.*` / `linux-after-*.report.*` are its full reports.
`measure-linux.mjs`, pinned runner Dockerfiles and local test CA capture the exact
method; the CA is trusted only inside the isolated test image. No production
configuration or credential is part of the test setup.

The associated PR runs the existing full CI; no new pipeline or performance score
bypass is introduced. Merge and production deployment require separate owner approval.

References: [LCP optimization](https://web.dev/articles/optimize-lcp),
[Next local fonts](https://nextjs.org/docs/app/api-reference/components/font),
[Next Image](https://nextjs.org/docs/app/api-reference/components/image),
[standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
