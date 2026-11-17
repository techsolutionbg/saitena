import assert from "node:assert/strict";
import https from "node:https";
import { readFileSync } from "node:fs";
const ca = readFileSync("qa-output/staging-root.crt");
const origin = "https://localhost:13443";
function request(path, payload, extra = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      `${origin}${path}`,
      {
        ca,
        rejectUnauthorized: true,
        method: payload ? "POST" : "GET",
        headers: {
          Origin: origin,
          "Content-Type": "application/json",
          ...extra,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (part) => (body += part));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      },
    );
    req.on("error", reject);
    req.end(payload ? JSON.stringify(payload) : undefined);
  });
}
const subject = `HTTPS candidate ${Date.now()}`;
const payload = {
  name: "Staging test",
  email: "visitor@example.test",
  phone: "",
  subject,
  message: "Изолирана HTTPS проверка. Не се изпраща до клиенти.",
};
assert.equal((await request("/api/health")).status, 200);
assert.equal(
  (
    await request("/api/contact", payload, {
      Origin: "https://unrelated.example",
    })
  ).status,
  403,
);
assert.equal(
  (await request("/api/contact", { ...payload, email: "invalid" })).status,
  400,
);
const sent = await request("/api/contact", payload);
assert.equal(sent.status, 200, sent.body);
const listing = await (
  await fetch("http://127.0.0.1:18028/api/v1/messages")
).json();
const captured = listing.messages.find(
  (message) => message.Subject === subject,
);
assert.ok(captured, "Mailpit did not receive the accepted HTTPS message");
const detail = await (
  await fetch(`http://127.0.0.1:18028/api/v1/message/${captured.ID}`)
).json();
assert.equal(detail.To[0].Address, "inbox@saitena.test");
assert.equal(detail.ReplyTo[0].Address, payload.email);
console.log(
  "PASS verified TLS CA+hostname; HTTPS health; contact SMTP delivery to isolated Mailpit; invalid origin/input rejected.",
);
