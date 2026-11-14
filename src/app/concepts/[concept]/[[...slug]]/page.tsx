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
  const oldPath = slug.join("/");
  const path = oldPath === "inquiry" ? "contact" : oldPath;
  if (concept !== "clarity" || !allPages.includes(path)) notFound();
  const { plan } = await searchParams;
  const query =
    path === "contact" && typeof plan === "string"
      ? `?${new URLSearchParams({ plan })}`
      : "";
  permanentRedirect(`/${path}${query}`);
}
