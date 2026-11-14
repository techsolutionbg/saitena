import nodemailer from "nodemailer";
import type { ContactMessage } from "./contact-message";

/** Deliberately fixed to the isolated local Mailpit; never relays to real mail. */
export async function sendLocalContactMail(message: ContactMessage) {
  if (process.env.NODE_ENV !== "development")
    throw new Error("Local contact mail is available only in development.");

  const transport = nodemailer.createTransport({
    host: "127.0.0.1",
    port: 11025,
    secure: false,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  const result = await transport.sendMail({
    from: {
      name: "Saitena — контактна форма",
      address: "contact@saitena.test",
    },
    to: "inbox@saitena.test",
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
    throw new Error("The local SMTP server did not accept the message.");
}
