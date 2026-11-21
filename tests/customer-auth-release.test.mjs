import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { customerAuthReleaseBlockers } from "../scripts/customer-auth-release.mjs";
import { assertReleasePolicy } from "../scripts/release-policy.mjs";
import { deploymentProfile } from "../scripts/deployment-profile.mjs";

const env = {
  NEXT_PUBLIC_RELEASE_MODE: "customer-auth",
  NEXT_PUBLIC_AUTH_ENABLED: "true",
  NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED: "true",
  NEXT_PUBLIC_CUSTOMER_REGISTRATION_ENABLED: "true",
  NEXT_PUBLIC_INDEXING_ENABLED: "false",
  NEXT_PUBLIC_API_URL: "https://api.saitena.com",
  NEXT_PUBLIC_CLIENT_AREA_URL: "https://portal.saitena.com",
  CONTACT_MAIL_MODE: "disabled",
};
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "saitena-auth-release-"));
  mkdirSync(join(root, "docs"));
  mkdirSync(join(root, "public"));
  mkdirSync(join(root, "src/components/pages"), { recursive: true });
  writeFileSync(join(root, "public/asset.svg"), "owner-approved-asset");
  const sha256 = createHash("sha256")
    .update("owner-approved-asset")
    .digest("hex");
  const assets = [
    {
      path: "public/asset.svg",
      sha256,
      publicationRights: "approved-public-demo",
    },
  ];
  for (const name of ["public-demo-assets", "binary-review-manifest"])
    writeFileSync(join(root, `docs/${name}.json`), JSON.stringify(assets));
  writeFileSync(
    join(root, "docs/public-demo-approval.json"),
    JSON.stringify({
      owner: "techsolutionbg",
      public_demo_approved: true,
      content_public_display_approved: true,
      assets_public_display_rights_approved: true,
      cloudflare_only_origin_plan_approved: true,
      deployment_plan_approved: true,
      approved_assets: assets,
    }),
  );
  // Exercise each schema independently of the real owner's current approval.
  // Promoting a new policy must not silently redefine the legacy fixture.
  const approval = {
    schema: 1,
    owner: "techsolutionbg",
    mode: "customer-auth",
    ...Object.fromEntries(
      [
        "registration_enabled",
        "login_only_approved",
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
      ].map((key) => [key, true]),
    ),
    ...Object.fromEntries(
      [
        "api_manifest_sha256",
        "portal_manifest_sha256",
        "staging_evidence_sha256",
      ].map((key) => [key, "a".repeat(64)]),
    ),
  };
  const save = () =>
    writeFileSync(
      join(root, "docs/customer-auth-release-approval.json"),
      JSON.stringify(approval),
    );
  save();
  writeFileSync(
    join(root, "src/components/pages/pages.tsx"),
    "Approved legal content",
  );
  return {
    root,
    approval,
    save,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

test("prelaunch requires fresh exact owner scope without falsely approving legal documents", () => {
  const f = fixture();
  try {
    Object.assign(f.approval, {
      schema: 2,
      prelaunch_only_approved: true,
      integration_evidence_approved: true,
      integration_evidence_sha256: "b".repeat(64),
      tester_policy_sha256: "c".repeat(64),
      legal_copy_approved: false,
      consent_policy_approved: false,
      enrollment: "explicit-private-email-allowlist",
      acceptance_mode: "permanent-enrolled-testers",
    });
    f.save();
    writeFileSync(
      join(f.root, "src/components/pages/pages.tsx"),
      "СТРУКТУРЕН МАКЕТ",
    );
    const build = { ...env, NEXT_PUBLIC_CUSTOMER_PRELAUNCH_ENABLED: "true" };
    assert.deepEqual(customerAuthReleaseBlockers(f.root, build), []);
    for (const key of [
      "prelaunch_only_approved",
      "integration_evidence_approved",
    ]) {
      f.approval[key] = false;
      f.save();
      assert(
        customerAuthReleaseBlockers(f.root, build).some((x) => x.includes(key)),
      );
      f.approval[key] = true;
      f.save();
    }
    f.approval.production_auth_approved = false;
    f.save();
    assert(
      customerAuthReleaseBlockers(f.root, build).some((x) =>
        x.includes("production_auth_approved"),
      ),
    );
    f.approval.production_auth_approved = true;
    f.approval.enrollment = "public";
    f.save();
    assert(customerAuthReleaseBlockers(f.root, build).length);
  } finally {
    f.cleanup();
  }
});
test("all valid emails require a new explicit scope and matching permanent preview record", () => {
  const f = fixture();
  try {
    Object.assign(f.approval, {
      schema: 2,
      prelaunch_only_approved: true,
      integration_evidence_approved: true,
      integration_evidence_sha256: "b".repeat(64),
      tester_policy_sha256: "c".repeat(64),
      legal_copy_approved: false,
      consent_policy_approved: false,
      registration_scope: "all-valid-emails",
      enrollment: "any-valid-email",
      acceptance_mode: "permanent-preview",
    });
    const build = { ...env, NEXT_PUBLIC_CUSTOMER_PRELAUNCH_ENABLED: "true" };
    f.save();
    assert.deepEqual(customerAuthReleaseBlockers(f.root, build), []);
    for (const scope of [undefined, null, "", "*", "public", "enrolled"]) {
      f.approval.registration_scope = scope;
      f.save();
      assert(customerAuthReleaseBlockers(f.root, build).length);
    }
    f.approval.registration_scope = "all-valid-emails";
    for (const key of ["enrollment", "acceptance_mode"]) {
      const before = f.approval[key];
      f.approval[key] = "explicit-private-email-allowlist";
      f.save();
      assert(customerAuthReleaseBlockers(f.root, build).length);
      f.approval[key] = before;
    }
    f.approval.legal_copy_approved = true;
    f.save();
    assert(customerAuthReleaseBlockers(f.root, build).length);
  } finally {
    f.cleanup();
  }
});

test("customer Auth fails closed with a pending owner record", () => {
  const f = fixture();
  try {
    f.approval.production_auth_approved = false;
    f.save();
    writeFileSync(
      join(f.root, "src/components/pages/pages.tsx"),
      "СТРУКТУРЕН МАКЕТ",
    );
    const blockers = customerAuthReleaseBlockers(f.root, env);
    assert(blockers.some((x) => x.includes("production_auth_approved")));
    assert(blockers.some((x) => x.includes("legal documents")));
  } finally {
    f.cleanup();
  }
});
test("customer Auth retains asset, legal, SMTP, exact-evidence and noindex gates", () => {
  const f = fixture();
  try {
    assert.deepEqual(customerAuthReleaseBlockers(f.root, env), []);
    for (const key of Object.keys(f.approval).filter(
      (k) => typeof f.approval[k] === "boolean" && k !== "login_only_approved",
    )) {
      f.approval[key] = false;
      f.save();
      assert(
        customerAuthReleaseBlockers(f.root, env).some((x) => x.includes(key)),
      );
      f.approval[key] = true;
    }
    f.save();
    for (const [key, value] of Object.entries({
      NEXT_PUBLIC_INDEXING_ENABLED: "true",
      NEXT_PUBLIC_API_URL: "https://legacy.invalid",
      CONTACT_MAIL_MODE: "smtp",
      NEXT_PUBLIC_AUTH_ENABLED: "false",
    }))
      assert(
        customerAuthReleaseBlockers(f.root, { ...env, [key]: value }).length,
      );
    writeFileSync(join(f.root, "public/asset.svg"), "modified");
    assert(
      customerAuthReleaseBlockers(f.root, env).some((x) =>
        x.includes("Changed asset"),
      ),
    );
  } finally {
    f.cleanup();
  }
});
test("login-only Auth retains every common gate and never activates registration or draft legal routes", () => {
  const f = fixture();
  try {
    f.approval.registration_enabled = false;
    f.approval.legal_copy_approved = false;
    f.approval.consent_policy_approved = false;
    f.save();
    writeFileSync(
      join(f.root, "src/components/pages/pages.tsx"),
      "СТРУКТУРЕН МАКЕТ",
    );
    const login = {
      ...env,
      NEXT_PUBLIC_CUSTOMER_REGISTRATION_ENABLED: "false",
    };
    assert.deepEqual(customerAuthReleaseBlockers(f.root, login), []);
    f.approval.login_only_approved = false;
    f.save();
    assert(
      customerAuthReleaseBlockers(f.root, login).some((x) =>
        x.includes("login_only_approved"),
      ),
    );
    f.approval.login_only_approved = true;
    f.save();
    assert(
      customerAuthReleaseBlockers(f.root, env).some((x) =>
        x.includes("registration_enabled"),
      ),
    );
    f.approval.registration_enabled = true;
    f.save();
    assert(
      customerAuthReleaseBlockers(f.root, env).some((x) =>
        x.includes("legal_copy_approved"),
      ),
    );
  } finally {
    f.cleanup();
  }
});
test("existing automatic release policy still rejects unapproved Auth mode", () => {
  assert.throws(
    () =>
      assertReleasePolicy({
        releaseMode: "customer-auth",
        modeConfirmation: "customer-auth",
      }),
    /release mode/,
  );
});

test("public-demo profile cannot activate Auth and an Auth profile needs explicit login-only approval", () => {
  const f = fixture();
  try {
    writeFileSync(
      join(f.root, "docs/deployment-profile.json"),
      JSON.stringify({ mode: "public-demo" }),
    );
    assert.deepEqual(deploymentProfile(f.root), {
      mode: "public-demo",
      authApprovalOnly: false,
      prelaunch: false,
    });
    writeFileSync(
      join(f.root, "docs/deployment-profile.json"),
      JSON.stringify({ mode: "customer-auth" }),
    );
    f.approval.registration_enabled = false;
    f.approval.login_only_approved = false;
    f.save();
    assert.throws(() => deploymentProfile(f.root), /login_only_approved/);
    f.approval.login_only_approved = true;
    f.save();
    assert.deepEqual(deploymentProfile(f.root), {
      mode: "customer-auth",
      authApprovalOnly: true,
      prelaunch: false,
    });
  } finally {
    f.cleanup();
  }
});
