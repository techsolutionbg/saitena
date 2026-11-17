# Dormant SEO Caddy fragments

These files are review artifacts. No application, Compose file, deploy agent or
production workflow imports them. Nothing in this directory activates indexing,
reloads Caddy, changes another hostname or configures caching.

The public website currently shares a guarded block for `saitena.com` and
`www.saitena.com`. Preserve its Cloudflare transport checks, external origin-key
import, worker denial, credential stripping and all other host blocks.

## Canonical host and closed sitemap profile

After separate deployment approval, insert the imports **inside the existing
authorized public route**, after origin denials and before the existing website
reverse proxy. The caller must retain Caddy `route` ordering:

```caddyfile
# Only the following lines are new inside the authorized route.
import /reviewed/seo/canonical-www.caddy
import /reviewed/seo/sitemaps-closed.caddy
# Existing reverse_proxy and its header_up stripping remain here.
```

`canonical-www.caddy` redirects exactly the `www.saitena.com` Host to
`https://saitena.com{uri}` using HTTP 308. `{uri}` retains path and query, including
escaped values and repeated query keys. It does not redirect apex to itself.
Denied origin/worker requests must still return 403 before any redirect.

`sitemaps-closed.caddy` keeps both sitemap paths, slash variants and query
variants at 404/noindex. Existing global noindex headers, application release
flags, robots.txt and public-demo restrictions remain in place.

Keep the existing HTTP-to-HTTPS edge behavior. If the owner approves a single-hop
HTTP-www redirect, add the exact-host rule at Cloudflare/Caddy only after its
own path/query and origin-guard checks. No DNS or edge setting is changed here.

## Indexing profile: separate owner approval required

Only in the separately approved indexing release, replace **one** closed import
with the following dormant import, passing the exact reviewed website upstream:

```caddyfile
import /reviewed/seo/canonical-www.caddy
import /reviewed/seo/sitemaps-indexing-approved.caddy EXISTING_APPROVED_WEBSITE_UPSTREAM
```

The second argument is a deployment placeholder, not a new backend. It must equal
the current reviewed website container/port. Never point it at Auth, API or a
portal. The snippet forwards only the two sitemap paths and their slash variants;
the website handles slash redirects. It strips the origin key upstream.

That import alone does not make a release indexable. Approval must cover the
matching `public` image built with `NEXT_PUBLIC_INDEXING_ENABLED=true`, removal
of the **public website's** obsolete edge noindex override, robots crawl access
and the reviewed route profile. Keep draft/legal noindex and all origin guards.
Do not put this import before authorization or into a shared/global host scope.

## Exact-template approval and rollback

The existing public-demo deploy agent hashes the normalized Caddy template and
refuses changes outside the website upstream. A canonical/sitemap change requires
a separately reviewed paired template/profile migration. Do not weaken that hash
check or silently update its receipt. Capture and back up the real file and native
config, prepare the exact diff and new profile hash, validate with the installed
Caddy, rehearse rollback, then request approval of those exact artifacts.

`scripts/test-seo-caddy.mjs` validates these fragments using actual Caddy 2.10 in
new isolated containers. Its indexing profile is an owned fixture on an internal
network; it is not an approved production profile. It checks redirects, closed
and candidate sitemap access, worker/key denials and upstream key stripping.
It never mounts a production config, Docker socket or external origin credential.

The shared [release plan](../../docs/seo-release-plan.md) lists all remaining
approvals and activation checks.

Syntax references: [Caddy redirects](https://caddyserver.com/docs/caddyfile/directives/redir)
and [request matchers](https://caddyserver.com/docs/caddyfile/matchers).
