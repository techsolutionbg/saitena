import Image from "next/image";
import Link from "next/link";
import { Arrow, Icon, type IconName } from "@/components/ui/icons";
import { buildContactLinks } from "@/lib/contact-links";
import styles from "./services-cta.module.css";

const benefits = [
  { icon: "gauge", label: "Бърза реакция" },
  { icon: "shield", label: "Индивидуален подход" },
  { icon: "users", label: "Консултация без ангажимент" },
] satisfies readonly { icon: IconName; label: string }[];

export function ServicesCTA() {
  const phone = buildContactLinks({
    phone: process.env.SAITENA_CONTACT_PHONE,
  }).find((contact) => contact.id === "phone")?.href;

  return (
    <section className={styles.section} aria-labelledby="services-cta-title">
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>
            <Icon name="mail" />
            Свържете се с нас
          </span>
          <h2 id="services-cta-title">
            Готови ли сте да започнем <span>Вашия проект?</span>
          </h2>
          <p>
            Имате идея за сайт или се нуждаете от консултация? Свържете се с
            нас, за да обсъдим Вашите изисквания и да намерим подходящото
            решение за Вашия бизнес.
          </p>
          <ul className={styles.benefits}>
            {benefits.map((benefit) => (
              <li key={benefit.label}>
                <Icon name={benefit.icon} />
                <span>{benefit.label}</span>
              </li>
            ))}
          </ul>
          <div className={styles.actions}>
            <Link href="/contact" className="button">
              <Icon name="mail" />
              <span>Към страницата с контакти</span>
              <Arrow />
            </Link>
            {phone ? (
              <a
                href={phone}
                className={`button button-secondary ${styles.secondary}`}
              >
                <Icon name="phone" />
                <span>Обадете се сега</span>
              </a>
            ) : (
              <Link
                href="/contact#contact-form"
                className={`button button-secondary ${styles.secondary}`}
              >
                <Icon name="message" />
                <span>Напишете ни</span>
              </Link>
            )}
          </div>
        </div>
        <div className={styles.artwork}>
          <Image
            src="/images/services-contact-v1.webp"
            alt=""
            width={1100}
            height={1100}
            sizes="(max-width: 1000px) 90vw, (max-width: 1600px) 44vw, 650px"
            className={styles.image}
          />
        </div>
      </div>
    </section>
  );
}
