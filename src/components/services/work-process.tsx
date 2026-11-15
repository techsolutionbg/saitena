import Image from "next/image";
import Link from "next/link";
import { Arrow, Icon } from "@/components/ui/icons";
import { workProcessSteps } from "@/lib/work-process";
import styles from "./work-process.module.css";

export function WorkProcess() {
  return (
    <section className={styles.section} aria-labelledby="work-process-title">
      <div className={`wrap ${styles.inner}`}>
        <header className={styles.heading}>
          <span className={styles.eyebrow}>
            <Icon name="layers" />
            Етапи на работа
          </span>
          <h2 id="work-process-title">
            Как протича <span>работата с нас</span>
          </h2>
          <p>
            Ясен и структуриран процес, който ни позволява да създадем качествен
            сайт, съобразен с Вашите цели и срокове.
          </p>
        </header>
        <ol className={styles.steps} role="list">
          {workProcessSteps.map((step, index) => (
            <li className={styles.step} data-accent={step.accent} key={step.id}>
              <span className={styles.number} aria-hidden="true">
                {step.number}
              </span>
              <Image
                src={step.image}
                alt=""
                width={320}
                height={320}
                sizes="150px"
                className={styles.artwork}
              />
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {index < workProcessSteps.length - 1 && (
                <span className={styles.connector} aria-hidden="true">
                  <Icon name="chevron" />
                </span>
              )}
            </li>
          ))}
        </ol>
        <div className={styles.actions}>
          <Link className="button" href="/contact">
            Започнете Вашия проект <Arrow />
          </Link>
          <Link
            className="button button-secondary"
            href="/contact#contact-form"
          >
            <Icon name="message" />
            Задайте въпрос
          </Link>
        </div>
      </div>
    </section>
  );
}
