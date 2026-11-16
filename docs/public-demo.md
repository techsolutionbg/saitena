# Public candidate with the unchanged local presentation

`NEXT_PUBLIC_RELEASE_MODE=public-demo` uses the normal local presentation and original asset URLs. It does not use closed-preview SVG substitutes or test contact content. Components, CSS, layout and 30/50/70 EUR prices are unchanged. Existing incomplete controls are retained at the owner's explicit request. This profile alone does not open network access.

Technical protections are separate from presentation: authentication and indexing cannot be enabled, legal routes/aliases return 404, contact submission returns 403, robots disallows crawling and responses use noindex/nofollow and private no-store. A visible form/profile control does not activate mail or authentication. Unknown/unpublished asset URLs return 404 before streamed rendering. There is no visible preview banner or logo label.

`scripts/prepare-public-demo.mjs` copies exact original bytes from `docs/public-demo-assets.json` at their original URLs. It does not rewrite UI source. Paths, case, duplicates and SHA256 are checked. Archives and the unused unknown-origin FAQ background are not copied. The closed private-preview preparation remains separate.

## Approval and asset rights

The original candidate contains 23 assets. The owner conditionally authorized 16 project-specific generated illustrations and three original logos; no contrary rights evidence was located. Four supplied home-background variants remain `not-confirmed`. Availability inside a local review image is not publication permission. See [the original rights audit](public-original-assets.md).

The readiness checker requires explicit content, asset-rights, origin-plan and exact deployment approvals, the complete asset hash grant and each asset's public permission. The four home variants block publication until their source/license is established. Access approval and successful CI cannot override missing rights. Full-public company/legal/contact gates remain unchanged. A root-only receipt may supply explicit consent to a private review copy only after the exact image/content/access plan is confirmed.

CI builds and probes the candidate without publishing it. The existing automated production workflow does not gain a new deployment mode or enablement from this change; initial public demonstration requires the separately reviewed manual release plan. No new pipeline, production secret or infrastructure is created.

Next.js Image is tested with the original raster files inside a read-only container. `/app/.next/cache` is a bounded writable tmpfs owned by uid/gid1000, and `/tmp` is temporary. No persistent volume is needed.

## Access transition after approval

Only the apex and www routes are in scope. Prepare and test the new container behind the existing home restriction first. Retain Cloudflare peer validation, the external origin key import, header stripping, worker restrictions and the direct-origin 403 fallback. Remove only the home-address matchers from Caddy; disable only the host-scoped home-IP WAF block as the final access-opening action. No global allow/skip rule is needed.

Back up and validate the exact configuration before any reload. A failed or incomplete acceptance closes access again and restores the captured guarded version. All-IP access must be checked from a genuinely external IPv4/IPv6 source; local fixture headers are not evidence of an external access test. Other hostnames and their known baseline problems remain outside this update.

See the [Caddy matcher reference](https://caddyserver.com/docs/caddyfile/matchers#remote-ip) and [Cloudflare custom rules documentation](https://developers.cloudflare.com/waf/custom-rules/).
