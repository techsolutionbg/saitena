# Controlled production CI/CD — activation guide

## Current state

Implementation only, in Draft PR #1 / codex/first-production-candidate. No merge, production deployment, secret change, server installation, reviewer/ruleset or environment modification has been performed. Missing SAITENA_PRODUCTION_ENABLED is intentionally false. A skipped disabled workflow is NOT a successful release. No server key exists in this change.

CI runs on PRs and pushes to main. Production is a separate manual-dispatch workflow from main; it accepts only a published stable `vX.Y.Z` GitHub Release. It resolves the tag to a full SHA, checks ancestry on origin/main, obtains CI from the GitHub API for THAT SHA on push/main, and requires completed success for the verify job and every step. PR/dispatch CI, missing checks, failures, cancelled/skipped steps are rejected. It also requires an existing protected production environment, independent required reviewers and protected-branch deployment policy. No PR artifact is downloaded with production credentials.

The build checks out the authorized SHA, runs the existing rights/legal/integrity release gate, builds the release Docker target with OCI revision label, publishes to `ghcr.io/techsolutionbg/saitena/public`, and passes the registry `@sha256` digest to deployment. Tags contain SHA but are not used as the deployment identity. GITHUB_TOKEN has packages:write only in the build job. If review/gate/CI/build fails, the SSH job cannot run. Runtime SMTP settings are validated on the server BEFORE image pull/staging; missing values prevent deployment. No server-side build or checkout is performed.

Deployment uses environment production and workflow concurrency `saitena-production`, cancel-in-progress:false. The root helper also uses nonblocking flock, so manual and CI deployments serialize. A second deployment is refused rather than interrupting the first. An unfinished journal blocks later releases pending recovery.

## Explicit approvals required before activation

1. Review and approve this PR, including helper/tests. No auto-merge. Resolve legal/contact/rights data and approved SMTP configuration separately; do not fake approvals to obtain a release image.
2. In GitHub main protection or equivalent ruleset: require PR with >=1 independent approval; dismiss stale approvals; require `verify` from Saitena checks; require branch up-to-date; forbid deletion and force pushes; apply rules to administrators and remove bypass actors. Do not mark skipped jobs as accepted checks. Protect v* release tags from unauthorized creation, mutation and deletion. We do NOT configure these rules without approval. Private repository plan support must be confirmed.
3. Create environment production with required independent reviewers, prevent self-review, no admin bypass where supported, deployment branch policy protected branches only and main protected. If the plan cannot enforce review, this workflow stays disabled; do not silently remove the gate.
4. Approve the fixed helper config, exact public Caddy block and root-owned paths. Current live file does not contain helper markers, so initial bootstrap is a separate reviewed Caddy change. Enclose ONLY the saitena.com/www public block with `# BEGIN SAITENA PUBLIC` and `# END SAITENA PUBLIC`. Preserve API/admin/infra/clients/PHP2 blocks exactly. Capture full original file, live admin JSON, hashes, mounts and old image IDs first. Initial public activation must already have a reviewed rollback snapshot/health baseline.
5. Existing manual infra scripts use the personal codexadmin identity plus privileged infrastructure-specific helpers. They are NOT suitable for an unattended website-only GitHub key. Retain Docker/Caddy infrastructure, but install the new restricted entry point only after approval. A self-hosted runner with a Docker socket would be root-equivalent and must never process untrusted PRs. No runner/agent/service is installed by this PR.

## Restricted identity and network

Owner provisions dedicated saitena-deploy SSH identity (no password, no Docker group, no general sudo, no interactive shell access through its key). Use an authorized_keys entry shaped:

```text
restrict,command="sudo -n /usr/local/libexec/saitena-deploy" ssh-ed25519 OWNER_PROVISIONED_PUBLIC_KEY
```

The forced entry point runs the reviewed Python helper with NO client-controlled command arguments. It ignores SSH_ORIGINAL_COMMAND and reads <=8192 bytes JSON from stdin. Do not use shell eval. Install the reviewed file as a root-owned, non-writable executable; the absolute `#!/usr/bin/python3` shebang is included and requires an approved Python installation. Permit sudo ONLY for this exact executable with empty args, e.g. `saitena-deploy ALL=(root) NOPASSWD: /usr/local/libexec/saitena-deploy ""`. Validate sudoers with visudo, inspect parent-directory ownership, and test the forced command denies shell/port forwarding/arbitrary commands. These are proposed installation instructions, not actions performed.

Root-owned `/etc/saitena-deploy/config.json` uses deploy-config.example.json with enabled:false until final approval. Root-only state dir mode0700 and SMTP env mode0600; config and helper must not be writable by the deploy user. Existing live Caddy mount path must be read again rather than guessed. Docker host registry credentials are read-only GHCR package access stored in root's approved credential store, NOT sent from PRs. GITHUB_TOKEN builds/pushes images; it is not the server's long-term registry password.

GitHub-hosted runners need an explicitly approved reachable SSH endpoint. Existing audited central alias is a Tailscale address; it is not automatically reachable from hosted runners. Approve either a scoped network path or a dedicated protected deployment runner/agent; do not open firewall/tunnel or install anything automatically. Configure SAITENA_DEPLOY_HOST only after this is resolved.

After separate approval, production environment secrets: SAITENA_DEPLOY_KEY (dedicated restricted key), SAITENA_DEPLOY_KNOWN_HOSTS (host key verified out-of-band). Environment variable SAITENA_DEPLOY_HOST. Never run ssh-keyscan as an automatic trust decision. Private key and known_hosts are temporary0600 runner files removed by trap. No secrets in artifacts or shell tracing. No personal/root SSH key in Actions. Finally, separately approve repository variable SAITENA_PRODUCTION_ENABLED=true; until then nothing reaches the server.

