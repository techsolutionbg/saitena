import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Страницата не е намерена | Saitena" },
  description:
    "Този адрес не води до страница на Saitena. Продължете към началната страница, услугите или контактите.",
  robots: { index: false, follow: false },
};
export default function NotFound() {
  return (
    <section className="not-found wrap">
      <span>404 / SAITENA</span>
      <h1>Тази страница не е намерена.</h1>
      <p>Продължете към началната страница на Saitena.</p>
      <Link className="button" href="/">
        Към началната →
      </Link>
    </section>
  );
}
