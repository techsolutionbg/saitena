import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { releaseBlockers } from "../scripts/release-readiness.mjs";

test("release rejects pending rights, changed and unreviewed files and legal drafts", () => {
  const root = mkdtempSync(join(tmpdir(), "saitena-release-"));
  try {
    for (const dir of ["docs", "public", "src/components/pages"])
      mkdirSync(join(root, dir), { recursive: true });
    const asset = {
      path: "public/art.svg",
      sha256: createHash("sha256").update("original").digest("hex"),
      publicationRights: "approved",
    };
    writeFileSync(
      join(root, "docs/release-approval.json"),
      JSON.stringify({
        company_data_approved: true,
        legal_copy_approved: true,
        contact_details_approved: true,
        deployment_plan_approved: true,
      }),
    );
    writeFileSync(join(root, asset.path), "original");
    const manifest = () =>
      writeFileSync(
        join(root, "docs/binary-review-manifest.json"),
        JSON.stringify([asset]),
      );
    manifest();
    writeFileSync(
      join(root, "src/components/pages/pages.tsx"),
      "Reviewed legal copy",
    );
    assert.deepEqual(releaseBlockers(root), []);
    asset.publicationRights = "not-confirmed";
    manifest();
    assert.match(releaseBlockers(root).join(), /Rights pending/);
    asset.publicationRights = "approved";
    manifest();
    writeFileSync(join(root, asset.path), "changed");
    assert.match(releaseBlockers(root).join(), /Changed asset/);
    writeFileSync(join(root, "public/new.svg"), "new");
    assert.match(releaseBlockers(root).join(), /Unreviewed public file/);
    writeFileSync(
      join(root, "src/components/pages/pages.tsx"),
      "СТРУКТУРЕН МАКЕТ",
    );
    assert.match(releaseBlockers(root).join(), /Legal documents/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
