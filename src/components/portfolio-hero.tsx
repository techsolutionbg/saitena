import Link from "next/link";
import Image from "next/image";
import { portfolioIntro } from "@/lib/portfolio-content";
import { Arrow, Icon } from "./icons";
import styles from "./portfolio-hero.module.css";

export function PortfolioHero() {
  return (
    <section className={styles.hero} aria-labelledby="portfolio-title">
      <div className={`wrap ${styles.inner}`}>
        <header className={styles.copy}>
          <span className={styles.eyebrow}>Портфолио</span>
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
          <ul className={styles.benefits}>
            <li>
              <span className={styles.icon}>
                <Icon name="monitor" />
              </span>
              Реални проекти
            </li>
            <li>
              <span className={styles.icon}>
                <Icon name="layers" />
              </span>
              Съобразени с бизнеса
            </li>
            <li>
              <span className={styles.icon}>
                <Icon name="palette" />
              </span>
              Модерен уеб дизайн
            </li>
          </ul>
          <p className={styles.note}>
            <Icon name="shield" />
            <span>
              Изработка на уебсайтове с фокус върху визия, структура и добро
              потребителско изживяване.
            </span>
          </p>
        </header>
        <div className={styles.artwork}>
          <Image
            src="/images/portfolio-hero-work-v1.webp"
            alt=""
            width={1100}
            height={1100}
            sizes="(max-width: 900px) 90vw, (max-width: 1440px) 44vw, 600px"
            preload
            className={styles.illustration}
          />
        </div>
      </div>
    </section>
  );
}
