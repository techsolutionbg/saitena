export type PlanId = "START" | "BUSINESS" | "PREMIUM";

export type PlanFeatureId =
  | "setup"
  | "responsive"
  | "design"
  | "pages"
  | "contactPage"
  | "legalPages"
  | "htmlSitemap"
  | "blog"
  | "portfolio"
  | "extraLanguage"
  | "contentStructure"
  | "hosting"
  | "ssl"
  | "backups"
  | "monitoring"
  | "email"
  | "domain"
  | "seo"
  | "analytics"
  | "sitemaps"
  | "monthlyChanges"
  | "updates"
  | "contactForm"
  | "maps"
  | "reports"
  | "hostingSecurity"
  | "maintenance"
  | "contactMaps"
  | "inheritance"
  | "publicationsPortfolio";

export interface PlanHighlight {
  id: PlanFeatureId;
  label: string;
}

export interface SubscriptionPlan {
  id: PlanId;
  price: number;
  proposed: boolean;
  featured: boolean;
  eyebrow: string;
  description: string;
  pages: number;
  monthlyHours: number;
  emailGb: number;
  seo: string;
  design: string;
  reports: string;
  publications: boolean;
  extraLanguage: boolean;
}

export const plans: readonly SubscriptionPlan[] = [
  {
    id: "START",
    price: 30,
    proposed: false,
    featured: false,
    eyebrow: "Надеждно начало",
    description:
      "Подходящ за малки фирми, специалисти и хора, които искат защитен, красив, бърз и удобен сайт, представящ техните услуги.",
    pages: 6,
    monthlyHours: 2,
    emailGb: 1,
    seo: "Базова SEO и GEO оптимизация",
    design: "Красив адаптивен дизайн",
    reports: "Google Analytics 4 и Search Console",
    publications: false,
    extraLanguage: false,
  },
  {
    id: "BUSINESS",
    price: 50,
    proposed: true,
    featured: true,
    eyebrow: "За развиващ се бизнес",
    description:
      "За фирми, които искат да представят повече услуги, да достигат до нови клиенти и да развиват онлайн присъствието си.",
    pages: 12,
    monthlyHours: 4,
    emailGb: 5,
    seo: "Разширена първоначална SEO и GEO оптимизация",
    design: "По-богати дизайнерски секции",
    reports: "По-подробни статистически отчети",
    publications: true,
    extraLanguage: false,
  },
  {
    id: "PREMIUM",
    price: 70,
    proposed: true,
    featured: false,
    eyebrow: "Повече възможности за бизнеса",
    description:
      "За бизнеси, които се нуждаят от по-голям сайт, допълнителни функционалности и повече свобода за развитие.",
    pages: 20,
    monthlyHours: 6,
    emailGb: 10,
    seo: "Разширена SEO и GEO структура",
    design: "По-индивидуални дизайнерски компоненти",
    reports:
      "Допълнителен анализ на посещенията и поведението на потребителите",
    publications: true,
    extraLanguage: true,
  },
];

export const customPlanValue = "Индивидуална оферта";
export const undecidedPlanValue = "Не съм сигурен/а";
export const planInquiryHref = (plan: SubscriptionPlan) =>
  `/inquiry?plan=${plan.id}`;
export const priceLabel = (plan: SubscriptionPlan) => `${plan.price} €`;
export const monthlyTimeLabel = (plan: SubscriptionPlan) =>
  `${plan.monthlyHours} ${plan.monthlyHours === 1 ? "час" : "часа"}`;

export function planHighlightItems(
  plan: SubscriptionPlan,
): readonly PlanHighlight[] {
  const limits: PlanHighlight[] = [
    { id: "pages", label: `До ${plan.pages} основни страници` },
    {
      id: "monthlyChanges",
      label: `До ${monthlyTimeLabel(plan)} месечни промени`,
    },
    { id: "email", label: `${plan.emailGb} GB общо пространство за имейли` },
  ];
  if (plan.id === "START")
    return [
      { id: "setup", label: "Изработка без първоначална такса" },
      ...limits,
      { id: "hostingSecurity", label: "Хостинг и SSL сертификат" },
      { id: "maintenance", label: "Поддръжка, архиви и мониторинг" },
      { id: "seo", label: plan.seo },
      { id: "contactMaps", label: "Контактна форма и Google Maps" },
    ];
  return [
    {
      id: "inheritance",
      label: `Всичко от ${plan.id === "BUSINESS" ? "START" : "BUSINESS"}`,
    },
    ...limits,
    plan.extraLanguage
      ? { id: "extraLanguage", label: "Допълнителна езикова версия" }
      : {
          id: "publicationsPortfolio",
          label: "Блог и разширена галерия или портфолио",
        },
    { id: "design", label: plan.design },
    { id: "seo", label: plan.seo },
    { id: "reports", label: plan.reports },
  ];
}

export function planHighlights(plan: SubscriptionPlan): readonly string[] {
  return planHighlightItems(plan).map((item) => item.label);
}

