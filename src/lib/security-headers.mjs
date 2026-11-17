/** Diagnostic policy: inline Next streaming/bootstrap scripts still need review. */
export const reportOnlyCsp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self'",
  "script-src-attr 'none'",
  "style-src 'self'",
  "style-src-attr 'none'",
  "img-src 'self' data: https://tile.openstreetmap.org",
  "font-src 'self'",
  "connect-src 'self' https://api.saitena.com",
  "frame-src 'none'",
  "worker-src 'none'",
  "media-src 'none'",
  "manifest-src 'self'",
  "form-action 'self'",
].join("; ");

/** @param {boolean} production */
export function publicSecurityHeaders(production) {
  return [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    ...(production
      ? [
          // Short first rollout, applying only to the responding host.
          { key: "Strict-Transport-Security", value: "max-age=300" },
          { key: "Content-Security-Policy-Report-Only", value: reportOnlyCsp },
        ]
      : []),
  ];
}
