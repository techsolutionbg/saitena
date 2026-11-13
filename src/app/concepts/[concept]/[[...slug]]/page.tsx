import { notFound, permanentRedirect } from "next/navigation";
import { allPages } from "@/lib/content";

type Props = {
  params: Promise<{ concept: string; slug?: string[] }>;
  searchParams: Promise<{ plan?: string | string[] }>;
};
export default async function PreviousConceptUrl({
  params,
  searchParams,
}: Props) {
  const { concept, slug = [] } = await params;
  const path = slug.join("/");
  if (concept !== "clarity" || !allPages.includes(path)) notFound();
  const { plan } = await searchParams;
  const query =
    path === "inquiry" && typeof plan === "string"
      ? `?${new URLSearchParams({ plan })}`
      : "";
  permanentRedirect(`/${path}${query}`);
}

