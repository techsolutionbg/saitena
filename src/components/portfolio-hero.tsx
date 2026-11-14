import Link from "next/link";
import Image from "next/image";
import { portfolioIntro } from "@/lib/portfolio-content";
import { Arrow } from "./icons";
import styles from "./portfolio-hero.module.css";

export function PortfolioHero() {
  return (
    <section className={styles.hero} aria-labelledby="portfolio-title">
      <Image
        src="/images/portfolio-hero-v1.webp"
        alt=""
        fill
        sizes="100vw"
        preload
        className={styles.background}
      />
      <div className={`wrap ${styles.inner}`}>
        <header className={styles.copy}>
          <h1 id="portfolio-title">{portfolioIntro.title}</h1>
          <p>{portfolioIntro.description}</p>
          <div className={styles.actions}>
            <a className="button" href="#portfolio-projects">
              Разгледайте проектите <Arrow />
            </a>
            <Link className="button button-secondary" href="/contact">
              Обсъдете Вашия сайт <Arrow />
            </Link>
          </div>
        </header>
      </div>
    </section>
  );
}
