import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  async redirects() {
    const routes = [
      ["uslugi", "services"],
      ["planove", "plans"],
      ["za-nas", "about"],
      ["kontakti", "contact"],
      ["vuprosi", "faq"],
      ["zapitvane", "inquiry"],
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
    return routes.flatMap(([oldPath, newPath]) => [
      { source: `/${oldPath}`, destination: `/${newPath}`, permanent: true },
      {
        source: `/concepts/clarity/${oldPath}`,
        destination: `/${newPath}`,
        permanent: true,
      },
    ]);
  },
  // This isolated preview has no connection to the frozen hosting platform.
  async headers() {
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
