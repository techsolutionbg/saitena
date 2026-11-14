import Image from "next/image";
import Link from "next/link";
import { Arrow, Icon } from "@/components/ui/icons";
import { servicesCatalog } from "@/lib/services-catalog";
import styles from "./services-catalog.module.css";

export function ServicesCatalog() {
  return (
    <section
      id="services-overview"
      className={styles.section}
      aria-labelledby="services-catalog-title"
    >
      <div className={`wrap ${styles.inner}`}>
        <header className={styles.heading}>
          <span className={styles.eyebrow}>
            <Icon name="layers" />
            Какво предлагаме
          </span>
          <h2 id="services-catalog-title">
            Всички услуги <span>на едно място</span>
          </h2>
          <p>
            От изработката на уебсайт и неговото публикуване до техническата
            поддръжка, сигурността и последващото развитие. Предлагаме услугите,
            необходими за изграждането и поддържането на Вашето онлайн
            присъствие.
          </p>
        </header>
        <div className={styles.grid}>
          {servicesCatalog.map((service) => (
            <Link
              href={service.href}
              className={styles.card}
              data-accent={service.accent}
              key={service.id}
              aria-labelledby={`service-${service.id}-title`}
            >
              <Image
                src={`/images/services-${service.id}-v1.webp`}
                alt=""
                width={320}
                height={320}
                sizes="(max-width: 480px) 104px, (max-width: 1200px) 108px, 180px"
                className={styles.artwork}
              />
              <div className={styles.copy}>
                <h3 id={`service-${service.id}-title`}>{service.title}</h3>
                <p>{service.description}</p>
              </div>
              <span className={styles.arrow} aria-hidden="true">
                <Arrow />
              </span>
            </Link>
          ))}
        </div>
        <div className={styles.actions}>
          <Link href="/contact" className="button">
            Започнете Вашия проект <Arrow />
          </Link>
          <Link
            href="/contact#contact-form"
            className="button button-secondary"
          >
            <Icon name="message" />
            Консултирайте се с нас
          </Link>
        </div>
      </div>
    </section>
  );
}
