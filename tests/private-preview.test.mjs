import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { previewWaf } from "../scripts/preview-waf.mjs";
import { releaseBlockers } from "../scripts/release-readiness.mjs";
import {
  preparePrivatePreview,
  replacePreviewAssetReferences,
} from "../scripts/prepare-private-preview.mjs";

test("WAF draft blocks other IPs on exactly the two public hosts, without a global Allow bypass", () => {
  const rule = previewWaf(["203.0.113.7", "2001:db8::7"]);
  assert.equal(rule.enabled, false);
  assert.equal(rule.action, "block");
  assert.equal(
    rule.expression,
    '(http.host in {"saitena.com" "www.saitena.com"} and not ip.src in {203.0.113.7 2001:db8::7})',
  );
  for (const ips of [
    [],
    ["*"],
    ["0.0.0.0/0"],
    ["1.2.3.4 or true"],
    ["2001:db8::/64"],
  ])
    assert.throws(() => previewWaf(ips));
});

test("preview never grants company/legal public approval or bypasses asset integrity/rights", () => {
  const root = mkdtempSync(join(tmpdir(), "saitena-preview-"));
  try {
    for (const dir of [
      "docs",
      "preview-assets",
      "public",
      "src/components/pages",
    ])
      mkdirSync(join(root, dir), { recursive: true });
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
    const asset = {
      path: "public/preview/art.svg",
      source: "preview-assets/art.svg",
      publicationRights: "approved-private-preview",
      sha256: createHash("sha256").update(svg).digest("hex"),
    };
    const save = () =>
      writeFileSync(
        join(root, "docs/private-preview-assets.json"),
        JSON.stringify([asset]),
      );
    const approval = {
      owner: "techsolutionbg",
      preview_approved: true,
      test_data_approved: true,
      restricted_access_plan_approved: true,
    };
    const approve = () =>
      writeFileSync(
        join(root, "docs/private-preview-approval.json"),
        JSON.stringify(approval),
      );
    approve();
    save();
    writeFileSync(join(root, asset.source), svg);
    writeFileSync(
      join(root, "src/components/pages/pages.tsx"),
      "СТРУКТУРЕН МАКЕТ",
    );
    writeFileSync(join(root, "docs/release-approval.json"), "{}");
    writeFileSync(join(root, "docs/binary-review-manifest.json"), "[]");
    assert.deepEqual(releaseBlockers(root, "private-preview"), []);
    assert.match(releaseBlockers(root).join(), /company_data_approved/);
    assert.match(releaseBlockers(root).join(), /Legal documents/);
    for (const key of [
      "preview_approved",
      "test_data_approved",
      "restricted_access_plan_approved",
    ]) {
      approval[key] = false;
      approve();
      assert.match(
        releaseBlockers(root, "private-preview").join(),
        new RegExp(key),
      );
      approval[key] = true;
    }
    approve();
    asset.publicationRights = "pending-owner-approval";
    save();
    assert.match(
      releaseBlockers(root, "private-preview").join(),
      /Rights pending/,
    );
    asset.publicationRights = "approved";
    save();
    assert.match(
      releaseBlockers(root, "private-preview").join(),
      /Rights pending/,
    );
    asset.publicationRights = "approved-private-preview";
    save();
    writeFileSync(join(root, asset.source), "changed");
    assert.match(
      releaseBlockers(root, "private-preview").join(),
      /Changed asset/,
    );
    writeFileSync(join(root, "preview-assets/unreviewed.svg"), svg);
    assert.match(
      releaseBlockers(root, "private-preview").join(),
      /Unreviewed public file/,
    );
    assert.deepEqual(releaseBlockers(root, "unknown"), [
      "Unknown release mode",
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("preview preparation refuses to mutate a real working checkout", () => {
  assert.throws(() => preparePrivatePreview(process.cwd()), /disposable/);
});

test("both preview build profiles refuse enabled authentication or indexing", () => {
  for (const mode of ["private-preview", "public-demo"])
    for (const flag of [
      "NEXT_PUBLIC_AUTH_ENABLED",
      "NEXT_PUBLIC_INDEXING_ENABLED",
    ]) {
      const result = spawnSync(
        process.execPath,
        ["--input-type=module", "-e", 'await import("./next.config.ts")'],
        {
          cwd: fileURLToPath(new URL("../", import.meta.url)),
          encoding: "utf8",
          env: {
            ...process.env,
            NEXT_PUBLIC_RELEASE_MODE: mode,
            NEXT_PUBLIC_AUTH_ENABLED: "false",
            NEXT_PUBLIC_INDEXING_ENABLED: "false",
            [flag]: "true",
          },
        },
      );
      assert.notEqual(result.status, 0, `${mode}: ${flag}`);
      assert.match(result.stderr, /auth and indexing disabled/);
    }
});

test("public demo requires separate public content, access and exact SVG permissions", () => {
  const root = mkdtempSync(join(tmpdir(), "saitena-public-demo-"));
  try {
    for (const dir of [
      "docs",
      "preview-assets",
      "public",
      "src/components/pages",
    ])
      mkdirSync(join(root, dir), { recursive: true });
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
    const asset = {
      path: "public/preview/art.svg",
      source: "preview-assets/art.svg",
      publicationRights: "approved-private-preview",
      sha256: createHash("sha256").update(svg).digest("hex"),
    };
    const write = (name, value) =>
      writeFileSync(join(root, "docs", name), JSON.stringify(value));
    write("private-preview-assets.json", [asset]);
    write("binary-review-manifest.json", []);
    write("release-approval.json", {});
    write("private-preview-approval.json", {
      owner: "techsolutionbg",
      preview_approved: true,
      test_data_approved: true,
      restricted_access_plan_approved: true,
    });
    writeFileSync(join(root, asset.source), svg);
    writeFileSync(
      join(root, "src/components/pages/pages.tsx"),
      "СТРУКТУРЕН МАКЕТ",
    );
    assert.match(
      releaseBlockers(root, "public-demo").join(),
      /approval record missing/,
    );
    const keys = [
      "public_demo_approved",
      "test_data_public_display_approved",
      "svg_public_display_rights_approved",
      "cloudflare_only_origin_plan_approved",
      "deployment_plan_approved",
    ];
    const approval = {
      owner: "techsolutionbg",
      ...Object.fromEntries(keys.map((k) => [k, true])),
      approved_assets: [{ path: asset.path, sha256: asset.sha256 }],
    };
    const save = () => write("public-demo-approval.json", approval);
    save();
    assert.deepEqual(releaseBlockers(root, "public-demo"), []);
    // Public demo never qualifies draft company/legal information for full release.
    assert.match(
      releaseBlockers(root, "public").join(),
      /company_data_approved/,
    );
    assert.match(releaseBlockers(root, "public").join(), /Legal documents/);
    for (const key of keys) {
      approval[key] = false;
      save();
      assert.match(
        releaseBlockers(root, "public-demo").join(),
        new RegExp(key),
      );
      approval[key] = true;
    }
    approval.owner = "other";
    save();
    assert.match(releaseBlockers(root, "public-demo").join(), /owner mismatch/);
    approval.owner = "techsolutionbg";
    approval.approved_assets = [];
    save();
    assert.match(
      releaseBlockers(root, "public-demo").join(),
      /exact asset hashes/,
    );
    approval.approved_assets = [{ path: asset.path, sha256: asset.sha256 }];
    save();
    // Replacing both bytes and manifest cannot reuse the previous public grant.
    writeFileSync(join(root, asset.source), svg + "changed");
    asset.sha256 = createHash("sha256")
      .update(svg + "changed")
      .digest("hex");
    write("private-preview-assets.json", [asset]);
    assert.match(
      releaseBlockers(root, "public-demo").join(),
      /exact asset hashes/,
    );
    writeFileSync(join(root, "preview-assets/unreviewed.svg"), svg);
    assert.match(
      releaseBlockers(root, "public-demo").join(),
      /Unreviewed public file/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("preview keeps structured illustration slots and removes text-overlapping CSS artwork", () => {
  const assets = [["/images/hero.webp", "/preview/illustration.svg"]];
  assert.equal(
    replacePreviewAssetReferences(
      '<Image src="/images/hero.webp" />',
      assets,
      false,
    ),
    '<Image src="/preview/illustration.svg" />',
  );
  for (const url of [
    'url("/images/hero.webp")',
    "url('/images/hero.webp')",
    "url(/images/hero.webp)",
  ]) {
    assert.equal(
      replacePreviewAssetReferences(
        `background: linear-gradient(white, blue), ${url};`,
        assets,
        true,
      ),
      "background: linear-gradient(white, blue), none;",
    );
  }
  assert.equal(
    replacePreviewAssetReferences("color: var(--ink);", assets, true),
    "color: var(--ink);",
  );
});
