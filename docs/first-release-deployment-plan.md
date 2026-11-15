# First release: review candidate and activation plan

## Latest state (15 November 2026)

This document supersedes the earlier "no commit/push" preparation status. The owner authorized a branch and PR; candidate commit 083ac29 was pushed ONLY to codex/first-production-candidate in the existing PRIVATE techsolutionbg/saitena repository. Draft PR: https://github.com/techsolutionbg/saitena/pull/1. No merge or production activation. CI: https://github.com/techsolutionbg/saitena/actions/runs/43679603083 (check live status rather than assuming success).

All 174 binaries were decoded and inspected as contact sheets, recorded with SHA256, sizes/dimensions and EXIF presence. No unknown formats or EXIF found. 151 screenshots and 2 unused masters are removed from the new tracked tree, retained locally and excluded from Docker context. They remain in existing private Git history; history rewriting is not authorized. 21 runtime images plus 3 SVG logos with embedded PNG remain PRIVATE REVIEW ONLY until owner confirms publication rights. Metadata/visual review does not prove copyright, lack of hidden data or ownership. The release target refuses public build with these pending approvals or legal draft markers. No unconfirmed asset is approved for public deployment by this PR.

Ignore rules now cover generated Next route types, .env and named *.env files, local QA/screenshots, node_modules, build outputs, logs, archives and private key formats. Only blank example env files are committed. Current files and complete available Git patch history passed the heuristic secret scan; no history entries were found for .env, private-key or archive paths. Never call this a proof of absence of all possible secrets. Clean-checkout typecheck now runs next typegen before tsc.

## Read-only production checks

Active Caddy file SHA256: 78de26d581cd0e4857d67beca062f18cfb0571013a1ad88ee7772f32b32c58ae. Live admin JSON host routes match the mounted file: clients/admin/infra/api/public/www. clients -> 100.64.146.95:8443 and the existing __Host panel cookie handling are present. No portal route/DNS yet. Re-read the hash immediately before any future approved change; stop if it differs.

Cloudflare nameservers: surina.ns.cloudflare.com and tate.ns.cloudflare.com. Public site/API use Cloudflare edge records; clients keeps its existing direct record. TLS CA+hostname checks passed in the preceding audit. No authenticated Cloudflare connector/account session was available for zone configuration inspection. Full (strict), origin certificate expiry/renewal, cache bypass, WAF/rate limits, CAA and SPF/DKIM/DMARC are NOT declared verified. These are explicit blockers to the final infrastructure go decision, not reasons to change DNS automatically. portal.saitena.com remains absent. No production API registration or email test was performed.

## Release gates before requesting activation approval

1. PR checks must be green on its final head, owner reviews the diff and grants merge approval; no auto-merge or push to main.
2. Owner completes first-release-owner-checklist.md. Replace legal drafts and contact placeholders, verify claims, approve asset source/licenses and update manifest only with documented approval.
3. Approved SMTP configuration supplied through a protected runtime file OUTSIDE Git, mode 0600. Blank template: .deployment/smtp.env.example. Never copy production API credentials wholesale into frontend. Validate provider TLS/certificates and From authorization; do not send tests to clients. Mailpit acceptance already passed locally; real mail delivery remains unverified.
4. Run `node scripts/check-release-readiness.mjs`. It currently MUST FAIL on pending rights/legal drafts. Build approved production artifact via `docker build --target release -f .deployment/Dockerfile ...`; candidate target is for private staging only. Record full Git SHA and immutable image digest in a protected release manifest. No uncommitted files in release context.
5. Complete authenticated read-only Cloudflare review and exact full merged Caddy validation; owner approves DNS/Caddy/new-container changes separately. Public HTTPS staging requires an approved hostname/route. Current local HTTPS staging is not public staging.

## Approved activation sequence (NOT executed)

1. Capture current complete Caddy file AND live admin JSON, mount path/semantics, image IDs, Compose labels/overlays, network and protected control env backups. Keep previous web/API/admin/infra/PHP2 services running. No DB migrations, users or roles changes.
2. Transfer verified frontend image, check hash/digest, start separate project with .deployment/compose.production-candidate.yaml. CONTACT_ENV_FILE contains only frontend runtime settings. EDGE_NETWORK is re-read from actual Caddy. Loopback health on 13000 must pass before any public route change. Port conflict means stop, not replace another service.
3. Compare approved full merged Caddy config to snapshot. Modify only public/www and new portal upstream if separately approved. Preserve clients/API/admin/infra blocks exactly. Portal needs its own separately built apps/web artifact; this website PR does not deploy portal or change Sanctum.
4. Validate merged Caddy in a disposable matching environment first. Validate on server before reload. Apply with a reviewed method that accounts for single-file bind mount inode behavior; verify file inside Caddy and live admin JSON after reload. Reload Caddy only, not the whole Compose stack. No DNS changes for clients/PHP2.
5. Check public HTTPS/status/static assets/robots/canonicals and all unchanged service routes. Keep auth/registration disabled, indexing remains off until content review is complete. Monitor error logs and memory. If public page/asset or existing service checks fail, roll back immediately.

## Rollback

Restore original captured Caddy content at the actual mounted location, validate and reload; inspect live JSON to prove restoration. Existing under-construction/old web upstream remains running. Check public old response plus API/admin/infra/clients. Do not delete containers/volumes/images or prune resources. For later frontend upgrades, retain prior image/upstream and switch only back to it. SMTP env restoration affects only new frontend runtime; no API/DB rollback operations.

New portal DNS can only be reverted if it was created under its own approval; existing domain records remain untouched. Record restoration checks and final image/config hashes. Local staging image upgrade -> rollback -> re-upgrade and health checks passed previously. Production Caddy rollback has NOT been executed or certified; the exact merged candidate and mount-aware restore bundle require separate infrastructure approval.

## Decision

Technically validated PRIVATE review candidate; NOT authorized or ready for public launch while owner data, asset/legal approvals, real SMTP setup and Cloudflare/production routing checks remain open. Production registration stays disabled throughout.
