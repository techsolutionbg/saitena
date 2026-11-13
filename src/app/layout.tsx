import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/lora/400.css";
import "@fontsource/lora/400-italic.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/site";
import { themeBootstrap } from "@/lib/theme";
import "./globals.css";
import "./artwork.css";

export const metadata: Metadata = {
  title: {
    default: "Saitena — професионални сайтове на абонамент",
    template: "%s | Saitena",
  },
  description:
    "Професионални сайтове на месечен абонамент. Изработка, техническа поддръжка и грижа за вашия бизнес.",
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: [{ url: "/brand/saitena-mark.svg", type: "image/svg+xml" }] },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="bg"
      data-theme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Към съдържанието
        </a>
        <div className="site">
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
