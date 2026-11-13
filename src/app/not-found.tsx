import Link from "next/link";
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
