"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/ui/icons";
import styles from "./benefits-marquee.module.css";

const benefits = [
  {
    title: "Красив дизайн",
    description: "Създаден за Вашия бизнес",
    icon: "palette",
  },
  {
    title: "Адаптивен сайт",
    description: "За всяко устройство",
    icon: "phone",
  },
  { title: "Сигурност и SSL", description: "Защитена връзка", icon: "shield" },
  {
    title: "Постоянна поддръжка",
    description: "Грижа за Вашия сайт",
    icon: "headphones",
  },
  {
    title: "Бързо зареждане",
    description: "Оптимизирана работа",
    icon: "gauge",
  },
  {
    title: "SEO и GEO",
    description: "Основа за онлайн видимост",
    icon: "searchCheck",
  },
] satisfies { title: string; description: string; icon: IconName }[];

export function BenefitsMarquee() {
  const [touching, setTouching] = useState(false);

  return (
    <section
      className={styles.section}
      aria-label="Предимства на Вашия сайт"
      tabIndex={0}
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse") setTouching(true);
      }}
      onPointerUp={() => setTouching(false)}
      onPointerCancel={() => setTouching(false)}
      onPointerLeave={() => setTouching(false)}
    >
      <div className={styles.viewport}>
        <div className={styles.track} data-paused={touching}>
          {/* A hidden duplicate keeps the final step seamless when the cycle restarts. */}
          {[false, true].map((duplicate) => (
            <ul
              className={styles.group}
              key={String(duplicate)}
              aria-hidden={duplicate || undefined}
            >
              {benefits.map((benefit) => (
                <li className={styles.item} key={benefit.title}>
                  <span className={styles.icon}>
                    <Icon name={benefit.icon} />
                  </span>
                  <h2>{benefit.title}</h2>
                  <p>{benefit.description}</p>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