## First release and deployment behavior

Create a stable published release tag on reviewed main only after required checks pass. Dispatch production.yml from main with that tag. Review the Git SHA/image in the environment approval; verify exact workflow/build revision before approving. Production workflow is never executed from PR ref. Later a release/workflow_run trigger may be added after first accepted deployment, using the SAME authorization gate, environment review and concurrency. A merge to main alone currently runs checks, not deployment.

Helper accepts only stable release ID, SHA40, and a digest from the fixed GHCR repository. It verifies the image OCI revision before startup. It starts a new named container on the existing edge network without publishing host ports; unprivileged uid1000, no capabilities/new privileges, PID/memory/CPU and bounded-log limits. Old containers remain running. Candidate health, routes, release assets and rejected bad-origin contact request are tested inside it; no real email/registration is submitted. Existing protected API/admin/infra/clients URLs must pass before and after switch.

Journal is fsync'd BEFORE switch, with old full Caddy bytes, SHA/digest, candidate config hash, baseline page hash and phase. Only the marked public block is replaced. File writes preserve the bind-mounted inode; validate and reload only Caddy. Public health JSON, page identity hash and protected services must pass. A failure after switch restores original full file and verifies the prior page hash and protected services; deployment still exits failed. Previous images/containers are retained, no migrations or global cleanup exists.

Full-page hash matching is intentionally conservative. Before activation check that the public page is deterministic, Caddy/Cloudflare bypass stale cached release responses and no request-specific content changes the baseline. If not, design an explicitly reviewed release identity probe; never reduce it to HTTP200. Default certificate verification remains enabled for public/protected requests. Health checks may refuse a healthy release if Cloudflare serves a challenge; that is a safe failure requiring investigation.

## Failure and manual recovery

Journal phases: staging, switching, complete, failed_before_switch, rolled_back, manual_recovery_required. SIGTERM/SIGINT/SIGHUP raise a controlled failure and try rollback once switching began. SIGKILL/power loss cannot be caught; the durable unfinished journal blocks subsequent deploys. Keep original bytes and never prune resources automatically.

Root operator after separate incident approval can run:

```sh
sudo /usr/local/libexec/saitena-deploy recover vX.Y.Z
```

The deploy SSH user is NOT granted this arbitrary-args command. Recovery is idempotent only if current config equals captured old or this release's candidate hash. If later/unrecognized routing exists, helper refuses to overwrite it. Root must review live JSON, snapshot/journal and intervening changes. If automatic reload fails, stop releases, preserve logs/journal, restore approved bytes to the actual bind-mounted file, validate/reload manually and check previous site + protected services. Never restore a database or roll back migrations. Future DB changes need a separate compatibility and approval policy.

## Test evidence and limits

Node policy tests inject failed/skipped/cancelled/missing CI, PR event, wrong SHA, draft release and missing review protection; none authorize deployment. Python tests exercise startup failure, post-switch rollback, rollback failure, repeated recovery, stale routing, strict identity and flock. The CI real-Docker staging test builds original owned fixtures through a successful release gate, starts actual old/new containers and Caddy, injects failure AFTER real routing change and reload failure, and checks repeated manual recovery and the old container still running. Its only stub is registry authentication/pull: local image IDs map to strict digest-shaped fixture requests. Real GHCR permissions/pull and SSH/network transport remain activation acceptance tests with no production credentials used here.

Actual site's release build is still intentionally BLOCKED by pending owner rights/legal approval. A successful fixture build is not approval of the site's unresolved content. No production environment/secrets/rulesets are created, no production job has been run. CI logs/artifacts use only fixtures; root server journals can contain protected config snapshots and must remain root-only. Docker bounded logs are kept for diagnosis, never uploaded wholesale with runtime settings.

Initial integration run: https://github.com/techsolutionbg/saitena/actions/runs/43717371402 succeeded: 21 Node tests, 7 Python tests and real Docker/Caddy good/post-failure/rollback-failure scenarios. Intentionally failed CI rehearsal: https://github.com/techsolutionbg/saitena/actions/runs/43717660865 failed at the planned test; only the checks workflow ran for that commit. The temporary failing test was removed in the final follow-up commit. This was a private PR experiment, not a production workflow invocation. Production environment read returned404 and no repository enablement flag was present; no configuration was created to bypass that condition.

`docs/release-approval.json` adds explicit pending owner approval for company data, legal copy, contact details and deployment plan. All remain false. The first-release Docker target additionally rejects auth/indexing enabled or unexpected frontend/API origins. CI fixture approvals are generated only inside the original local fixture tree; the real site's approvals are never overwritten by tests.

Read-only main-protection API inspection returned403: GitHub requires an eligible paid plan or public visibility for this feature. We will NOT change visibility; this is an activation blocker in the existing PRIVATE repository. Production environment API returned404 (not configured or not visible to current credentials). No secret/settings changes were made. The authorization script now verifies ACTUAL classic main protection, not only its documentation. If effective rulesets are chosen instead, extend/test that verification before activation rather than removing it. Where the default token cannot read these settings, an owner-approved SAITENA_RELEASE_POLICY_TOKEN may supply read-only repository policy/actions/environment metadata access; it must have no server or repository write authority. No such token is created here. Private-repository environment reviewer support must also be confirmed independently; a branch-protection plan upgrade alone may not supply that feature.
