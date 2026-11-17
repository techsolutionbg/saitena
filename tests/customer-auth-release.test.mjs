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

const env = {
  NEXT_PUBLIC_RELEASE_MODE: "customer-auth",
  NEXT_PUBLIC_AUTH_ENABLED: "true",
  NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED: "true",
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
  const approval = JSON.parse(
    readFileSync(
      new URL("../docs/customer-auth-release-approval.json", import.meta.url),
    ),
  );
  for (const key of Object.keys(approval)) {
    if (typeof approval[key] === "boolean") approval[key] = true;
    if (key.endsWith("sha256")) approval[key] = "a".repeat(64);
  }
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
test("customer Auth fails closed with the actual pending owner record", () => {
  const blockers = customerAuthReleaseBlockers(process.cwd(), env);
  assert(blockers.some((x) => x.includes("production_auth_approved")));
  assert(blockers.some((x) => x.includes("legal documents")));
});
test("customer Auth retains asset, legal, SMTP, exact-evidence and noindex gates", () => {
  const f = fixture();
  try {
    assert.deepEqual(customerAuthReleaseBlockers(f.root, env), []);
    for (const key of Object.keys(f.approval).filter(
      (k) => typeof f.approval[k] === "boolean",
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
