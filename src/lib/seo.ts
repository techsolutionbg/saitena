import type { Metadata, MetadataRoute } from "next";
import { allPages, articles, projects, routeTitles } from "./content";
import { plansMetadata, startPlan } from "./plans";
import { portfolioMetadata } from "./portfolio-content";
import { servicesCatalog } from "./services-catalog";
import { isIndexingEnabled, siteUrl } from "./seo-policy.mjs";

export { siteUrl };

type PageSEO = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  indexable?: boolean;
};

const studioImage = {
  image: "/images/services-studio-v1.webp",
  imageAlt: "Илюстрация на работно пространство за уеб дизайн — Saitena",
};

const pages: Record<string, PageSEO> = {
  "": {
    title: "Изработка на сайтове на абонамент с поддръжка | Saitena",
    description: `Фирмен сайт на абонамент от ${startPlan.price} €/месец без първоначална такса. Saitena съчетава дизайн, изработка, хостинг и техническа поддръжка в една услуга.`,
    ...studioImage,
  },
  services: {
    title: "Изработка и поддръжка на уебсайтове | Saitena",
    description:
      "Какво включва услугата на Saitena: изработка на адаптивен уебсайт, хостинг и домейн, техническа поддръжка, сигурност и основа за SEO видимост.",
    ...studioImage,
  },
  prices: { ...plansMetadata, ...studioImage },
  about: {
    title: "За Saitena — подход към изработката на сайтове",
    description:
      "Запознайте се с подхода на Saitena към сайтовете на абонамент: ясен обхват, дизайн според бизнеса и постоянна техническа грижа след изработката.",
    ...studioImage,
  },
  portfolio: {
    ...portfolioMetadata,
    image: "/images/portfolio-hero-work-v1.webp",
    imageAlt: "Илюстрация на примерни уеб дизайни от Saitena",
  },
  blog: {
    title: "Блог за сайтове, съдържание и поддръжка | Saitena",
    description:
      "Разгледайте примерни редакционни материали за сайтовете на абонамент и подготовката на съдържание. Практични въпроси преди изработката на фирмен сайт.",
    image: "/images/blog-hero-studio-v1.webp",
    imageAlt: "Илюстрация към блога за уебсайтове на Saitena",
  },
  faq: {
    title: "Въпроси за сайтовете на абонамент | Saitena",
    description:
      "Отговори за изработката на сайт на абонамент: цени и планове, включена поддръжка, домейн, хостинг и условия. Вижте потвърдената информация за услугата.",
    ...studioImage,
  },
  contact: {
    title: "Контакти и запитване за изработка на сайт | Saitena",
    description:
      "Обсъдете фирмения си сайт със Saitena. Изпратете запитване за изработка, абонаментен план или поддръжка и опишете нуждите на Вашия бизнес.",
    ...studioImage,
  },
  sitemap: {
    title: "Карта на сайта — страници и полезни връзки | Saitena",
    description:
      "Намерете услугите, цените, примерните дизайни, въпросите и контактите на Saitena. Преглед на основните страници и редакционните материали.",
    ...studioImage,
  },
};

const legalDescriptions: Record<string, string> = {
  "legal/privacy":
    "Структурен макет на информацията за поверителност: обработване на запитвания, лични данни, права и контакти. Очаква окончателен преглед и одобрение.",
  "legal/cookies":
    "Структурен макет на политиката за бисквитки и външни услуги на Saitena. Текстът очаква опис на използваните технологии и окончателно одобрение.",
  "legal/terms":
    "Структурен макет на условията за ползване на сайта на Saitena: предназначение, съдържание, права и запитвания. Не е окончателен правен документ.",
  "legal/subscription-terms":
    "Структурен макет на абонаментните условия на Saitena. Обхват, плащане, промени и прекратяване подлежат на търговски и правен преглед.",
};

export function getPageSEO(path: string): PageSEO | undefined {
  if (!allPages.includes(path)) return undefined;
  if (pages[path]) return pages[path];
  const project = projects.find((p) => path === `portfolio/${p.slug}`);
  if (project)
    return {
      ...pages.portfolio,
      title: `${project.name} — примерен уеб дизайн | Saitena`,
      description: `Концептуален дизайн, не клиентски проект. ${project.description}`,
    };
  const article = articles.find((a) => path === `blog/${a.slug}`);
  if (article)
    return {
      title: `${article.title} | Saitena`,
      description: article.description,
      ...studioImage,
      // These are explicitly labelled editorial samples, without approved bylines/dates.
      indexable: false,
    };
  return {
    title: `${routeTitles[path]} — макет | Saitena`,
    description: legalDescriptions[path],
    ...studioImage,
    indexable: false,
  };
}

export function canonicalUrl(path: string) {
  return path ? `${siteUrl}/${path}` : siteUrl;
}

export function robotsMetadata(indexable = true): Metadata["robots"] {
  const enabled = isIndexingEnabled();
  return {
    index: enabled && indexable,
    follow: enabled,
    ...(!enabled ? { noarchive: true } : {}),
    googleBot: {
      index: enabled && indexable,
      follow: enabled,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

export function pageMetadata(path: string): Metadata {
  const page = getPageSEO(path);
  if (!page) throw new Error(`Unknown SEO route: ${path}`);
  const url = canonicalUrl(path);
  const image = { url: canonicalUrl(page.image.slice(1)), alt: page.imageAlt };
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: url },
    robots: robotsMetadata(page.indexable),
    openGraph: {
      type: "website",
      locale: "bg_BG",
      siteName: "Saitena",
      url,
      title: page.title,
      description: page.description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [image],
    },
  };
}

/** Only canonical, approved-content URLs; no fabricated modification dates. */
export function publicSitemap(): MetadataRoute.Sitemap {
  if (!isIndexingEnabled()) return [];
  return allPages
    .filter((path) => getPageSEO(path)?.indexable !== false)
    .map((path) => ({ url: canonicalUrl(path) }));
}

export function publicRobots(): MetadataRoute.Robots {
  if (!isIndexingEnabled()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/concepts/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

export function pageStructuredData(path: string) {
  const page = getPageSEO(path);
  if (!page || path.startsWith("legal/")) return undefined;
  const organization = {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Saitena",
    url: siteUrl,
  };
  const website = {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Saitena",
    url: siteUrl,
    inLanguage: "bg",
    publisher: { "@id": organization["@id"] },
  };
  const graph: object[] = [organization, website];
  // Existing visible breadcrumbs on detail pages; do not invent a visual trail.
  const parent = path.startsWith("portfolio/")
    ? "portfolio"
    : path.startsWith("blog/")
      ? "blog"
      : undefined;
  if (parent)
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: parent === "blog" ? "Блог" : "Портфолио",
          item: canonicalUrl(parent),
        },
        {
          "@type": "ListItem",
          position: 2,
          name:
            articles.find((a) => path === `blog/${a.slug}`)?.title ??
            projects.find((p) => path === `portfolio/${p.slug}`)?.name,
          item: canonicalUrl(path),
        },
      ],
    });
  if (path === "services") {
    for (const service of servicesCatalog)
      graph.push({
        "@type": "Service",
        "@id": `${siteUrl}/services#${service.id}`,
        name: service.title,
        description: service.description,
        url: `${siteUrl}/services#service-${service.id}-title`,
        provider: { "@id": organization["@id"] },
      });
  }
  // BlogPosting is deliberately absent: current samples are not approved publications.
  return { "@context": "https://schema.org", "@graph": graph };
}

export function serializeJsonLd(value: object) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
