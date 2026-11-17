# Production preparation — 15 November 2026

## Status and repository

No production changes and no commit or push performed. Production auth stays disabled.
`apps/saitena` already has its own Git history and origin https://github.com/techsolutionbg/saitena.git. GitHub CLI read-only inspection confirmed PRIVATE, default branch main. Monorepo parent still has no remote. Do not initialize a third repository, silently migrate history, or push parent files into the website repository. Existing website repository is suitable for the public site; monorepo consolidation needs an explicit owner decision.

The new `.github/workflows/checks.yml` belongs to the actual website repository root. The earlier parent workflow uses monorepo paths and is not a substitute. The new workflow does not deploy and has read-only contents permission. No GitHub workflow was triggered: the new file is local and the owner prohibited push without approval. Local lint/type/test/build jobs were run; do not label those as a GitHub Actions run.

## Contact form

The original 503 was an explicit development-only guard, not a failed production SMTP connection. Added server-side SMTP delivery independent of Laravel/database. Configuration: CONTACT_MAIL_MODE=smtp, CONTACT_SMTP_HOST, CONTACT_SMTP_PORT (465 implicit TLS or STARTTLS on other configured ports), CONTACT_SMTP_USER, CONTACT_SMTP_PASSWORD, CONTACT_MAIL_FROM, CONTACT_MAIL_TO. Credentials stay server-only and are not NEXT_PUBLIC values. Recipient and From are fixed by server config; user email is Reply-To. Mandatory certificate verification, TLS, authenticated SMTP, bounded timeouts, no URL/file attachments, generic client error on delivery failure. Existing validation, origin guard, byte-size limit and per-process 20 requests/minute limit retained. Edge/distributed abuse controls still require review before public form activation. SMTP acceptance is not proof of inbox delivery; no durable retry queue is implemented.

Missing/malformed SMTP config fails closed with 503. This is intentional. Production credentials/approved business recipient have NOT been supplied or installed. No real customer email was sent. Seven local tests passed (five existing message validations and two config tests).

## Local staging

Production Dockerfile `.deployment/Dockerfile` builds auth=false/indexing=false with Next.js and runs non-root. Docker context excludes .git, .env*, build outputs, screenshots/docs and lint node_modules. Monorepo Docker ignore also now excludes nested .git.

Isolated project `saitena-website-https-staging` uses `.deployment/compose.staging.yaml`:

- https://localhost:13443 — Caddy internal CA, no public DNS/production route.
- http://127.0.0.1:13444 — same production container for browser visual QA.
- http://127.0.0.1:18028 — separate Mailpit inbox, SMTP not published.
- Local CA public certificate copied to ignored qa-output/staging-root.crt. Private key remains in the new Docker volume. No CA installed in Windows/browser trust store, no browser certificate warnings bypassed.

Reproduce from website directory:

```powershell
docker build -f .deployment/Dockerfile -t saitena-website-public:candidate .
$env:SAITENA_STAGING_IMAGE = 'saitena-website-public:candidate'
docker compose -f .deployment/compose.staging.yaml up -d
docker cp saitena-website-https-staging-tls-1:/data/caddy/pki/authorities/local/root.crt qa-output/staging-root.crt
node scripts/check-https-contact.mjs
```

The HTTPS test verifies CA chain AND hostname, health, invalid Origin=403, invalid email=400, valid form=200 and actual receipt in Mailpit with fixed .test recipient and visitor Reply-To. Passed. Windows curl Schannel could not check revocation for the internal CA; Node TLS verified it with explicit CA without disabling certificate verification.

## Checks and content

