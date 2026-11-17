/** Server-only configuration. Recipients never come from browser input. */
export function contactMailConfig(env: NodeJS.ProcessEnv = process.env) {
  const mode = env.CONTACT_MAIL_MODE;
  const host = env.CONTACT_SMTP_HOST ?? "";
  const port = Number(env.CONTACT_SMTP_PORT ?? "465");
  const from = env.CONTACT_MAIL_FROM ?? "";
  const to = env.CONTACT_MAIL_TO ?? "";
  const address = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/u;
  if (
    !host ||
    /[\s/]/u.test(host) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !address.test(from) ||
    !address.test(to)
  )
    throw new Error("Contact mail configuration is incomplete.");
  const mailpit = mode === "mailpit";
  if (
    mailpit &&
    (host !== "mailpit" ||
      port !== 1025 ||
      !from.endsWith(".test") ||
      !to.endsWith(".test"))
  )
    throw new Error(
      "Mailpit mode requires the isolated mailpit service and test recipients.",
    );
  if (
    !mailpit &&
    (mode !== "smtp" || !env.CONTACT_SMTP_USER || !env.CONTACT_SMTP_PASSWORD)
  )
    throw new Error("Authenticated contact SMTP is required.");
  return {
    host,
    port,
    from,
    to,
    mailpit,
    user: env.CONTACT_SMTP_USER,
    pass: env.CONTACT_SMTP_PASSWORD,
  };
}
