import { readFileSync } from "node:fs";
import { join } from "node:path";
import { releaseBlockers } from "./release-readiness.mjs";

/** Auth is a distinct, opt-in release; a public-demo approval cannot enable it. */
export function customerAuthReleaseBlockers(
  root = process.cwd(),
  env = process.env,
) {
  const blockers = releaseBlockers(root, "public-demo");
  let approval;
  try {
    approval = JSON.parse(
      readFileSync(
        join(root, "docs/customer-auth-release-approval.json"),
        "utf8",
      ),
    );
  } catch {
    return [...blockers, "Customer Auth owner approval record missing"];
  }
  if (
    approval.owner !== "techsolutionbg" ||
    approval.mode !== "customer-auth" ||
    approval.schema !== 1
  )
    blockers.push("Customer Auth approval identity/schema mismatch");
  for (const key of [
    "production_auth_approved",
    "api_candidate_approved",
    "portal_candidate_approved",
    "legal_copy_approved",
    "consent_policy_approved",
    "smtp_sender_approved",
    "https_staging_approved",
    "migration_backup_rollback_approved",
    "customer_cookie_boundary_approved",
    "origin_guard_plan_approved",
    "deployment_helper_approved",
  ])
    if (approval[key] !== true)
      blockers.push(`Customer Auth approval pending: ${key}`);
  for (const key of [
    "api_manifest_sha256",
    "portal_manifest_sha256",
    "staging_evidence_sha256",
  ])
    if (!/^[a-f0-9]{64}$/.test(approval[key] ?? ""))
      blockers.push(`Customer Auth exact evidence missing: ${key}`);
  const expected = {
    NEXT_PUBLIC_RELEASE_MODE: "customer-auth",
    NEXT_PUBLIC_AUTH_ENABLED: "true",
    NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED: "true",
    NEXT_PUBLIC_INDEXING_ENABLED: "false",
    NEXT_PUBLIC_API_URL: "https://api.saitena.com",
    NEXT_PUBLIC_CLIENT_AREA_URL: "https://portal.saitena.com",
    CONTACT_MAIL_MODE: "disabled",
  };
  for (const [key, value] of Object.entries(expected))
    if (env[key] !== value)
      blockers.push(`Customer Auth release requires ${key}=${value}`);
  if (
    /СТРУКТУРЕН МАКЕТ|предстои потвърждение|не действащ правен документ/u.test(
      readFileSync(join(root, "src/components/pages/pages.tsx"), "utf8"),
    )
  )
    blockers.push("Customer Auth legal documents still contain draft content");
  return blockers;
}

if (process.argv[1]?.endsWith("customer-auth-release.mjs")) {
  const blockers = customerAuthReleaseBlockers();
  if (blockers.length) {
    console.error("CUSTOMER AUTH RELEASE BLOCKED:\n" + blockers.join("\n"));
    process.exitCode = 1;
  }
}
