import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";

export function releaseBlockers(root = process.cwd()) {
  const manifest = JSON.parse(
    readFileSync(join(root, "docs/binary-review-manifest.json"), "utf8"),
  );
  const assets = manifest.filter(
    (a) =>
      a.path.startsWith("public/") && a.decision !== "exclude-local-archive",
  );
  const excluded = new Set(
    manifest
      .filter((a) => a.decision === "exclude-local-archive")
      .map((a) => a.path),
  );
  const blockers = [];
  for (const asset of assets) {
    if (asset.publicationRights !== "approved")
      blockers.push(`Rights pending: ${asset.path}`);
    try {
      const hash = createHash("sha256")
        .update(readFileSync(join(root, asset.path)))
        .digest("hex");
      if (hash !== asset.sha256) blockers.push(`Changed asset: ${asset.path}`);
    } catch {
      blockers.push(`Missing asset: ${asset.path}`);
    }
  }
  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else {
        const name = relative(root, path).replaceAll("\\", "/");
        if (!excluded.has(name) && !assets.some((a) => a.path === name))
          blockers.push(`Unreviewed public file: ${name}`);
      }
    }
  }
  visit(join(root, "public"));
  if (
    /СТРУКТУРЕН МАКЕТ|предстои потвърждение|не действащ правен документ/u.test(
      readFileSync(join(root, "src/components/pages/pages.tsx"), "utf8"),
    )
  )
    blockers.push("Legal documents still contain draft content");
  return blockers;
}