- ESLint passed with zero warnings. tools/lint is an independent locked tool package using TS6 API, required by typescript-eslint; app stays TypeScript 7.0.2. `npm ci --prefix tools/lint` before `npm run lint`. Do not bypass peer dependency checks with --force.
- App TypeScript passed. Fresh production Docker image built successfully with 30 generated routes after SMTP/lint/branding changes.
- Local production HTTP smoke from preceding preparation passed 12 pages, 18 static assets, 5 auth redirects; auth remains disabled.
- Browser inspected home/contact at mobile 390x844 and prices at 1440x900. Light/dark transitions and mobile menu worked; sampled pages had document width <= viewport width. Theme preference persisted across navigation. This is sampled visual QA, not a full accessibility/performance audit. HTTPS transport was tested separately; browser used the HTTP loopback companion.
- Removed nonfunctional AI assistant claim from home and metadata. Replaced claims that conceptual portfolio designs are real client work in portfolio intro and home.
- Legal pages remain structural drafts: provider name/EIK/contact, processing purposes/legal bases/retention/processors, actual cookies/maps/storage inventory, contract/tax/cancellation/ownership decisions are missing. Do not invent these. Release remains BLOCKED; no placeholders may be published.
- Build without owner contact variables currently shows "Очаква данни". Owner must supply public contact details and review Viber/phone/email before deployment; do not publish this candidate as final content.
- Public portfolio image rights, binary screenshot contents and broader commercial claims require owner review.

## Git scan limitations

`node scripts/audit-git-candidate.mjs` scans tracked plus untracked nonignored files and available Git history for common key/token/private-key patterns, reporting paths only. Last scan: 356 files, no pattern findings; 174 binary files require human review. .env/node_modules/.next/qa-output correctly ignored, only .env.example tracked. No archive/private-key path findings. This is heuristic, not certification that all files/history are secret-free. Never use `git add .` at monorepo root. Selectively stage reviewed website changes only AFTER approval and binary/content review.

## DNS, Cloudflare and HTTPS

Read-only checks on 15 November confirmed saitena.com and api.saitena.com resolve to Cloudflare edge addresses and validate TLS until 1 February 2027. clients.saitena.com resolves to 62.84.177.233 with valid TLS until 6 February 2027; do not alter it or PHP2. portal.saitena.com still has no DNS record. No authenticated Cloudflare dashboard/API audit completed; Full (strict), origin cert renewal, cache bypass for auth/API, WAF/rate limiting and zone access remain unverified. Public DNS cannot prove these settings. No tokens were collected or exposed.

## Deployment and rollback gates

1. Resolve legal/contact/asset rights and business claims, approve production SMTP recipient/credentials; audit Cloudflare read-only with authorized account access. Keep public registration disabled.
2. Owner approves selective commit/push to the existing PRIVATE website repository. Run checks workflow there, record exact commit SHA and image digest. Full HTTPS auth needs separate staging/API authorization; information-only release needs no production API change.
3. Obtain separate approval for production candidate containers/network, portal DNS/TLS and merged Caddy change. Re-capture LIVE Caddy file/JSON, image IDs, mounts, network, overlays and protected env. Repository Caddyfile is stale. Preserve clients/API/admin/infra blocks exactly.
4. Stage immutable image under a new project/upstream alias, health-check before public routing. No DB migrations, account changes or PHP2 operations. For SMTP pass only server runtime secrets, never bake .env into image.
5. Validate complete merged Caddy config, reload only Caddy using a mount-aware method; prove running config changed (file bind mounts can retain old inode after host atomic rename). Confirm old service endpoints unchanged. Check public pages/assets/health and noindex/auth-disabled behavior. No production test registration or customer mail.
6. Rollback restores the captured complete live Caddy routing to the still-running previous services, validate/reload and compare live JSON. For later releases retain previous frontend image and switch upstream back. Do not down/prune/remove volumes. Restore SMTP runtime env only for new frontend if needed; API/DB untouched. Check previous main page, API/admin/infra and clients health. Only newly approved DNS records are candidates for separate DNS rollback.

Local staging rollback can rehearse image replacement and route/health checks but cannot prove production Caddy mount behavior. Production rollback is not called "tested" until the complete merged candidate has been validated in a matching disposable environment and the actual approved activation has its captured restore bundle.

Local rollback rehearsal completed: prepared image -> retained candidate image -> prepared image. Every site container became healthy; rollback and final HTTP health returned 200. Final prepared image HTTPS contact test passed. Runtime image exclusion checks for .env/.git/qa-output/lint node_modules passed. Production routing rollback remains untested pending its separately approved complete candidate.
