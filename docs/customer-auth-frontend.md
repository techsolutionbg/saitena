# Customer Auth frontend and coordinated release preparation

Auth remains opt-in. Existing public-demo delivery stays the default and keeps
authentication disabled. A customer-auth release needs a separate exact owner
approval record; the actual record is still pending. No active deployment or
registration is enabled by this change.

The frontend uses credentialed API-host-only sessions and a memory-only JSON CSRF
token. No customer session/CSRF token goes to localStorage or a domain-wide JS cookie.
Registration reads the server's approved document policy and submits the versions
shown alongside explicit acceptance. It cannot supply authoritative document hashes.
Missing/stale/unapproved policy refuses registration. Development refuses production
API URLs; isolated integration uses HTTPS .test hosts and synthetic documents/mail.

First activation is login-only: the registration flag is explicitly false, /register
redirects to /login, legal drafts remain404 and real contact sending/indexing remain
disabled. Enabling registration needs a separate legal/consent approval and matching
frontend/API flags. The site's design, public content, assets and existing origin
protections are retained.

The EXISTING release workflow gains an approval-only customer-auth branch. It still
requires protected public main, an exact successful main CI and the existing personal
production Environment approval. That branch builds only public source and emits
an immutable public image reference with published=false; it does not join Tailscale
or obtain/use the SSH key. Private source/credentials and API/portal privileges stay
outside this public repository. No additional workflow/pipeline/account is created.

Actual coordinated publication then requires a separately reviewed administrative
transaction and manual owner receipt for all components, backup and guarded rollback.
An approval-only workflow job is not evidence of production deployment. The existing
restricted website helper continues to reject customer-auth; normal public-demo
automatic updates retain their current behavior and owner gate.
