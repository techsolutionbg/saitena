import type { IconName } from "@/components/ui/icons";
export type NavigationItem = { href: string; label: string; icon: IconName };

export const mainNavigation: NavigationItem[] = [
  { href: "/about", label: "За нас", icon: "users" },
  { href: "/services", label: "Услуги", icon: "monitor" },
  { href: "/portfolio", label: "Портфолио", icon: "grid" },
  { href: "/prices", label: "Цени", icon: "wallet" },
  { href: "/faq", label: "ЧЗВ", icon: "help" },
  { href: "/blog", label: "Блог", icon: "book" },
  { href: "/contact", label: "Контакти", icon: "mail" },
];
export const legalNavigation: NavigationItem[] = [
  { href: "/legal/privacy", label: "Поверителност", icon: "shield" },
  { href: "/legal/cookies", label: "Бисквитки", icon: "cookie" },
  { href: "/legal/terms", label: "Условия за ползване", icon: "file" },
  {
    href: "/legal/subscription-terms",
    label: "Абонаментни условия",
    icon: "layers",
  },
];
