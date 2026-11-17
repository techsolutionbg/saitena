import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { format } from "prettier";

const load = (name) =>
  readFileSync(
    new URL(`../.github/workflows/${name}.yml`, import.meta.url),
    "utf8",
  );

test("connectivity workflow cannot obtain the deployment key or publish images", async () => {
  const source = load("deployment-connectivity");
  await format(source, { parser: "yaml" });
  assert.match(source, /github\.ref == 'refs\/heads\/main'/);
  assert.match(source, /github\.actor == 'techsolutionbg'/);
  assert.match(source, /github\.triggering_actor == 'techsolutionbg'/);
  assert.match(source, /environment: deployment-connectivity/);
  assert.match(source, /workflow_dispatch:/);
  assert.doesNotMatch(
    source,
    /SAITENA_DEPLOY_KEY|packages:|docker |pull_request:|\n  push:/,
  );
  assert.match(source, /StrictHostKeyChecking=yes/);
  assert.match(source, /test "\$ACTUAL" = "\$EXPECTED"/);
  assert.match(source, /PreferredAuthentications=none/);
});

test("production OIDC remains behind release authorization and Environment approval", async () => {
  const source = load("production");
  await format(source, { parser: "yaml" });
  assert.match(source, /needs: \[authorize, build\]/);
  assert.match(source, /name: production/);
  assert.match(source, /vars\.SAITENA_AUTODEPLOY_ENABLED == 'true'/);
  assert.match(source, /node scripts\/authorize-main-deployment\.mjs/);
  assert.match(source, /workflow_run:/);
  assert.match(source, /branches: \[main\]/);
  assert.match(source, /workflow_run\.event == 'push'/);
  assert.match(source, /workflow_run\.conclusion == 'success'/);
  assert.match(source, /node scripts\/check-release-readiness\.mjs/);
  assert.match(source, /--jq \.visibility\)" = private/);
  assert.doesNotMatch(source, /pull_request_target:|\n  push:/);
  const deploy = source.split("\n  deploy:")[1];
  assert.match(deploy, /id-token: write/);
  assert.doesNotMatch(deploy, /packages: write/);
  assert.match(
    deploy,
    /tailscale\/github-action@064b10558093f38325e838ddea35486bdc6b1d5c/,
  );
  assert.match(deploy, /needs\.build\.outputs\.digest/);
  assert.match(deploy, /packages: read/);
  assert.match(deploy, /Revalidate main and protections after owner approval/);
  assert.match(deploy, /node scripts\/deploy-approved-main\.mjs/);
  assert.doesNotMatch(source, /SAITENA_DEPLOY_KEY[\s\S]*\n  build:/);
});
