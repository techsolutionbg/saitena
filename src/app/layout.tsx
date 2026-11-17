import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import "@fontsource/lora/400.css";
import "@fontsource/lora/400-italic.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { themeBootstrap } from "@/lib/theme";
import { textSizeBootstrap } from "@/lib/text-size";
import { AppearanceControls } from "@/components/appearance/appearance-controls";
import { startPlan } from "@/lib/plans";
import { FloatingCall } from "@/components/contact/floating-call";
import { isPreview, releaseMode } from "@/lib/release-mode";
import { robotsMetadata, siteUrl } from "@/lib/seo";
import "./globals.css";
import "./artwork.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Сайтове на абонамент с изработка и поддръжка | Saitena",
    template: "%s | Saitena",
  },
  description: `Сайтове на абонамент с професионален дизайн, изработка и техническа поддръжка. Разгледайте план START за ${startPlan.price} €/месец без първоначална такса.`,
  robots: robotsMetadata(),
  icons: {
    icon: [
      {
        url: isPreview ? "/brand/saitena-mark.svg" : "/media/mark-64.png",
        type: isPreview ? "image/svg+xml" : "image/png",
      },
    ],
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="bg"
      className={fontVariables}
      data-release-mode={releaseMode}
      data-theme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <script dangerouslySetInnerHTML={{ __html: textSizeBootstrap }} />
      </head>
      {/* Browser tools inject body attributes (e.g. cz-shortcut-listen) before hydration.
          Tolerate those only in development; descendants remain checked. */}
      <body suppressHydrationWarning={process.env.NODE_ENV === "development"}>
        <a className="skip-link" href="#main">
          Към съдържанието
        </a>
        <div className="site">
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </div>
        <div className="floating-theme">
          <AppearanceControls />
        </div>
        {!isPreview && <FloatingCall />}
      </body>
    </html>
  );
}
