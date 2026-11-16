import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  cpSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

/** Keep illustrations in image slots; gradients remain behind readable text. */
export function replacePreviewAssetReferences(content, replacements, isCss) {
  for (const [before, after] of replacements) {
    if (isCss) {
      for (const url of [
        `url("${before}")`,
        `url('${before}')`,
        `url(${before})`,
      ])
        content = content.replaceAll(url, "none");
    } else content = content.replaceAll(before, after);
  }
  return content;
}

/** Mutates only the disposable Docker build context, never the source checkout. */
export function preparePrivatePreview(root) {
  if (root !== "/app" || process.env.SAITENA_DISPOSABLE_BUILD !== "true")
    throw new Error(
      "Private Preview preparation is restricted to the disposable /app build tree",
    );
  const manifest = JSON.parse(
    readFileSync(join(root, "docs/private-preview-assets.json"), "utf8"),
  );
  for (const asset of manifest) {
    if (
      !/^public\/preview\/[a-z-]+\.svg$/.test(asset.path) ||
      !/^preview-assets\/[a-z-]+\.svg$/.test(asset.source)
    )
      throw new Error("Invalid preview asset path");
    if (
      createHash("sha256")
        .update(readFileSync(join(root, asset.source)))
        .digest("hex") !== asset.sha256
    )
      throw new Error("Changed preview asset");
  }
  const original = JSON.parse(
    readFileSync(join(root, "docs/binary-review-manifest.json"), "utf8"),
  );
  const replacements = original
    .filter((a) => a.path.startsWith("public/"))
    .map((a) => [
      "/" + a.path.slice(7),
      a.path.startsWith("public/brand/")
        ? "/preview/" +
          (a.path.includes("logo-light")
            ? "logo-light.svg"
            : a.path.includes("logo-dark")
              ? "logo-dark.svg"
              : "mark.svg")
        : "/preview/illustration.svg",
    ]);
  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (/\.(?:tsx?|css)$/.test(entry.name)) {
        let content = readFileSync(file, "utf8");
        content = replacePreviewAssetReferences(
          content,
          replacements,
          entry.name.endsWith(".css"),
        );
        if (/\/(?:images|brand)\//.test(content))
          throw new Error("Unmapped original asset in preview source");
        writeFileSync(file, content);
      }
    }
  }
  visit(join(root, "src"));
  // OverlayFS cannot rename a lower-layer directory across layers (EXDEV).
  cpSync(join(root, "public"), join(root, "unpublished-public"), {
    recursive: true,
  });
  rmSync(join(root, "public"), { recursive: true });
  mkdirSync(join(root, "public/preview"), { recursive: true });
  for (const asset of manifest)
    copyFileSync(join(root, asset.source), join(root, asset.path));
  writeFileSync(
    join(root, "private-preview-prepared.json"),
    JSON.stringify({ mode: "private-preview" }),
  );
}

if (process.argv[1]?.endsWith("prepare-private-preview.mjs"))
  preparePrivatePreview(process.cwd());
