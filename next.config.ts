import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  async redirects() {
    const authRedirects =
      process.env.NODE_ENV === "production" &&
      process.env.NEXT_PUBLIC_AUTH_ENABLED !== "true"
        ? [
            "login",
            "register",
            "forgot-password",
            "reset-password",
            "verify-email",
          ].map((path) => ({
            source: `/${path}`,
            destination: "/",
            permanent: false,
          }))
        : [];
    const routes = [
      ["uslugi", "services"],
      ["planove", "prices"],
      ["plans", "prices"],
      ["za-nas", "about"],
      ["kontakti", "contact"],
      ["vuprosi", "faq"],
      ["zapitvane", "contact"],
      ["inquiry", "contact"],
      ["karta-na-saita", "sitemap"],
      ["pravni/poveritelnost", "legal/privacy"],
      ["pravni/biskvitki", "legal/cookies"],
      ["pravni/uslovia", "legal/terms"],
      ["pravni/abonamentni-uslovia", "legal/subscription-terms"],
      ["blog/kakvo-e-sait-na-abonament", "blog/what-is-a-website-subscription"],
      [
        "blog/kak-da-podgotvite-sadarzhanie",
        "blog/how-to-prepare-website-content",
      ],
    ];
    return [
      ...authRedirects,
      ...routes.flatMap(([oldPath, newPath]) => [
        { source: `/${oldPath}`, destination: `/${newPath}`, permanent: true },
        {
          source: `/concepts/clarity/${oldPath}`,
          destination: `/${newPath}`,
          permanent: true,
        },
      ]),
    ];
  },
  // This isolated preview has no connection to the frozen hosting platform.
  async headers() {
    if (process.env.NEXT_PUBLIC_INDEXING_ENABLED === "true") return [];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};
export default config;
