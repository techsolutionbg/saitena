import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  allPages,
  articles,
  base,
  conceptKeys,
  concepts,
  isConcept,
  projects,
  routeTitles,
} from "@/lib/content";
import { Header, ReviewBar } from "@/components/interactive";
import { Footer, Home } from "@/components/site";
import { ContentPage } from "@/components/pages";

type Props = {
  params: Promise<{ concept: string; slug?: string[] }>;
  searchParams: Promise<{ plan?: string | string[] }>;
};
export const dynamicParams = false;
export function generateStaticParams() {
  return conceptKeys.flatMap((concept) =>
    allPages.map((path) => ({ concept, slug: path ? path.split("/") : [] })),
  );
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { concept, slug = [] } = await params;
  if (!isConcept(concept)) return {};
  const path = slug.join("/");
  const title =
    routeTitles[path] ??
    projects.find((p) => path === `portfolio/${p.slug}`)?.name ??
    articles.find((a) => path === `blog/${a.slug}`)?.title;
  return {
    title: `${title ?? "Страница"} · ${concepts[concept].name}`,
    description: `${title}. Визуален прототип на Saitena — ${concepts[concept].name}.`,
  };
}
export default async function ConceptPage({ params, searchParams }: Props) {
  const { concept, slug = [] } = await params;
  const path = slug.join("/");
  if (!isConcept(concept) || !allPages.includes(path)) notFound();
  const query = path === "zapitvane" ? await searchParams : {};
  const plan = typeof query.plan === "string" ? query.plan : undefined;
  return (
    <div className={`site theme-${concept}`}>
      <ReviewBar concept={concept} />
      <Header concept={concept} />
      <main id="main">
        {path ? (
          <ContentPage concept={concept} path={path} plan={plan} />
        ) : (
          <Home concept={concept} />
        )}
      </main>
      <Footer concept={concept} />
      <div className="prototype-end">
        <Link href="/">
          ← Обратно към трите концепции и решенията за одобрение
        </Link>
        <Link href={`/preview/${concept}`}>Мобилен преглед ↗</Link>
      </div>
    </div>
  );
}
