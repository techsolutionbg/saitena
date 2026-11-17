# Combined CLS + security headers release

PR #5 includes PR #4's actual commit ancestry. One protected merge of the combined
PR into main produces one approved release; do not merge the two separately and
do not approve an intermediate production run. The existing push/main CI → release
authorization → private GHCR digest → owner production Environment gate remains.

## Included behavior

- The shared streamed loading fallback reserves100vh/100svh, keeping the footer
  outside the viewport while the final page arrives. No completed-page redesign.
- XFO DENY, nosniff, host-only HSTS300s and diagnostic CSP Report-Only.
- Optimized-image enforcing sandbox CSP is retained. Full HTML CSP enforcement,
  registrations, orders, payments, mail and indexing are not enabled.
- The reviewed public/www Caddy defaults cover config redirects and gateway errors;
  the error route explicitly retains noindex/no-store. Other virtual hosts and
  Cloudflare rules remain unchanged.

## Live compatibility projection (read-only)

The captured current Caddy source is:
`cdcdd5df01ba9414617179ab56b6114d462ea92c9e8c2ef162b608d066e3fa3e`.
Adding only the reviewed fragment inside public/www produces:
`076617814a222a5996334dad94fc8fcca8b753f77606b8fab006ec2a5e91fd49`.

The installed helper is unchanged:
`92e79d80e93fbaefc615946aea6fbdd591b6e4574927e3bf067edaf9afda7bbf`.
The only approved profile field change is:

```diff
- route_template_sha256: b20c4026f31f44c1ad8253ac6bfbeff718f76e50a2e12396ab4a52e978704600
+ route_template_sha256: 547190c7e38a717d7ccceb77458e671819ef1f02b2c03e9fc4c0a6cf19674e95
```

Canonical config hashes before/after:
`45cb563f274aad653836b6e14d62233880bd84e9f36000f2aa8681f4150bbb45` →
`97846b604c943b9ab4bd8ede09ed5b1e6e29ddc582bb5eb31c040db6c78eac6f`.

The real Caddy container validated/adapted the proposed source and existing
fail-closed fallback without reload. Masking only exact apex/www host routes in
both native JSON documents leaves identical configurations. The added error route
is explicitly host-matched. A future image deployment still changes exactly one
upstream in native JSON. The old profile correctly rejects the proposed template;
its guard must not be bypassed or replaced with a broad acceptance rule.

Read-only checks passed: active/source equality, root-only profile/import settings,
read-only single-file Caddy mount, no pending release, direct-origin IPv4/IPv6 and
forged-header403, API/admin/infra200. clients.saitena.com remains its documented
pre-existing502; it is not classified as healthy or changed by this release.

## One grouped owner authorization, plus the existing Environment gate

The exact package under ignored `qa-output/combined-headers-cls/APPROVAL.md` contains
the final combined commit/CI, addition-only Caddy diff, profile hashes and reviewed
admin controller hashes. No production Caddy/profile modification or main merge
is authorized merely by preparing these files.

After the owner's grouped authorization:

1. Repeat exact PR/head/CI/main, server/source/profile/mount and guard checks.
2. Merge the combined PR normally with its expected head SHA. No protection bypass,
   direct main push, new pipeline, or separate intermediate PR #4 deployment.
3. Wait for main CI, authorization and immutable private image build. Stop before
   production changes if any gate fails. Display the real merge SHA/image digest.
4. Through existing administrative SSH, acquire deployment/mutation locks and make
   a fresh root0700 bundle with root0600 source, active JSON, autosave, external
   import, mounts/source metadata, exact old/new profiles and approval receipt.
   Keep all backup contents on the server; never export the origin token.
5. Apply the exact public/www Caddy candidate and the one-field profile update
   using the prepared paired transaction. Caddy source uses the same bind-mounted
   inode; profile replacement is atomic and root-only. The installed helper is
   neither upgraded nor granted any broader capability.
6. A pending migration journal blocks normal helper deployments. Arm the existing
   helper recovery/watchdog logic before mutation; require readiness. Validate and
   reload, then independently verify edge headers/redirects/privacy, unchanged old
   content, protected services and origin refusal. Accept the Caddy transaction only
   after those checks. Its240s watchdog covers this phase, not an arbitrary wait
   for the later GitHub approval.
7. The owner personally approves the displayed candidate in GitHub's production
   Environment. The agent does not approve it for the owner. Existing Actions then
   runs OIDC/private pull/staging/backup/one-upstream switch/external acceptance.
8. Verify exact runtime digest/revision, HTML/assets/image CSP, security headers,
   CSP reports and JavaScript, noindex/no-store, origin guards and other services.
   Repeat comparable mobile/desktop Lighthouse and inspect footer shift attribution.

The admin-only `.deployment/header_profile.py` is a narrow wrapper around the
unchanged helper Runtime, not another deployment endpoint. It refuses unknown
profile/source bytes, preserves the Caddy inode/native allowlist, writes the
matching profile only after a successful reload, and restores exact old profile
bytes when recovery restores old Caddy. It is not installed by the Actions workflow.

## Rollback and interruption

Before Caddy mutation, failed CI/build/baseline validation leaves production intact.
During Caddy/profile mutation, the prepared controller uses the existing guarded
recovery and detached watchdog with a root-only durable journal. Mixed profiles
are refused by the helper and a pending migration blocks any release. Unknown
operator edits are not overwritten; only a prevalidated known-active403 fallback
may be loaded, with manual repair required. The existing emergency fallback keeps
its original403/privacy behavior; it does not serve an application page.

If Actions or subsequent required runtime acceptance fails after the app switch,
first use the existing restricted rollback to restore the previous frontend under
the new header baseline. Then the paired admin recovery restores the original
Caddy/profile pair from the same root bundle. If the app has not been rolled back
to a known source, the admin controller refuses a blind compound restore. Preserve
all containers/backups. Do not retry automatically or alter an unknown active config.
HSTS may persist in an already visiting browser for at most its300s initial lifetime.

Isolated tests use real Caddy to exercise profile activation→restore→reactivation,
old-profile refusal, exact native upstream diffs, unknown profile/source refusal,
normal acceptance, failed acceptance, timeout, failed restoration403 and concurrent
source preservation. Production receipt/readiness/native and external tests must
still pass; fixture results are not claimed as a production release.

After a successful accepted release, stop frontend technical optimizations. The
next deliverable is a read-only architecture review of public auth, Laravel
Sanctum sessions, portal profiles, roles/admin/MFA boundaries and local isolation;
no auth feature or account/database change is enabled as part of this release.
