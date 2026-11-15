import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";

export function releaseBlockers(root = process.cwd(), mode = "public") {
  if (!["public", "private-preview"].includes(mode))
    return ["Unknown release mode"];
  const preview = mode === "private-preview";
  const manifest = JSON.parse(
    readFileSync(
      join(
        root,
        preview
          ? "docs/private-preview-assets.json"
          : "docs/binary-review-manifest.json",
      ),
      "utf8",
    ),
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
  try {
    const approval = JSON.parse(
      readFileSync(
        join(
          root,
          preview
            ? "docs/private-preview-approval.json"
            : "docs/release-approval.json",
        ),
        "utf8",
      ),
    );
    if (preview && approval.owner !== "techsolutionbg")
      blockers.push("Preview owner mismatch");
    for (const key of preview
      ? [
          "preview_approved",
          "test_data_approved",
          "restricted_access_plan_approved",
        ]
      : [
          "company_data_approved",
          "legal_copy_approved",
          "contact_details_approved",
          "deployment_plan_approved",
        ]) {
      if (approval[key] !== true)
        blockers.push(`Owner approval pending: ${key}`);
    }
  } catch {
    blockers.push("Owner release approval record missing");
  }
  for (const asset of assets) {
    if (
      asset.publicationRights !==
      (preview ? "approved-private-preview" : "approved")
    )
      blockers.push(`Rights pending: ${asset.path}`);
    try {
      const hash = createHash("sha256")
        .update(readFileSync(join(root, preview ? asset.source : asset.path)))
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
        if (
          !excluded.has(name) &&
          !assets.some((a) => (preview ? a.source : a.path) === name)
        )
          blockers.push(`Unreviewed public file: ${name}`);
      }
    }
  }
  visit(join(root, preview ? "preview-assets" : "public"));
  if (
    !preview &&
    /СТРУКТУРЕН МАКЕТ|предстои потвърждение|не действащ правен документ/u.test(
      readFileSync(join(root, "src/components/pages/pages.tsx"), "utf8"),
    )
  )
    blockers.push("Legal documents still contain draft content");
  return blockers;
}
