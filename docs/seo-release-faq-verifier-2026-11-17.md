# FAQ verification compatibility before production acceptance

The owner approved PR #6 at `9dd6abd`. It was merged through protected GitHub
as `27ac631736d529602ed71688691c17d392b64f08`; main CI and the release build passed.
No production deployment was started: its Environment job was still waiting for
the owner's personal approval when the final compatibility check found this issue.

## Reproduced failure

The existing strict FAQ verifier recognizes exactly one known Cloudflare email
obfuscation node, its exact decoder script and the old React stream anchor. The
approved rendering change removes that stream anchor. A read-only live capture
confirmed Cloudflare still performs the known email transformation. Replaying
the observed transformation on the locally built non-streamed FAQ is rejected
by the old verifier, even though all origin content is unchanged.

The waiting release run `44043161343` was cancelled before its deploy job started.
The live site, backup state, origin guards and Caddy source were not modified.

## Minimal proposed correction

Recognize the same decoder immediately before either the existing stream anchor
or the exact non-streamed Next document bootstrap. Require exactly one matching
position and retain every existing condition: FAQ route only, one exact known
decoded email, one exact decoder script, and full SHA-256 equality of every
remaining byte with the candidate origin HTML. No generic HTML normalization,
ignored content, status-only acceptance or new Cloudflare exception is added.

Unit tests retain the old stream case, exercise the new document case and reject
changed body/trailing bytes, another route, duplicated/modified scripts and a
misplaced decoder. The existing production-candidate check additionally replays
the transformation on the actual built FAQ HTML, so CI now covers the coupling
between rendering and the deployment verifier.

This patch changes only the GitHub-side verifier and its tests/integration check.
It does not change the application, server helper, backup/watchdog/rollback,
branch/Environment protections, Caddy, noindex, Auth, API, portal or caching.

## Approval boundary

The original owner approval names commit `9dd6abd`; this correction requires
separate approval of its exact PR head before merge. After successful PR CI and
owner approval, use the existing protected merge → main CI → release build →
personal production Environment review → guarded deployment/acceptance process.
Do not approve or rerun the cancelled old candidate as a substitute.
