# Private Preview: combined transport, bootstrap and release

This is the current C–E preparation, continuing Draft PR #1. Cloudflare host-scoped access rules and the public/www Caddy guard have been accepted separately. They protect the existing page; the new Next.js site has not been released. Live evidence and exact host/IP-specific changes remain in the ignored owner review package, not this public repository.

## Code prepared for review

The release helper imports `/config/caddy/saitena-preview-key.caddy` inside the immediate-peer/home-address matcher. Inline `origin_token` is rejected. The helper neither reads the secret contents nor places them in a request, Caddyfile, journal, CI log or artifact. Root-only host-file metadata is checked at activation. Validation runs inside the existing Caddy container, resolving the real import, before writing the single-file bind mount. Writes preserve the mounted inode; no container restart is required.

Only the separately bootstrapped `BEGIN/END SAITENA PUBLIC` block changes. Everything outside it must remain identical. The public/www guard strips the header before proxying or denying; the loopback health probe has no published Docker port. Private Preview retains disabled auth, disabled mail, legal-route 404, approved replacement assets, noindex and no-store.

Registry pulls use only `/etc/saitena-deploy/registry`, with a root-owned 0700 directory and regular 0600 credential file. Symlinks and broad permissions are refused. The registry call is deliberately a fixture boundary in local tests; those tests do not establish GHCR authorization. The publish job uses `GITHUB_TOKEN` with `packages:write` only there and refuses deployment unless the resulting package metadata reports Private visibility. It passes an immutable digest and checks image revision/release-mode labels.

The proposed SSH files are `.deployment/restricted-shell`, `sshd-match.conf` and `sudoers`. They allow one root-owned helper without arguments, no interactive shell, forwarding, TTY, Docker group or general sudo. They are not installed by CI or this PR. The account must initially point to the deny-only gate while transport tests run; installing a key alone is unsafe. Full sshd/sudoers candidates must validate, with unchanged effective owner/root settings, before any approved reload.

## Network and GitHub gates

The production job joins Tailscale through pinned OIDC action code after production Environment approval. The existing main/release/owner/CI/content gates remain. No ordinary dev push deploys anything. Repository enablement flags and server `enabled` remain false until separately approved activation.

The current tailnet wildcard source must be narrowed before enrolling any CI node: grants are additive, so a new narrow grant alone cannot isolate CI. The exact owner-reviewed proposal retains current user-owned device access and permits the CI tag only to the deployment server's TCP22. Do not retag existing machines or enable Tailscale SSH. The immutable GitHub OIDC subject, repository/owner IDs, main ref, exact workflow, event, actor and Environment must match the federated identity; no long-lived reusable auth key is needed.

`deployment-connectivity.yml` is a separate manual main/owner-approved, keyless check in `deployment-connectivity`. It compares an independently verified SSH host pin, expects unauthenticated SSH rejection and tests forbidden ports. It has no deploy key, registry permission or Docker/release step. Do not put the production SSH secret in that Environment or relax the protected-main rule to test early.

GHCR package permissions are independent of Git visibility. First creation uses the normal approved release build, not a dummy image or bypass workflow. Keep the package Private, explicitly authorize repository Actions publication, and provide a dedicated reader identity with Read on only this package and a short-lived classic PAT scoped `read:packages`. Do not substitute an owner PAT with access to all packages. The owner supplies credentials through protected stdin/server entry; credentials are not requested in chat. If policy APIs reject the default workflow token, a selected-repository fine-grained read-only policy credential is required; do not weaken authorization checks.

## Bootstrap and health prerequisite

The accepted guard currently serves the old under-construction page and has no helper markers or loopback listener. Separately approved bootstrap creates a small isolated baseline container using the already-installed pinned Caddy image, serving a read-only mount of the same static directory. Its HTML hash must match the live old page. It has no host ports, app/API credentials or Docker socket. The full candidate and fail-closed fallback are validated before any reload; non-public bytes and active JSON projections must remain identical.

Protected-service probes use the established browser-compatible health User-Agent, verified TLS and mandatory HTTP200. **The pre-existing `clients.saitena.com` HTTP502 is a failed prerequisite, never an accepted baseline.** The first deployment remains blocked until the owner restores that separate service through its normal maintenance process and these checks pass. Do not remove the URL, accept 502, or repair/restart PHP2 as part of this deployment. Read-only evidence can be gathered separately with owner authorization.

## Recovery and ordered activation

1. Approve the exact reviewed network/SSH/GitHub/registry provisioning bundle, retaining the owner management session and snapshots. Verify source hashes and stop on drift.
2. Install the denied-by-default transport and run negative shell/forwarding/auth tests, approved OIDC policy/compiler tests and keyless Actions connectivity checks. Do not yet enable real deployment.
3. Restore all protected-service HTTP200 prerequisites. Review and approve guarded baseline bootstrap; verify old-page identity, home access, outside/direct IPv4/IPv6 denial and all non-public services.
4. Complete PR review, green CI and separately approved merge. Require new successful **push/main CI for the exact release SHA**. Only then obtain final owner launch approval, record preview approvals, publish the stable release and enable only the preview flag/server mode. Any changed approval commit needs its own CI and release SHA.
5. The normal workflow builds/publishes the private image; the owner approves the Environment job for the recorded SHA/digest. Run restricted deployment and independent home/outside/origin acceptance tests. No success is claimed from fixture checks.

The durable root-only journal is written before switching. Failed post-switch checks restore the guarded baseline and verify page identity plus protected services. If restoration fails, a prevalidated public/www-only HTTP403 fallback is attempted; future deploys stay blocked. Root recovery recognizes only the captured original, candidate or recorded fallback; unrelated operator changes are never overwritten. Keep previous containers/images and do not delete volumes. A fail-closed state requires owner recovery before another release.

For transport rollback, revoke the new key and restore only the approved account/Match/sudoers changes after validation. Revoke new OIDC identities and detach their CI nodes **before** restoring the old broad tailnet policy. Revoke only the new registry credential; leave global Docker credentials and other services untouched.

References: [Tailscale Actions/OIDC](https://tailscale.com/docs/integrations/github/github-action), [GHCR authentication](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry), [Caddy validation](https://caddyserver.com/docs/command-line).
