import assert from "node:assert/strict";
import test from "node:test";
import { buildContactLinks } from "../src/lib/contact-links.ts";

function phoneLink(phone) {
  return buildContactLinks({ phone }).find((contact) => contact.id === "phone");
}

test("normalizes Bulgarian local mobile and landline numbers for calling", () => {
  assert.equal(phoneLink("0888 123 456").href, "tel:+359888123456");
  assert.equal(phoneLink("02 123 4567").href, "tel:+35921234567");
  assert.equal(phoneLink("0888 123 456").value, "0888 123 456");
});

test("supports international numbers with plus or double-zero prefixes", () => {
  assert.equal(phoneLink("+359 (888) 123-456").href, "tel:+359888123456");
  assert.equal(phoneLink("00359 888 123 456").href, "tel:+359888123456");
  assert.equal(phoneLink("+44 20 7946 0000").href, "tel:+442079460000");
});

test("keeps missing, malformed and unsafe numbers non-clickable", () => {
  for (const value of [
    undefined,
    "",
    "123",
    "0888abc123456",
    "javascript:alert(1)",
    "+359888123456;ext=1",
    "+000000000",
  ]) {
    assert.equal(phoneLink(value).href, null);
  }
});
