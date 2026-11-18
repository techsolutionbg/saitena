import test from "node:test";
import assert from "node:assert/strict";
import { isPrivatePlatformPath } from "../scripts/public-source-boundary.mjs";

test("public source audit refuses private API, portal and operations paths", () => {
  for (const path of [
    "platform/api/routes/api.php",
    "platform/portal/package.json",
    "apps/api/app/User.php",
    "apps/web/app/profile/page.tsx",
    "infra/auth-activation/portal.Caddyfile",
    "qa-private/source.php",
    ".deployment/Caddyfile.auth-local",
    "./Platform/API/config.php",
    "apps\\web\\private.ts",
  ])
    assert.equal(isPrivatePlatformPath(path), true, path);
});
test("public website, existing deployment code and public Auth contracts remain allowed", () => {
  for (const path of [
    "src/app/login/page.tsx",
    "src/lib/auth-api.ts",
    ".deployment/Dockerfile",
    ".github/workflows/checks.yml",
    "tests/customer-auth.test.mjs",
    "public/brand/logo.svg",
    "platform-guide.md",
  ])
    assert.equal(isPrivatePlatformPath(path), false, path);
});
