import Image from "next/image";
import { Arrow, Icon } from "@/components/ui/icons";
import { blogTopics } from "@/lib/blog-hero";
import styles from "./blog-hero.module.css";

export function BlogHero() {
  return (
    <section className={styles.hero} aria-labelledby="blog-title">
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.top}>
          <header className={styles.copy}>
            <span className={styles.eyebrow}>
              <Icon name="book" />
              Блог на Saitena
            </span>
            <h1 id="blog-title">
              Полезни статии, съвети и идеи за <span>Вашия онлайн бизнес</span>
            </h1>
            <p>
              Практични ръководства, актуални тенденции и полезни съвети за
              изработка на сайтове, SEO, хостинг, сигурност и развитие на
              бизнеса в интернет.
            </p>
            <div className={styles.actions}>
              <a className="button" href="#blog-articles">
                <Icon name="book" />
                <span>Разгледайте статиите</span>
                <Arrow />
              </a>
              <a
                className={`button button-secondary ${styles.secondary}`}
                href="#blog-articles"
              >
                <Icon name="search" />
                <span>Всички публикации</span>
              </a>
            </div>
          </header>
          <div className={styles.artwork}>
            <Image
              src="/images/blog-hero-studio-v1.webp"
              alt=""
              width={1200}
              height={1000}
              sizes="(max-width: 900px) 90vw, (max-width: 1600px) 50vw, 760px"
              preload
              className={styles.image}
            />
          </div>
        </div>
        <ul className={styles.topics} aria-label="Теми в блога">
          {blogTopics.map((topic) => (
            <li key={topic.label} data-accent={topic.accent}>
              <Icon name={topic.icon} />
              <span>{topic.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
