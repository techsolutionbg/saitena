export interface ContactMessage {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

type ValidationResult =
  { ok: true; message: ContactMessage } | { ok: false; error: string };

/** Validate independently of HTML constraints; mail headers must be single-line. */
export function validateContactMessage(value: unknown): ValidationResult {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return { ok: false, error: "Невалидни данни във формата." };

  const fields: Record<string, string> = {};
  for (const [key, limit, required] of [
    ["name", 100, true],
    ["email", 150, true],
    ["phone", 30, false],
    ["subject", 150, false],
    ["message", 4000, true],
  ] as const) {
    const input = Reflect.get(value, key);
    if (typeof input !== "string")
      return { ok: false, error: "Проверете полетата във формата." };
    const text = input.trim();
    if (
      (required && !text) ||
      text.length > limit ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text) ||
      (key !== "message" && /[\r\n\t]/u.test(text))
    )
      return {
        ok: false,
        error:
          "Попълнете коректно задължителните полета и проверете дължината на текста.",
      };
    fields[key] = text;
  }
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/u.test(fields.email))
    return { ok: false, error: "Въведете валиден имейл адрес." };
  return {
    ok: true,
    message: {
      name: fields.name,
      email: fields.email,
      phone: fields.phone,
      subject: fields.subject,
      message: fields.message,
    },
  };
}
