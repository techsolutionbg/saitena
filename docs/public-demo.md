# Public demonstration profile

`NEXT_PUBLIC_RELEASE_MODE=public-demo` builds the reviewed demonstration content for an eventual owner-approved all-IP release. It does not open network access or grant deployment permission.

The application shares the preview privacy controls: authentication and indexing cannot be enabled, legal routes and aliases return 404, contact submission returns 403, no real mail is sent, robots disallows crawling and responses use noindex/nofollow and private no-store. Company/contact details and prices remain marked as examples in context. There is no visible preview banner or logo label.

This profile is separate from `private-preview`, which still requires an approved restricted access plan. The full `public` release still requires confirmed company, legal and contact data, public asset rights and a deployment approval. A demo approval never satisfies those full release conditions.

## Approval and asset rights

`scripts/check-release-readiness.mjs` with `SAITENA_RELEASE_MODE=public-demo` reads `docs/public-demo-approval.json`. It requires the owner to approve the public demonstration, public display of test data, public SVG display rights, the Cloudflare-only origin plan and the deployment plan. All tracked approvals initially remain false.

The original SVG source manifest retains its private-preview provenance. Public demonstration requires an additional owner grant containing exactly every manifest asset's path and SHA256 in `approved_assets`. Missing, additional or changed hashes fail the gate, as do changed source bytes, unreviewed files and missing assets. The private-only grant alone is insufficient. A root-only release receipt may supply consent to a private review copy only after explicit approval of the exact image, content, asset hashes and access plan.

CI builds and probes the candidate without publishing it. The existing automated production workflow does not gain a new deployment mode or enablement from this change; initial public demonstration requires the separately reviewed manual release plan. No new pipeline, production secret or infrastructure is created.

## Access transition after approval

Only the apex and www routes are in scope. Prepare and test the new container behind the existing home restriction first. Retain Cloudflare peer validation, the external origin key import, header stripping, worker restrictions and the direct-origin 403 fallback. Remove only the home-address matchers from Caddy; disable only the host-scoped home-IP WAF block as the final access-opening action. No global allow/skip rule is needed.

Back up and validate the exact configuration before any reload. A failed or incomplete acceptance closes access again and restores the captured guarded version. All-IP access must be checked from a genuinely external IPv4/IPv6 source; local fixture headers are not evidence of an external access test. Other hostnames and their known baseline problems remain outside this update.

See the [Caddy matcher reference](https://caddyserver.com/docs/caddyfile/matchers#remote-ip) and [Cloudflare custom rules documentation](https://developers.cloudflare.com/waf/custom-rules/).
