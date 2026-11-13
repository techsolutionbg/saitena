import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="not-found">
      <span>404 / SAITENA</span>
      <h1>Тази страница не е част от прегледа.</h1>
      <p>Изберете една от трите дизайн концепции.</p>
      <Link className="button" href="/">
        Към концепциите →
      </Link>
    </main>
  );
}