type ComparisonValue = boolean | string;
interface ComparisonFeature {
  id: PlanFeatureId;
  label: string;
  value: (plan: SubscriptionPlan) => ComparisonValue;
}
interface ComparisonGroup {
  title: string;
  features: readonly ComparisonFeature[];
}

export const comparisonGroups: readonly ComparisonGroup[] = [
  {
    title: "Изработка и дизайн",
    features: [
      {
        id: "setup",
        label: "Изработка без първоначална такса",
        value: () => true,
      },
      {
        id: "responsive",
        label: "Адаптивност за телефон, таблет и компютър",
        value: () => true,
      },
      {
        id: "design",
        label: "Дизайн и визуални компоненти",
        value: (p) => p.design,
      },
    ],
  },
  {
    title: "Страници и съдържание",
    features: [
      { id: "pages", label: "Основни страници", value: (p) => `До ${p.pages}` },
      {
        id: "contactPage",
        label: "Контактна страница извън лимита",
        value: () => true,
      },
      {
        id: "legalPages",
        label: "Необходими правни страници извън лимита",
        value: () => true,
      },
      {
        id: "htmlSitemap",
        label: "HTML sitemap извън лимита",
        value: () => true,
      },
      {
        id: "blog",
        label: "Блог или секция за публикации",
        value: (p) => p.publications,
      },
      {
        id: "portfolio",
        label: "Разширена галерия или портфолио",
        value: (p) => p.publications,
      },
      {
        id: "extraLanguage",
        label: "Допълнителна езикова версия",
        value: (p) => p.extraLanguage,
      },
      {
        id: "contentStructure",
        label: "Организация на съдържанието",
        value: (p) =>
          p.id === "PREMIUM"
            ? "По-голяма гъвкавост"
            : "Според структурата на сайта",
      },
    ],
  },
  {
    title: "Хостинг и сигурност",
    features: [
      { id: "hosting", label: "Хостинг", value: () => true },
      { id: "ssl", label: "SSL сертификат", value: () => true },
      { id: "backups", label: "Автоматични архиви", value: () => true },
      { id: "monitoring", label: "Мониторинг", value: () => true },
    ],
  },
  {
    title: "Имейли и домейни",
    features: [
      {
        id: "email",
        label: "Общо пространство за фирмени имейли",
        value: (p) => `${p.emailGb} GB`,
      },
      { id: "domain", label: "Домейн", value: () => "При договорени условия" },
    ],
  },
  {
    title: "SEO и GEO",
    features: [
      { id: "seo", label: "SEO и GEO оптимизация", value: (p) => p.seo },
      {
        id: "analytics",
        label: "Google Analytics 4 и Search Console",
        value: () => true,
      },
      {
        id: "sitemaps",
        label: "robots.txt, XML и HTML sitemap",
        value: () => true,
      },
    ],
  },
  {
    title: "Поддръжка и промени",
    features: [
      {
        id: "monthlyChanges",
        label: "Месечно време за промени и добавки",
        value: (p) => `До ${monthlyTimeLabel(p)}`,
      },
      {
        id: "updates",
        label: "Техническа поддръжка и актуализации",
        value: () => true,
      },
    ],
  },
  {
    title: "Допълнителни възможности",
    features: [
      {
        id: "contactForm",
        label: "Контактна форма с имейл известяване",
        value: () => true,
      },
      { id: "maps", label: "Google Maps", value: () => true },
      { id: "reports", label: "Статистика и анализ", value: (p) => p.reports },
    ],
  },
];

// Keep the service overview concise, with quantities taken from the same plan data.
export const startPlan = plans[0];
export const startFeatures = [
  `До ${startPlan.pages} основни страници`,
  "Контакти, правни страници и HTML sitemap извън лимита",
  "Хостинг и SSL; домейн при договорени условия",
  `${startPlan.emailGb} GB общо пространство за имейли`,
  `До ${monthlyTimeLabel(startPlan)} месечно за промени и добавки`,
  "Техническа поддръжка, актуализации, архиви и мониторинг",
  startPlan.seo,
  "Google Analytics 4 и Search Console",
  "Контактна форма с имейл известяване и Google Maps",
  "robots.txt, XML sitemap и HTML sitemap",
];

export const inquiryPlanOptions = [
  { value: undecidedPlanValue, label: undecidedPlanValue },
  ...plans.map((plan) => ({
    value: plan.id,
    label: `${plan.id}${plan.proposed ? " — предложен план" : ""}`,
  })),
  { value: customPlanValue, label: customPlanValue },
];

export function normalizeInquiryPlan(value: string): string {
  const legacy =
    value === "MEDIUM" || value === "MEDIUM (концепция)"
      ? "BUSINESS"
      : value === "PREMIUM (концепция)"
        ? "PREMIUM"
        : value;
  return inquiryPlanOptions.some((option) => option.value === legacy)
    ? legacy
    : undecidedPlanValue;
}

export const plansMetadata = {
  title: "Сайтове на абонамент – планове и цени | Saitena",
  description:
    "Разгледайте плановете за сайтове на абонамент от Saitena. Изработка, красив дизайн, хостинг, SEO и техническа поддръжка. Изберете подходящ план!",
};
