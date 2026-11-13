import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { base, conceptKeys, concepts, isConcept } from "@/lib/content";

export const metadata: Metadata = { title: "Мобилен преглед" };
export function generateStaticParams() {
  return conceptKeys.map((concept) => ({ concept }));
}
export const dynamicParams = false;
export default async function MobilePreview({
  params,
}: {
  params: Promise<{ concept: string }>;
}) {
  const { concept } = await params;
  if (!isConcept(concept)) notFound();
  return (
    <div className="device-preview">
      <header>
        <Link href="/">← Всички концепции</Link>
        <span>МОБИЛЕН ПРЕГЛЕД / 390 PX</span>
        <Link href={base(concept)}>Отвори целия сайт ↗</Link>
      </header>
      <main id="main">
        <h1>{concepts[concept].name}</h1>
        <nav aria-label="Избор на мобилна концепция">
          {conceptKeys.map((key) => (
            <Link
              href={`/preview/${key}`}
              key={key}
              aria-current={key === concept ? "page" : undefined}
            >
              {concepts[key].number} {concepts[key].name}
            </Link>
          ))}
        </nav>
        <div className="device-frame">
          <div className="device-bar">
            <span>9:41</span>
            <b>● ● ▰</b>
          </div>
          <iframe
            title={`Мобилен прототип — ${concepts[concept].name}`}
            src={base(concept)}
          />
        </div>
        <p>
          Реален адаптивен сайт в рамка 390 × 760 px. Менюто, страниците и
          визуалните форми могат да се разглеждат.
        </p>
      </main>
    </div>
  );
}
