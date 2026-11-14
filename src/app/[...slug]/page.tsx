import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPages, articles, projects, routeTitles } from "@/lib/content";
import { ContentPage } from "@/components/pages";
import { faqMetadata } from "@/lib/faq-content";
import { plansMetadata } from "@/lib/plans";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ plan?: string | string[] }>;
};
export const dynamicParams = false;
export function generateStaticParams() {
  return allPages.filter(Boolean).map((path) => ({ slug: path.split("/") }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = slug.join("/");
  if (path === "plans") {
    return {
      title: { absolute: plansMetadata.title },
      description: plansMetadata.description,
      alternates: { canonical: "/plans" },
    };
  }
  if (path === "faq") {
    return {
      title: { absolute: faqMetadata.title },
      description: faqMetadata.description,
      alternates: { canonical: "/faq" },
    };
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
  const query = path === "inquiry" ? await searchParams : {};
  return (
    <ContentPage
      path={path}
      plan={typeof query.plan === "string" ? query.plan : undefined}
    />
  );
}

