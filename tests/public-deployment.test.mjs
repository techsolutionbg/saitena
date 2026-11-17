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
    "/_next/image?url=%2Fimages%2F1.webp&w=640&q=75",
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
  assert.equal((await verifyPublicSite(expected, get)).checked, 27);
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
  await assert.rejects(
    verifyPublicSite(expected, async (...args) => {
      const result = await get(...args);
      if (args[1] === "/robots.txt") result.status = 503;
      return result;
    }),
  );
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

test("non-streamed FAQ keeps exact identity after the known Cloudflare email transform", () => {
  const anchor = "<script>(self.__next_f=self.__next_f||[]).push([0])</script>";
  const original = `<main>${FAQ_EMAIL}</main><footer>unchanged</footer>${anchor}original trailing content`;
  const key = 42;
  const encoded = Buffer.from([
    key,
    ...Buffer.from(FAQ_EMAIL).map((value) => value ^ key),
  ]).toString("hex");
  const node = `<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="${encoded}">[email&#160;protected]</a>`;
  const transformed = original
    .replace(FAQ_EMAIL, node)
    .replace(anchor, DECODE_SCRIPT + anchor);
  assert.equal(
    htmlIdentity(Buffer.from(transformed), sha(original), "/faq").valid,
    true,
  );
  for (const [text, path] of [
    [transformed, "/"],
    [transformed.replace("unchanged", "changed"), "/faq"],
    [transformed.replace("original trailing", "modified trailing"), "/faq"],
    [transformed.replace(DECODE_SCRIPT, DECODE_SCRIPT + DECODE_SCRIPT), "/faq"],
    [
      transformed.replace(
        DECODE_SCRIPT + anchor,
        DECODE_SCRIPT + "misplaced" + anchor,
      ),
      "/faq",
    ],
    [transformed.replace("email-decode.min.js", "unknown.js"), "/faq"],
    [transformed.replace(encoded, encoded.slice(0, -2) + "00"), "/faq"],
  ])
    assert.equal(
      htmlIdentity(Buffer.from(text), sha(original), path).valid,
      false,
    );
  const doubleOriginal = FAQ_EMAIL + FAQ_EMAIL + anchor;
  const doubleTransform = node + node + DECODE_SCRIPT + anchor;
  assert.equal(
    htmlIdentity(Buffer.from(doubleTransform), sha(doubleOriginal), "/faq")
      .valid,
    false,
  );
});
