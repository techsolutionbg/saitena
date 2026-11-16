import type { NextConfig } from "next";

const releaseMode = process.env.NEXT_PUBLIC_RELEASE_MODE ?? "public";
if (!["public", "private-preview", "public-demo"].includes(releaseMode))
  throw new Error("Unknown release mode");
const preview = releaseMode !== "public";
if (
  preview &&
  (process.env.NEXT_PUBLIC_INDEXING_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_AUTH_ENABLED === "true")
)
  throw new Error("Preview builds require auth and indexing disabled");

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
    if (!preview && process.env.NEXT_PUBLIC_INDEXING_ENABLED === "true")
      return [];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          ...(preview
            ? [{ key: "Cache-Control", value: "private, no-store" }]
            : []),
        ],
      },
    ];
  },
};
export default config;
