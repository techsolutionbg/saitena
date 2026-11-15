import { readFileSync } from "node:fs";
const manifest = JSON.parse(readFileSync("docs/binary-review-manifest.json", "utf8"));
const unapproved = manifest.filter((asset) => asset.path.startsWith("public/") && asset.decision !== "exclude-local-archive" && asset.publicationRights !== "approved");
const legal = readFileSync("src/components/pages/pages.tsx", "utf8");
const blockers = [];
if (unapproved.length) blockers.push(`${unapproved.length} public assets need owner publication-rights approval`);
if (/СТРУКТУРЕН МАКЕТ|предстои потвърждение|не действащ правен документ/u.test(legal)) blockers.push("Legal documents still contain draft content");
if (blockers.length) {
  console.error("PUBLIC RELEASE BLOCKED:\n" + blockers.join("\n"));
  process.exitCode = 1;
}
