import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPages } from "@/lib/content";
import { ContentPage } from "@/components/pages/pages";
import { pageMetadata } from "@/lib/seo";
import { PageStructuredData } from "@/components/seo/json-ld";
import type { BlogQuery } from "@/lib/blog-catalog";
import { hasPreviewProtections } from "@/lib/release-mode";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<BlogQuery>;
};
export const dynamicParams = false;
export function generateStaticParams() {
  return allPages
    .filter(
      (path) => path && !(hasPreviewProtections && path.startsWith("legal/")),
    )
    .map((path) => ({ slug: path.split("/") }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = slug.join("/");
  if (!allPages.includes(path)) notFound();
  if (hasPreviewProtections && path.startsWith("legal/")) notFound();
  return pageMetadata(path);
}
export default async function PublicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const path = slug.join("/");
  if (!allPages.includes(path)) notFound();
  if (hasPreviewProtections && path.startsWith("legal/")) notFound();
  const query = path === "contact" || path === "blog" ? await searchParams : {};
  return (
    <>
      <PageStructuredData path={path} />
      <ContentPage
        path={path}
        plan={typeof query.plan === "string" ? query.plan : undefined}
        blogQuery={path === "blog" ? query : undefined}
      />
    </>
  );
}
