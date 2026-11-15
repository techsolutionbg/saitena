import type { MetadataRoute } from "next";
import { isPrivatePreview } from "@/lib/release-mode";
export default function robots(): MetadataRoute.Robots {
  return !isPrivatePreview &&
    process.env.NEXT_PUBLIC_INDEXING_ENABLED === "true"
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/login",
            "/register",
            "/reset-password",
            "/verify-email",
            "/concepts/",
          ],
        },
        sitemap: "https://saitena.com/sitemap.xml",
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
