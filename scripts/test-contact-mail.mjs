import assert from "node:assert/strict";

const app = "http://127.0.0.1:3000";
const inbox = "http://127.0.0.1:18025";
const subject = `Saitena integration ${Date.now()}`;
const payload = {
  name: "Локален тест",
  email: "visitor@example.test",
  phone: "+359 888 000 000",
  subject,
  message: "Проверка на кирилица.\nВтори ред на тестовото съобщение.",
};

async function post(body, headers = {}) {
  return fetch(`${app}/api/contact`, {
    method: "POST",
    headers: { Origin: app, "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

assert.equal(
  (await post(payload, { Origin: "https://unrelated.example" })).status,
  403,
);
assert.equal(
  (await post(payload, { "Content-Type": "text/plain" })).status,
  415,
);
assert.equal((await post("{")).status, 400);
assert.equal(
  (await post({ ...payload, subject: "injection\r\nBcc: bad@example.test" }))
    .status,
  400,
);
assert.equal((await post({ ...payload, message: " " })).status, 400);
assert.equal(
  (await post({ ...payload, message: "а".repeat(12000) })).status,
  413,
);

const response = await post(payload);
assert.equal(response.status, 200, await response.clone().text());
assert.deepEqual(await response.json(), { ok: true });
const listing = await (await fetch(`${inbox}/api/v1/messages`)).json();
const captured = listing.messages.find(
  (message) => message.Subject === subject,
);
assert.ok(captured, "The accepted message must actually be present in Mailpit");
const detail = await (
  await fetch(`${inbox}/api/v1/message/${captured.ID}`)
).json();
assert.equal(detail.From.Address, "contact@saitena.test");
assert.equal(detail.To[0].Address, "inbox@saitena.test");
assert.equal(detail.ReplyTo[0].Address, payload.email);
assert.ok(detail.Text.includes(payload.message));
console.log(
  "PASS: invalid requests rejected; SMTP mail captured with correct sender, recipient, Reply-To and Bulgarian content.",
);
