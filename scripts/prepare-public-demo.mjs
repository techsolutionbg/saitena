import { createHash } from "node:crypto";
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

/** Candidates may contain pending review assets; only the release gate grants publication. */
export function validateOriginalAssets(root, manifest) {
  const seen = new Set();
  for (const asset of manifest) {
    if (
      !/^public\/(?:images|brand)\/[a-z0-9.-]+\.(?:webp|png|svg)$/.test(
        asset.path,
      ) ||
      seen.has(asset.path)
    )
      throw new Error("Invalid or duplicate original asset path");
    seen.add(asset.path);
    let directory = root;
    for (const segment of asset.path.split("/")) {
      if (!readdirSync(directory).includes(segment))
        throw new Error(`Missing or wrong-case asset: ${asset.path}`);
      directory = join(directory, segment);
    }
    if (!lstatSync(directory).isFile())
      throw new Error("Original assets must be regular files");
    const bytes = readFileSync(join(root, asset.path));
    if (createHash("sha256").update(bytes).digest("hex") !== asset.sha256)
      throw new Error(`Changed original asset: ${asset.path}`);
  }
}

/** Copy original bytes at their original URLs. Never rewrite UI source or substitute SVGs. */
export function preparePublicDemo(root) {
  if (root !== "/app" || process.env.SAITENA_DISPOSABLE_BUILD !== "true")
    throw new Error(
      "Public preparation is restricted to the disposable /app build tree",
    );
  const manifest = JSON.parse(
    readFileSync(join(root, "docs/public-demo-assets.json"), "utf8"),
  );
  validateOriginalAssets(root, manifest);
  const staged = join(root, "staged-public");
  mkdirSync(staged);
  for (const asset of manifest) {
    const target = join(staged, asset.path.slice(7));
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(root, asset.path), target);
  }
  // Only a new upper-layer staging directory is renamed; the checkout is never touched.
  rmSync(join(root, "public"), { recursive: true });
  renameSync(staged, join(root, "public"));
  writeFileSync(
    join(root, "public-demo-prepared.json"),
    JSON.stringify({ mode: "public-demo", originals: manifest.length }),
  );
}

if (process.argv[1]?.endsWith("prepare-public-demo.mjs"))
  preparePublicDemo(process.cwd());
