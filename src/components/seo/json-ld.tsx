import { pageStructuredData, serializeJsonLd } from "@/lib/seo";

export function PageStructuredData({ path }: { path: string }) {
  const data = pageStructuredData(path);
  return data ? (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  ) : null;
}
