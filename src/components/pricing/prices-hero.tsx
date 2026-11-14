import Image from "next/image";
import Link from "next/link";
import { Arrow, Icon } from "@/components/ui/icons";
import styles from "./prices-hero.module.css";

export function PricesHero() {
  return (
    <section className={styles.hero} aria-labelledby="prices-title">
      <div className={`wrap ${styles.inner}`}>
        <header className={styles.copy}>
          <span className={styles.eyebrow}>
            <Icon name="wallet" /> Цени и абонаментни планове
          </span>
          <h1 id="prices-title">
            <span>Цени</span> за сайтове на абонамент с ясни планове и условия
          </h1>
          <p>
            Изберете подходящ план според нуждите на Вашия бизнес. Получавате
            изработен уебсайт, хостинг, техническа поддръжка и грижа за
            сигурността, без първоначална такса за разработка.
          </p>
          <div className={styles.actions}>
            <a className="button" href="#subscription-plans-title">
              Разгледайте плановете <Arrow />
            </a>
            <Link className="button button-secondary" href="/contact">
              <Icon name="message" /> Обсъдете Вашия проект
            </Link>
          </div>
          <ul className={styles.benefits}>
            <li>
              <Icon name="layers" />
              <span>Защита на личните данни</span>
            </li>
            <li>
              <Icon name="shield" />
              <span>Включена поддръжка и сигурност</span>
            </li>
            <li>
              <Icon name="growth" />
              <span>
                Гъвкавост{" "}
                <span className={styles.detail}>Възможност за развитие</span>
              </span>
            </li>
          </ul>
        </header>
        <div className={styles.artwork}>
          <Image
            src="/images/prices-hero-v1.webp"
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
