import Image from "next/image";
import Link from "next/link";
import { Arrow, Check, Icon } from "@/components/ui/icons";
import styles from "./portfolio-cta.module.css";

export function PortfolioCTA() {
  return (
    <section className={styles.section} aria-labelledby="portfolio-cta-title">
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.artwork}>
          <Image
            src="/images/portfolio-cta-developer-v1.webp"
            alt=""
            width={960}
            height={960}
            sizes="(max-width: 760px) 320px, (max-width: 1100px) 40vw, 500px"
            className={styles.illustration}
          />
        </div>
        <div className={styles.content}>
          <span className={styles.eyebrow}>Следващата стъпка</span>
          <h2 id="portfolio-cta-title">Готови ли сте за своя нов сайт?</h2>
          <p>
            Разгледахте нашите проекти? Нека обсъдим какъв сайт е подходящ за
            Вашия бизнес. Ще Ви помогнем да изберете решение според услугите,
            които предлагате, необходимите функционалности и бюджета Ви.
          </p>
          <ul className={styles.benefits}>
            <li>
              <span className={styles.icon}>
                <Icon name="monitor" />
              </span>
              Консултация
            </li>
            <li>
              <span className={styles.icon}>
                <Icon name="file" />
              </span>
              Ясна оферта
            </li>
            <li>
              <span className={styles.icon}>
                <Check />
              </span>
              Без първоначална такса за изработка
            </li>
          </ul>
          <div className={styles.actions}>
            <Link className="button" href="/contact">
              Обсъдете Вашия сайт <Arrow />
            </Link>
            <Link className="button button-secondary" href="/prices">
              Разгледайте плановете <Arrow />
            </Link>
          </div>
          <p className={styles.note}>
            <Icon name="shield" />
            <span>
              От идеята до готовия уебсайт — с включени хостинг, техническа
              поддръжка и грижа за сигурността.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
