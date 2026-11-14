import Image from "next/image";
import Link from "next/link";
import { Arrow, Icon } from "@/components/ui/icons";
import { servicesHeroCards } from "@/lib/services-hero";
import styles from "./services-hero.module.css";

export function ServicesHero() {
  return (
    <section className={styles.hero} aria-labelledby="services-title">
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.top}>
          <header className={styles.copy}>
            <span className={styles.eyebrow}>
              <Icon name="layers" />
              Нашите услуги
            </span>
            <h1 id="services-title">
              Комплексни решения за Вашето <span>онлайн присъствие</span>
            </h1>
            <p>
              От изработка на модерен уебсайт до неговата поддръжка и развитие.
              Предлагаме всички услуги, от които се нуждаете, за да изградите и
              развивате успешно Вашия онлайн бизнес.
            </p>
            <div className={styles.actions}>
              <a className="button" href="#services-overview">
                Разгледайте услугите <Arrow />
              </a>
              <Link
                className={`button button-secondary ${styles.secondary}`}
                href="/contact"
              >
                <Icon name="message" />
                Обсъдете Вашите нужди
              </Link>
            </div>
          </header>
          <div className={styles.visual}>
            <Image
              src="/images/services-studio-v1.webp"
              alt=""
              fill
              preload
              sizes="(max-width: 900px) 100vw, 65vw"
              className={styles.image}
            />
          </div>
        </div>
        <div className={styles.cards}>
          {servicesHeroCards.map((card) => (
            <article
              className={styles.card}
              data-accent={card.id}
              key={card.id}
            >
              <Icon name={card.icon} />
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
