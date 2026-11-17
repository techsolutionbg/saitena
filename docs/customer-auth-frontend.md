# Opt-in customer authentication integration

Local implementation only. `NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED=true` switches the
public forms to `/api/v1/customer/auth/*`, host-only Laravel sessions and a JSON
CSRF bootstrap kept in memory. Development refuses production API addresses;
the explicit `.test` exception exists only for the isolated HTTPS fixture.

Login goes to the configured trusted portal dashboard without a token in the URL.
Registration and recovery responses are generic. Existing public Auth pages are
preserved; header login is shown only in the opt-in integration, while unfinished
cart remains hidden. No images/design/performance modules are changed by Auth.

Public-demo and private-preview builds reject the new flag, and the current Docker
release stage explicitly requires it false. Enabling Auth needs a separately
reviewed release profile; neither these source changes nor local production builds
authorize production registration or legal/mail activation. Existing noindex, CSP
Report-Only, image CSP, origin guard and controlled Environment deployment remain.

The parent hosting-platform implementation is documented in
`docs/customer-auth-integration.md` there. It uses the same Laravel users provider,
a customer-only guard/cookie, unchanged staff/MFA boundary and no new Auth service.
The parent local repository currently has no remote; API/portal publication scope
must be agreed before claiming a complete GitHub release candidate.

Local URLs are public127.0.0.1:3010, portal:3011, API:8011 and Mailpit:18029. Existing
3000/3001/8001 services were preserved. Test credentials/data and keys are disposable
and remain under ignored local output, never in this document or Git.
