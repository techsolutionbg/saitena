import type { IconName } from "@/components/ui/icons";

interface ContactSettings {
  email?: string;
  phone?: string;
  viberUrl?: string;
}

interface ContactLink {
  id: string;
  label: string;
  icon: IconName;
  href: string | null;
  value: string;
}

function validViberUrl(value: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const viberHost =
      url.hostname === "viber.me" ||
      url.hostname.endsWith(".viber.me") ||
      url.hostname === "viber.com" ||
      url.hostname.endsWith(".viber.com");
    if (url.username || url.password) return null;
    return url.protocol === "viber:" || (url.protocol === "https:" && viberHost)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/** Public contact links only. Empty or invalid settings never become clickable links. */
export function buildContactLinks(
  settings: ContactSettings,
): readonly ContactLink[] {
  const email = settings.email?.trim() ?? "";
  const phone = settings.phone?.trim() ?? "";
  const compactPhone = phone.replace(/[\s().-]/g, "");
  const phoneNumber = /^0[1-9]\d{7,8}$/.test(compactPhone)
    ? `+359${compactPhone.slice(1)}`
    : compactPhone.replace(/^00(?=[1-9])/, "+");
  return [
    {
      id: "email",
      label: "Имейл",
      icon: "mail",
      value: email,
      href: /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)
        ? `mailto:${encodeURIComponent(email).replace("%40", "@")}`
        : null,
    },
    {
      id: "phone",
      label: "Телефон",
      icon: "phone",
      value: phone,
      href: /^\+[1-9]\d{6,14}$/.test(phoneNumber) ? `tel:${phoneNumber}` : null,
    },
    {
      id: "viber",
      label: "Viber",
      icon: "message",
      value: "Пишете ни във Viber",
      href: validViberUrl(settings.viberUrl?.trim() ?? ""),
    },
  ];
}
