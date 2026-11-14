import type { IconName } from "@/components/icons";
export type NavigationItem = { href: string; label: string; icon: IconName };

export const mainNavigation: NavigationItem[] = [
  { href: "/about", label: "За нас", icon: "users" },
  { href: "/services", label: "Услуги", icon: "monitor" },
  { href: "/portfolio", label: "Портфолио", icon: "grid" },
  { href: "/plans", label: "Планове", icon: "wallet" },
  { href: "/contact", label: "Контакти", icon: "mail" },
  { href: "/faq", label: "Често задавани въпроси", icon: "help" },
];
export const mobileNavigation: NavigationItem[] = [
  { href: "/", label: "Начална страница", icon: "home" },
  ...mainNavigation.map((item) =>
    item.href === "/services"
      ? { ...item, label: "Сайтове на абонамент" }
      : item,
  ),
  { href: "/blog", label: "Блог", icon: "book" },
  { href: "/sitemap", label: "Карта на сайта", icon: "sitemap" },
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

