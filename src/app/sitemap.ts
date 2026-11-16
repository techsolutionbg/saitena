import type { MetadataRoute } from "next";
import { isPreview } from "@/lib/release-mode";

export default function sitemap(): MetadataRoute.Sitemap {
  if (isPreview || process.env.NEXT_PUBLIC_INDEXING_ENABLED !== "true")
    return [];
  return ["", "/services", "/prices", "/about", "/contact", "/faq"].map(
    (path) => ({ url: `https://saitena.com${path}` }),
  );
}
