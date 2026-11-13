import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/lora/400.css";
import "@fontsource/lora/500.css";
import "@fontsource/lora/400-italic.css";
import "@fontsource/sofia-sans/600.css";
import "@fontsource/sofia-sans/700.css";
import "@fontsource/sofia-sans/800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Saitena — дизайн и структура / Етап 1",
    template: "%s | Saitena · Дизайн преглед",
  },
  description:
    "Три визуални концепции и предложена структура за Saitena. Локални прототипи за одобрение.",
  robots: { index: false, follow: false, nocache: true },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bg">
      <body>
        <a className="skip-link" href="#main">
          Към съдържанието
        </a>
        {children}
      </body>
    </html>
  );
}
