// Bulgarian uses the root in the proposed public architecture. English is reserved,
// not exposed as a partially translated or duplicate site during design review.
export const defaultLocale = "bg" as const;
export const locales = ["bg", "en"] as const;
export type Locale = (typeof locales)[number];
export const localePrefixes: Record<Locale, string> = { bg: "", en: "/en" };
export const translatedRoutes = {
  services: { bg: "/uslugi", en: "/en/services" },
  plans: { bg: "/planove", en: "/en/plans" },
  portfolio: { bg: "/portfolio", en: "/en/portfolio" },
  about: { bg: "/za-nas", en: "/en/about" },
  contact: { bg: "/kontakti", en: "/en/contact" },
  inquiry: { bg: "/zapitvane", en: "/en/inquiry" },
} as const;
