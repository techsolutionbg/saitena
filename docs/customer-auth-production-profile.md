# Dormant customer Auth release profile

Prepared on top of main dad6ffa (merged SEO/no-JS PR6 and exact FAQ transform PR7)
and the original local Auth8b53a91. Public design, images, SEO/no-JS rendering,
noindex and existing origin/deployment protections are preserved.

`customer-auth` is an explicit build profile, distinct from public-demo and private
preview. Both Auth flags must be true and indexing must be false. The candidate
stage can be exercised on isolated `.test` HTTPS hosts; it does not grant publication.
The release stage runs `scripts/customer-auth-release.mjs`, reusing exact approved
asset hashes and requiring separate API, portal, legal/consent, SMTP, staging,
migration/backup, cookie, origin and helper approvals. The pending approval record
is deliberately all false with no invented evidence hashes. Legal drafts still block.

The existing production workflow, release authorization and root-owned deployment
helper remain unchanged and reject this mode. There is no automatic Auth activation
on push/merge, no new pipeline, no removed Environment approval and no modified
Caddy baseline. Extending the existing process to one exact three-component release
receipt requires a separate reviewed implementation/approval after API parity and
portal infrastructure are ready. Readiness hashes must then be matched to the real
component artifacts/staging evidence by that controller; format checks alone are
not production authorization.

`techsolutionbg/saitena` is PUBLIC and contains only the public website. Laravel,
the customer portal and internal operations must remain in a separate private
repository under the existing owner, imported without the parent Git history after
separate publication approval. Neither private source snapshots nor production
comparisons, full-stack fixtures, internal routing or credentials belong here.

Git/Docker exclusions and the existing source audit reject the private platform
paths. The public CI/deployment remains website-only; it must not receive private
repository credentials or API/portal deployment privileges. Backend/portal release
coordination must be reviewed in a private context. No repository is created by
this change, and no production registration, migration or deployment is enabled.
