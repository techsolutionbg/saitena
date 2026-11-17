import { isIP } from "node:net";

/** Generate a disabled, host-scoped rule; this module has no Cloudflare write capability. */
export function previewWaf(ownerIPs) {
  if (!ownerIPs.length || ownerIPs.some((ip) => !isIP(ip)))
    throw new Error("Confirmed exact IPv4/IPv6 addresses are required");
  return {
    description: "Saitena Private Preview — home addresses only",
    action: "block",
    enabled: false,
    expression: `(http.host in {"saitena.com" "www.saitena.com"} and not ip.src in {${ownerIPs.join(" ")}})`,
  };
}

export const previewHostExpression =
  '(http.host in {"saitena.com" "www.saitena.com"})';
