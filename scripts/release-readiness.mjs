import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";

export function releaseBlockers(root = process.cwd(), mode = "public") {
  if (!["public", "private-preview", "public-demo"].includes(mode))
    return ["Unknown release mode"];
  const preview = mode !== "public";
  const demo = mode === "public-demo";
  const manifest = JSON.parse(
    readFileSync(
      join(
        root,
        demo
          ? "docs/public-demo-assets.json"
          : preview
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
  if (demo) {
    const localAssets = JSON.parse(
      readFileSync(join(root, "docs/binary-review-manifest.json"), "utf8"),
    );
    for (const asset of localAssets)
      if (
        asset.path.startsWith("public/") &&
        !assets.some((included) => included.path === asset.path)
      )
        excluded.add(asset.path); // Known local-only assets are not copied to the public candidate.
  }
  const blockers = [];
  try {
    const approval = JSON.parse(
      readFileSync(
        join(
          root,
          demo
            ? "docs/public-demo-approval.json"
            : preview
              ? "docs/private-preview-approval.json"
              : "docs/release-approval.json",
        ),
        "utf8",
      ),
    );
    if (preview && approval.owner !== "techsolutionbg")
      blockers.push("Preview owner mismatch");
    for (const key of demo
      ? [
          "public_demo_approved",
          "content_public_display_approved",
          "assets_public_display_rights_approved",
          "cloudflare_only_origin_plan_approved",
          "deployment_plan_approved",
        ]
      : preview
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
    if (demo) {
      // Access approval cannot authorize unknown artwork or changed asset bytes.
      const signatures = (list) =>
        list.map((a) => `${a.path}:${a.sha256}`).sort();
      if (
        !Array.isArray(approval.approved_assets) ||
        JSON.stringify(signatures(approval.approved_assets)) !==
          JSON.stringify(signatures(assets))
      )
        blockers.push("Public asset permission missing for exact asset hashes");
    }
  } catch {
    blockers.push("Owner release approval record missing");
  }
  for (const asset of assets) {
    if (
      asset.publicationRights !==
      (demo
        ? "approved-public-demo"
        : preview
          ? "approved-private-preview"
          : "approved")
    )
      blockers.push(`Rights pending: ${asset.path}`);
    try {
      const hash = createHash("sha256")
        .update(
          readFileSync(
            join(root, preview && !demo ? asset.source : asset.path),
          ),
        )
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
          !assets.some((a) => (preview && !demo ? a.source : a.path) === name)
        )
          blockers.push(`Unreviewed public file: ${name}`);
      }
    }
  }
  visit(join(root, preview && !demo ? "preview-assets" : "public"));
  if (
    !preview &&
    /СТРУКТУРЕН МАКЕТ|предстои потвърждение|не действащ правен документ/u.test(
      readFileSync(join(root, "src/components/pages/pages.tsx"), "utf8"),
    )
  )
    blockers.push("Legal documents still contain draft content");
  return blockers;
}
