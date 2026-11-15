import nodemailer from "nodemailer";
import type { ContactMessage } from "./contact-message";
import { sendLocalContactMail } from "./local-contact-mail";

import { contactMailConfig } from "./contact-mail-config";

export async function sendContactMail(message: ContactMessage) {
  if (process.env.NODE_ENV === "development" && !process.env.CONTACT_MAIL_MODE)
    return sendLocalContactMail(message);
  const config = contactMailConfig();
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: !config.mailpit && config.port === 465,
    requireTLS: !config.mailpit,
    auth: config.mailpit ? undefined : { user: config.user, pass: config.pass },
    tls: { rejectUnauthorized: true },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  const result = await transport.sendMail({
    from: { name: "Saitena — контактна форма", address: config.from },
    to: config.to,
    replyTo: { name: message.name, address: message.email },
    subject: message.subject || "Ново запитване от контактната форма",
    text: [
      `Име: ${message.name}`,
      `Имейл: ${message.email}`,
      `Телефон: ${message.phone || "Не е посочен"}`,
      "",
      message.message,
    ].join("\n"),
  });
  if (!result.accepted.length || result.rejected.length)
    throw new Error("Contact message was not accepted.");
}
