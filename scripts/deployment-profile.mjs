import { readFileSync } from "node:fs";
import { join } from "node:path";
import { customerAuthReleaseBlockers } from "./customer-auth-release.mjs";
export function deploymentProfile(root = process.cwd()) {
  const profile = JSON.parse(
    readFileSync(join(root, "docs/deployment-profile.json"), "utf8"),
  );
  if (!["public-demo", "customer-auth"].includes(profile.mode))
    throw Error("Unsupported deployment profile");
  if (profile.mode === "customer-auth") {
    const blockers = customerAuthReleaseBlockers(root, {
      NEXT_PUBLIC_RELEASE_MODE: "customer-auth",
      NEXT_PUBLIC_AUTH_ENABLED: "true",
      NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED: "true",
      NEXT_PUBLIC_CUSTOMER_REGISTRATION_ENABLED: "false",
      NEXT_PUBLIC_INDEXING_ENABLED: "false",
      NEXT_PUBLIC_API_URL: "https://api.saitena.com",
      NEXT_PUBLIC_CLIENT_AREA_URL: "https://portal.saitena.com",
      CONTACT_MAIL_MODE: "disabled",
    });
    if (blockers.length)
      throw Error(
        "Coordinated Auth profile is not approved: " + blockers.join("; "),
      );
  }
  return {
    mode: profile.mode,
    authApprovalOnly: profile.mode === "customer-auth",
  };
}
