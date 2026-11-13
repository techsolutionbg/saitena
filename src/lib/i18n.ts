// Bulgarian uses the root in the proposed public architecture. English is reserved,
// not exposed as a partially translated or duplicate site during design review.
export const defaultLocale = "bg" as const;
export const locales = ["bg", "en"] as const;
export type Locale = (typeof locales)[number];
export const localePrefixes: Record<Locale, string> = { bg: "", en: "/en" };
export const translatedRoutes = {
  services: { bg: "/services", en: "/en/services" },
  plans: { bg: "/plans", en: "/en/plans" },
  portfolio: { bg: "/portfolio", en: "/en/portfolio" },
  about: { bg: "/about", en: "/en/about" },
  contact: { bg: "/contact", en: "/en/contact" },
  inquiry: { bg: "/inquiry", en: "/en/inquiry" },
} as const;

