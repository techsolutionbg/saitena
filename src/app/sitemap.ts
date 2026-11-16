import type { MetadataRoute } from "next";
import { hasPreviewProtections } from "@/lib/release-mode";

export default function sitemap(): MetadataRoute.Sitemap {
  if (
    hasPreviewProtections ||
    process.env.NEXT_PUBLIC_INDEXING_ENABLED !== "true"
  )
    return [];
  return ["", "/services", "/prices", "/about", "/contact", "/faq"].map(
    (path) => ({ url: `https://saitena.com${path}` }),
  );
}
