import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { verifyPublicSite } from "../scripts/check-deployed-site.mjs";
import {
  htmlIdentity,
  FAQ_EMAIL,
  DECODE_SCRIPT,
  STREAM_ANCHOR,
} from "../scripts/faq-html-identity.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const body = "original candidate";
const expected = Object.fromEntries(
  [
    "/",
    "/faq",
    ...Array.from({ length: 23 }, (_, i) => `/images/${i}.webp`),
  ].map((path) => [path, sha(body)]),
);
const get = async (host, path) => ({
  status: [
    "/legal/privacy",
    "/legal/terms",
    "/sitemap",
    "/sitemap.xml",
  ].includes(path)
    ? 404
    : 200,
  headers: {
    "cf-ray": "fixture",
    "x-robots-tag": "noindex, nofollow",
    "cache-control": "private, no-store",
  },
  bytes: Buffer.from(
    path === "/robots.txt" ? "User-agent: *\nDisallow: /" : body,
  ),
});
test("independent content verification refuses changed bytes, failed assets and missing protections", async () => {
  assert.equal((await verifyPublicSite(expected, get)).checked, 26);
  for (const mutate of [
    (r) => (r.status = 503),
    (r) => (r.bytes = Buffer.from("wrong image")),
    (r) => delete r.headers["cf-ray"],
    (r) => delete r.headers["x-robots-tag"],
    (r) => delete r.headers["cache-control"],
  ]) {
    await assert.rejects(
      verifyPublicSite(expected, async (...args) => {
        const r = await get(...args);
        mutate(r);
        return r;
      }),
    );
  }
  await assert.rejects(verifyPublicSite({ "/": sha(body) }, get));
});
test("only the exact known FAQ email transformation is permitted", () => {
  const original = FAQ_EMAIL + STREAM_ANCHOR + "original trailing content";
  const key = 42,
    encoded = Buffer.from([
      key,
      ...Buffer.from(FAQ_EMAIL).map((v) => v ^ key),
    ]).toString("hex");
  const node = `<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="${encoded}">[email&#160;protected]</a>`;
  const transformed =
    node + DECODE_SCRIPT + STREAM_ANCHOR + "original trailing content";
  assert.equal(
    htmlIdentity(Buffer.from(transformed), sha(original), "/faq").valid,
    true,
  );
  for (const [text, path] of [
    [transformed, "/"],
    [transformed + "x", "/faq"],
    [transformed.replace("original trailing", "changed trailing"), "/faq"],
    [transformed.replace("data-cfasync=", "evil="), "/faq"],
    [
      node +
        DECODE_SCRIPT +
        "misplaced" +
        STREAM_ANCHOR +
        "original trailing content",
      "/faq",
    ],
  ])
    assert.equal(
      htmlIdentity(Buffer.from(text), sha(original), path).valid,
      false,
    );
});
