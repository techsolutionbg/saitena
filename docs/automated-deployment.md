# Owner-approved automatic website updates

This replaces the manual stable-tag trigger in the existing `production.yml`;
it does not add another pipeline. The public site continues in `public-demo`
mode with authentication, email submission, legal pages and indexing disabled.
The UI and approved original assets are unchanged.

The owner requested this process on 16 November 2026:

1. Push development work and use a pull request to protected `main`.
2. Merge only after `verify` passes. No direct main push or automatic PR merge.
3. The push/main CI must pass for that exact merge commit. Its completion starts
   `production.yml` only when `SAITENA_AUTODEPLOY_ENABLED=true`.
4. Authorization verifies the successful complete CI, actual main protection,
   a merged main PR, the current main SHA and production environment protections.
   Stale candidates, fork/PR/dev CI and failed/skipped tests are rejected.
5. Build the existing release Docker target once and publish a private GHCR image.
   Asset/content integrity and rights gates still apply. The image has the exact
   revision label and repository source label. Its immutable digest is displayed
   in the workflow summary before deployment approval.
6. In GitHub Actions open the waiting run, choose **Review deployments**, select
   **production**, then approve. Required reviewer is the owner; self-review is
   allowed for the solo maintainer, administrator bypass is disabled. Rejection
   leaves the current website untouched. GitHub approval is the release approval;
   there is no need to ask Codex to SSH-deploy each update.
7. After approval, recheck current main and policy, join the restricted Tailscale
   network, and call only the root-owned forced-command website helper.
8. Pull by digest using the job's temporary `GITHUB_TOKEN` with `packages:read`.
   It is supplied on encrypted SSH stdin, removed before journaling, used via
   Docker password-stdin in a root-only temporary directory, and then discarded.
   No new registry account or permanent reader PAT is required. Build uses
   `packages:write`; the approved deploy job has only `packages:read`.
9. Back up the complete Caddy source, active JSON, autosave, secret import, mount
   metadata and source inode/permissions into a new root-only release directory.
   These backups contain secrets and must never become GitHub artifacts/logs.
10. Validate the candidate and fail-closed fallback. Start a separate hardened
    website container without host ports, then check pages, original asset hashes,
    static resources, disabled mail/legal routes and health before changing traffic.
11. Arm a detached server watchdog. Replace **only** the existing public/www
    upstream, retaining the source inode, and validate/reload Caddy gracefully.
    The complete normalized source must match the approved template. Native JSON
    must differ by exactly one upstream value; the external origin-secret import,
    Cloudflare peer check, Worker refusal, token stripping and all other vhosts stay.
12. Check public identity/privacy, protected services and direct-origin IPv4/IPv6
    refusal including forged headers. The independent GitHub runner then verifies
    apex/www content, every candidate image/static resource, legal/sitemap refusal
    and robots. It permits only the previously reviewed exact FAQ email-obfuscation
    transformation. It sends a separate acceptance request only on success.
13. Failure sends rollback immediately. Loss/cancellation of the runner leaves a
    240-second server watchdog armed, which restores the previous guarded source.
    The previous container remains available. Failed restoration uses only the
    prevalidated public/www HTTP 403 fallback. Unknown concurrent operator edits
    are not overwritten; the journal records that manual recovery is required.

## One-time activation, not performed by merging code

Existing production environment, host pin, deployment key and restricted SSH
account are already provisioned. No new shell, Docker-group membership, sudoers
rule, account, DNS, Cloudflare rule or Caddy bootstrap is needed.

Before enabling automatic updates the owner must approve the exact prepared
activation package, because earlier provisioning explicitly limited the server
helper to **deny-only**, and the existing OIDC identity to **workflow_dispatch**:

- Replace that deny-only helper with the reviewed helper and fixed root-only
  public-demo config. Capture its previous bytes/permissions first. Do not change
  SSH/sudoers or the active Caddy source. Pin the current normalized Caddy source
  and exact live mount. Install only `CONTACT_MAIL_MODE=disabled` as runtime env.
- Change only the production Tailscale identity's `event_name` claim from
  `workflow_dispatch` to `workflow_run`. Keep immutable repository/owner IDs,
  environment `production`, ref/main, exact `production.yml@main`, owner actor,
  tag, scope and network ACL unchanged. Connectivity identity stays unchanged.
- Confirm the narrowly documented clients HTTP 502 exception for subsequent
  website updates if still present. It may match only that URL/status and is
  reported as a known failure, never as healthy. Without approval, retain strict
  200 checks and leave activation blocked; do not repair PHP2 as part of this work.
- If default `GITHUB_TOKEN` cannot read branch/environment protections, provide
  `SAITENA_RELEASE_POLICY_TOKEN` through GitHub's protected secrets UI. Use a
  selected-repository fine-grained credential with read-only Administration,
  Actions, Contents and Pull requests permissions (read). Environment metadata
  uses Actions read permission. The credential is a repository Actions secret
  because authorization runs before the production environment is entered.
  It must have no repository write, SSH, package-write or server authority. The
  read-only CI capability report identifies this requirement; it is not a gate
  bypass. Authorization still fails closed on inaccessible APIs.
- Confirm GHCR package private visibility and linked repository access. First
  actual registry publish/pull and OIDC exchange require a merged main workflow
  and owner-approved run; local fixtures cannot prove those provider permissions.
- Set repository variable `SAITENA_AUTODEPLOY_ENABLED=true` **last**, only after
  helper/config/OIDC preflight passes. Then merge the reviewed PR through GitHub;
  approve the resulting production job. No merge/deployment is performed merely
  by preparing this change.

`workflow_run` workflows must exist on the default branch. If this change is
merged while activation is off, it safely skips deployment; after activation,
rerun the existing checks workflow's push/main run for the current SHA. A
`workflow_dispatch` checks run is intentionally ineligible. Do not push an empty
main commit or disable branch protection to trigger deployment.

## Recovery and diagnostics

Release identity is `main-<full SHA>`; image is always `repository@sha256:...`.
Journal and backup reside under `/srv/saitena-deploy-state/`, root-only.
No volume/image pruning is performed. The helper serializes releases and blocks
unfinished journals. Failed releases require operator inspection; no blind retry.

An administrator may recover the exact recorded release with:

```sh
sudo /usr/local/libexec/saitena-deploy recover main-FULL_40_CHARACTER_SHA
```

The deployment SSH key cannot invoke this command with arguments or obtain a
shell. Its restricted JSON `rollback` operation is bound to the exact recorded
release/SHA/digest and refuses later/foreign routing changes. To stop future
automation, set the enablement variable false; do not cancel a switching release
or remove origin protections. An already accepted live website remains online.

Tests in CI exercise the policy, token handling, state machine and real isolated
Docker/Caddy failure/recovery cases. Production activation, real GHCR/OIDC and the
first approved automated deployment are distinct acceptance steps; do not report
them as successful merely because CI is green.
