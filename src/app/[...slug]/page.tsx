import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPages, articles, projects, routeTitles } from "@/lib/content";
import { ContentPage } from "@/components/pages/pages";
import { faqMetadata } from "@/lib/faq-content";
import { plansMetadata } from "@/lib/plans";
import { portfolioMetadata } from "@/lib/portfolio-content";
import type { BlogQuery } from "@/lib/blog-catalog";
import { isPreview } from "@/lib/release-mode";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<BlogQuery>;
};
export const dynamicParams = false;
export function generateStaticParams() {
  return allPages
    .filter((path) => path && !(isPreview && path.startsWith("legal/")))
    .map((path) => ({ slug: path.split("/") }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = slug.join("/");
  if (isPreview && path.startsWith("legal/")) notFound();
  if (path === "portfolio") {
    return {
      title: { absolute: portfolioMetadata.title },
      description: portfolioMetadata.description,
      alternates: { canonical: "/portfolio" },
    };
  }
  if (path === "prices") {
    return {
      title: { absolute: plansMetadata.title },
      description: plansMetadata.description,
      alternates: { canonical: "/prices" },
    };
  }
  if (path === "faq") {
    return {
      title: { absolute: faqMetadata.title },
      description: faqMetadata.description,
      alternates: { canonical: "/faq" },
    };
  }
  if (path === "contact") {
    return { title: "Контакти", alternates: { canonical: "/contact" } };
  }
  const title =
    routeTitles[path] ??
    projects.find((project) => path === `portfolio/${project.slug}`)?.name ??
    articles.find((article) => path === `blog/${article.slug}`)?.title;
  return {
    title: title ?? "Страница",
    description: `${title ?? "Saitena"}. Професионални сайтове на абонамент и постоянна техническа грижа.`,
  };
}
export default async function PublicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const path = slug.join("/");
  if (!allPages.includes(path)) notFound();
  if (isPreview && path.startsWith("legal/")) notFound();
  const query = path === "contact" || path === "blog" ? await searchParams : {};
  return (
    <ContentPage
      path={path}
      plan={typeof query.plan === "string" ? query.plan : undefined}
      blogQuery={path === "blog" ? query : undefined}
    />
  );
}
