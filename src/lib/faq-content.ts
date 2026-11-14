import "server-only";
import editorial from "@/content/faq-editorial.json";
import type { FAQCategory, FAQItem } from "./faq";

export const faqCategories: readonly FAQCategory[] = [
  { id: "general", label: "Общи въпроси", title: "Общи въпроси" },
  {
    id: "pricing",
    label: "Цени и планове",
    title: "Цени и абонаментни планове",
  },
  { id: "design", label: "Изработка", title: "Изработка и дизайн" },
  { id: "maintenance", label: "Поддръжка", title: "Поддръжка и промени" },
  {
    id: "hosting",
    label: "Домейни и имейли",
    title: "Домейни, хостинг и имейли",
  },
  {
    id: "visibility",
    label: "SEO и Google",
    title: "Google, SEO и онлайн видимост",
  },
  {
    id: "contract",
    label: "Договори",
    title: "Договор, собственост и прекратяване",
  },
  { id: "security", label: "Сигурност", title: "Сигурност и лични данни" },
];

const contextualLinks: Record<number, NonNullable<FAQItem["relatedLink"]>> = {
  4: { href: "/services", label: "Какво включва услугата" },
  8: { href: "/plans", label: "Разгледайте абонаментните планове" },
  16: { href: "/inquiry", label: "Опишете вашия проект" },
  25: { href: "/portfolio", label: "Разгледайте примерни проекти" },
};

// Only approved entries cross the server/client boundary. Draft answers stay here.
export const faq: readonly FAQItem[] = editorial
  .filter((item) => item.status === "published")
  .map((item) => ({
    id: item.id,
    question: item.question,
    answer: item.answer,
    categoryId: item.categoryId,
    relatedLink: contextualLinks[item.number],
  }));

export const faqPublicationCounts = {
  published: faq.length,
  pending: editorial.filter((item) => item.status === "pending").length,
};

export const faqMetadata = {
  title: "Често задавани въпроси за изработка на сайт на абонамент | Saitena",
  description:
    "Всичко важно за цените, изработката, поддръжката и условията на Saitena — обяснено ясно и разбираемо.",
};
