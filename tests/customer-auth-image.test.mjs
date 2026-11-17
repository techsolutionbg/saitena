import test from "node:test";
import assert from "node:assert/strict";
import { validatePublicImage } from "../scripts/inspect-auth-image.mjs";
const sha = "a".repeat(40),
  image = "ghcr.io/techsolutionbg/saitena/public@sha256:" + "b".repeat(64);
function fixture() {
  return {
    Id: "sha256:" + "c".repeat(64),
    RepoDigests: [image],
    Config: {
      User: "node",
      Env: ["CONTACT_MAIL_MODE=disabled"],
      Labels: {
        "org.opencontainers.image.revision": sha,
        "org.opencontainers.image.source":
          "https://github.com/techsolutionbg/saitena",
        "io.saitena.release-mode": "customer-auth",
      },
    },
  };
}
test("public Auth identity binds the approved digest to the exact local image ID", () => {
  assert.equal(
    validatePublicImage(fixture(), { sha, image }).imageId,
    fixture().Id,
  );
});
for (const [name, change] of Object.entries({
  wrongDigest: (x) => (x.RepoDigests = []),
  privateSource: (x) =>
    (x.Config.Labels["org.opencontainers.image.source"] = "private-platform"),
  wrongCommit: (x) =>
    (x.Config.Labels["org.opencontainers.image.revision"] = "d".repeat(40)),
  rootImage: (x) => (x.Config.User = "root"),
  sensitiveEnv: (x) =>
    x.Config.Env.push("DB_PASSWORD=synthetic-sensitive-fixture"),
}))
  test("Auth image identity refuses " + name, () => {
    const x = fixture();
    change(x);
    assert.throws(() => validatePublicImage(x, { sha, image }));
  });
