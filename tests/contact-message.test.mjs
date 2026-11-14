import assert from "node:assert/strict";
import test from "node:test";
import { validateContactMessage } from "../src/lib/contact-message.ts";
import { sendLocalContactMail } from "../src/lib/local-contact-mail.ts";

const message = {
  name: "Тестов клиент",
  email: "client@example.test",
  phone: "",
  subject: "",
  message: "Първи ред.\nВтори ред.",
};

test("local SMTP cannot send outside development", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    await assert.rejects(sendLocalContactMail(message), /only in development/);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});

test("accepts Bulgarian text and optional empty fields, trimming whitespace", () => {
  const result = validateContactMessage({
    ...message,
    name: "  Тестов клиент  ",
  });
  assert.equal(result.ok, true);
  assert.equal(result.message.name, message.name);
  assert.equal(result.message.message, message.message);
});

test("rejects missing, malformed and incorrectly typed data", () => {
  for (const input of [
    null,
    [],
    "text",
    {},
    { ...message, email: 12 },
    { ...message, name: "  " },
    { ...message, message: "\n " },
    { ...message, email: "invalid@" },
  ]) {
    assert.equal(validateContactMessage(input).ok, false);
  }
});

test("rejects mail header injection and control characters", () => {
  for (const field of ["name", "email", "phone", "subject"]) {
    assert.equal(
      validateContactMessage({
        ...message,
        [field]: "value\r\nBcc: other@example.test",
      }).ok,
      false,
    );
  }
  assert.equal(
    validateContactMessage({ ...message, message: "hello\0world" }).ok,
    false,
  );
});

test("accepts exact limits and rejects overlong fields", () => {
  for (const [field, max] of [
    ["name", 100],
    ["phone", 30],
    ["subject", 150],
    ["message", 4000],
  ]) {
    assert.equal(
      validateContactMessage({ ...message, [field]: "а".repeat(max) }).ok,
      true,
    );
    assert.equal(
      validateContactMessage({ ...message, [field]: "а".repeat(max + 1) }).ok,
      false,
    );
  }
});
