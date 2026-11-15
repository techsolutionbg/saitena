import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return process.env.NEXT_PUBLIC_INDEXING_ENABLED === "true"
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
