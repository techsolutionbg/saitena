import assert from "node:assert/strict";
import test from "node:test";
import { contactMailConfig } from "../src/lib/contact-mail-config.ts";

const isolated = {
  CONTACT_MAIL_MODE: "mailpit",
  CONTACT_SMTP_HOST: "mailpit",
  CONTACT_SMTP_PORT: "1025",
  CONTACT_MAIL_FROM: "contact@saitena.test",
  CONTACT_MAIL_TO: "inbox@saitena.test",
};
test("isolated SMTP accepts only Mailpit and test recipients", () => {
  assert.equal(contactMailConfig(isolated).mailpit, true);
  for (const change of [
    { CONTACT_MAIL_TO: "client@example.com" },
    { CONTACT_SMTP_HOST: "smtp.example.com" },
    { CONTACT_SMTP_PORT: "465" },
  ])
    assert.throws(() => contactMailConfig({ ...isolated, ...change }));
});
test("production SMTP fails closed without credentials or with header injection", () => {
  assert.throws(() => contactMailConfig({}));
  assert.throws(() =>
    contactMailConfig({ ...isolated, CONTACT_MAIL_MODE: "smtp" }),
  );
  assert.throws(() =>
    contactMailConfig({
      ...isolated,
      CONTACT_MAIL_TO: "inbox@saitena.test\r\nBcc: hidden@example.test",
    }),
  );
});
