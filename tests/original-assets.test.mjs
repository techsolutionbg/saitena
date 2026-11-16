import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  renameSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  preparePublicDemo,
  validateOriginalAssets,
} from "../scripts/prepare-public-demo.mjs";

test("original asset preparation refuses the checkout and invalid/hash-drift/wrong-case paths", () => {
  assert.throws(() => preparePublicDemo(process.cwd()), /disposable/);
  const root = mkdtempSync(join(tmpdir(), "saitena-original-assets-"));
  try {
    mkdirSync(join(root, "public/images"), { recursive: true });
    writeFileSync(
      join(root, "public/images/original.webp"),
      "original fixture bytes",
    );
    const asset = {
      path: "public/images/original.webp",
      sha256: createHash("sha256")
        .update("original fixture bytes")
        .digest("hex"),
    };
    assert.doesNotThrow(() => validateOriginalAssets(root, [asset]));
    assert.throws(
      () => validateOriginalAssets(root, [asset, asset]),
      /duplicate/,
    );
    assert.throws(
      () =>
        validateOriginalAssets(root, [
          { ...asset, path: "public/images/../secret.webp" },
        ]),
      /Invalid/,
    );
    assert.throws(
      () =>
        validateOriginalAssets(root, [
          { ...asset, path: "public/images/Original.webp" },
        ]),
      /Invalid/,
    );
    renameSync(
      join(root, asset.path),
      join(root, "public/images/Original.webp"),
    );
    assert.throws(() => validateOriginalAssets(root, [asset]), /wrong-case/);
    renameSync(
      join(root, "public/images/Original.webp"),
      join(root, asset.path),
    );
    writeFileSync(join(root, asset.path), "changed original");
    assert.throws(() => validateOriginalAssets(root, [asset]), /Changed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
