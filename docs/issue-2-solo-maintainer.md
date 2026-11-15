# Issue #2 — solo-maintainer development and release policy

This is the CURRENT policy and supersedes earlier instructions requiring a second human or describing this repository as Private. Repository visibility was already PUBLIC when Issue #2 was read; no visibility change is performed by this task.

## Development

Use dev as the working integration branch, with feature branches as needed. Pushes to dev and main run checks. PRs targeting dev/main run the same verify job (lint, typecheck, all Node/Python tests, secret scan, production/Docker builds, runtime/HTTPS/Mailpit checks and Docker/Caddy deployment/rollback fixtures). No production job is attached to dev/PR pushes. Keep PR #1 for the directly related CI/policy changes rather than touching production infrastructure. The initial dev ref starts from the tested candidate because current main predates these workflows; this does not publish or merge it. Do not force-reset dev if another writer has created it.

Normal route: work on dev -> checks -> PR into main -> owner inspects diff and green checks -> merge when separately authorized -> successful push/main CI -> published stable release -> owner explicit manual dispatch and environment confirmation. Current task authorizes neither merge nor production activation.

## Enforceable solo protection

Read-only GitHub API confirms main already has strict required verify (GitHub Actions app), PR requirement with required_approving_review_count=0, enforce_admins=true, no force pushes or deletion. No setting changes are needed or made here. Zero required peer approvals is intentional: an author cannot approve their own normal PR review, so demanding another review would deadlock a solo owner. Preserve mandatory checks and PR requirement. Do not translate zero peer reviews into no CI/protection.

Authorization now checks this ACTUAL policy, the exact successful push/main SHA and every CI step. Failed/skipped/cancelled/incomplete or dev/PR runs cannot qualify a release. Environment production still MUST exist with required owner User reviewer techsolutionbg, prevent_self_review=false (explicit solo approval), can_admins_bypass=false and protected-branch deployment policy. This is an owner confirmation, NOT independent review. Do not silently remove environment protection if it is unavailable. No environment/settings/secrets are configured by this change.

Committed .deployment/solo-maintainer.json names the sole allowed release maintainer. Both original and rerun actor must be allowed; the stable published release must be authored by an allowed maintainer. Dispatch from main requires release_tag and an exact repeated confirm_release_tag. The owner reviews exact SHA/digest in the job summary, then approves the protected environment. Existing enablement flag, site readiness, registry digest, restricted SSH helper, baseline and rollback requirements remain unchanged.

Threat model: the same owner reviews code, publishes release and confirms deployment; this does not protect against compromise of that owner's account. Compensate with strong MFA/hardware-backed authentication, protected main, no bypass/force pushes, restricted deployment key, pinned host key, read-only server registry credentials, exact CI/SHA/digest, staged health and rollback. No prod secrets in PR CI, no pull_request_target, no auto-deploy from dev. Repository ownership/maintainer-policy changes require explicit owner review. Technical CI success is not a legal/asset/runtime approval.

## Public-history review

Heuristic scan of current tracked/untracked nonignored files and all available Git patches found no matching private-key/common-token/long-quoted-secret patterns. Git history path review found no .env, common private-key or archive paths. This is NOT proof that all sensitive information is absent. Ignore rules exclude runtime env, keys, logs, archives, generated files and local QA.

Important exposure: screenshot archives and operational/infrastructure metadata from earlier work remain in the now-public Git history even though 153 old binaries are excluded from the current tree. Rights for 24 active assets are still unconfirmed. Do not describe them as protected by private visibility anymore. Owner should review historical screenshots/operational documentation and decide whether any data requires removal or credential rotation. No real secret value is reproduced in this report. No history rewrite, visibility change or mass deletion is authorized/performed. Heuristic scan and earlier contact-sheet review cannot certify absence of hidden binary content.

## Publishing status and precise unblock list

- main and all existing services remain unchanged. Only public Saitena repository workflow/policy/tests/docs are edited.
- Environment production is now configured and verified with required owner approval, self-approval allowed, admin bypass disabled and protected branches only. It contains no credentials or enablement; see [current readiness report](first-production-next-actions.md).
- no production enablement variable or deployment credential names were returned by the read-only repository inspection. Do not create them automatically.
- Keep docs/release-approval.json false until owner supplies/approves company, legal, contact and deployment-plan decisions, plus all asset rights and actual SMTP/runtime settings.
- Need approved least-privilege identity/helper installation, reachable approved SSH path, verified host key and real registry authentication/pull acceptance. These were NOT proven by local registry fixture mapping.
- Need separately approved exact public Caddy bootstrap block and baseline/rollback bundle, plus Cloudflare read-only account audit. No DNS/security or unrelated subdomain/platform changes are allowed.
- Recheck final main push CI after a separately authorized merge. Authorize only its exact stable release SHA, not a successful dev/PR artifact.

The protected production workflow stays manual and disabled. Release gate, staged public-only switch, retained previous containers, protected API/admin/infra/clients checks and journal/recovery are unchanged. See production-cicd-activation.md for implementation/installation detail; its historical independent-review and Private-plan statements are superseded by this document.
