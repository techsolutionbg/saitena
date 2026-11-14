import Link from "next/link";
import {
  plans,
  planHighlightItems,
  planInquiryHref,
  priceLabel,
  customPlanValue,
} from "@/lib/plans";
import { getPlanFeatureHelp } from "@/lib/plan-feature-help";
import { FeatureHelp } from "./feature-help";
import { Arrow, Check, Icon } from "./icons";
import { ScrollReveal } from "./scroll-reveal";
import styles from "./plans.module.css";

export function PlanCards({
  headingLevel = "h3",
}: {
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const cards = plans.map((plan) => {
    const features = planHighlightItems(plan).map((feature) => ({
      ...feature,
      help: getPlanFeatureHelp(feature.id, plan, feature.label),
    }));
    return {
      plan,
      features,
      sequence: features.map((feature) => feature.help),
    };
  });
  return (
    <>
      <ScrollReveal className={styles.cards} animateOnLoad>
        {cards.map(({ plan, features, sequence }) => (
          <article
            className={`${styles.card} ${plan.featured ? styles.featured : ""}`}
            key={plan.id}
            aria-labelledby={`plan-${plan.id}`}
            data-scroll-reveal="plan"
          >
            <header className={styles.cardHeader}>
              <div className={styles.cardTop}>
                <span className={styles.icon}>
                  <Icon
                    name={
                      plan.id === "START"
                        ? "monitor"
                        : plan.id === "BUSINESS"
                          ? "growth"
                          : "layers"
                    }
                  />
                </span>
              </div>
              <div className={styles.cardIdentity}>
                <Heading id={`plan-${plan.id}`}>{plan.id}</Heading>
                <span className={styles.eyebrow}>{plan.eyebrow}</span>
              </div>
              <p className={styles.description}>{plan.description}</p>
            </header>
            <div className={styles.priceBlock}>
              <span className={styles.priceLabel}>Месечен абонамент</span>
              <div className={styles.price}>
                <strong>{priceLabel(plan)}</strong>
                <span>/месец</span>
              </div>
            </div>
            <ul className={styles.highlights}>
              {features.map((feature, index) => (
                <li key={feature.id}>
                  <Check />
                  <div className={styles.featureLabel}>
                    <span>{feature.label}</span>
                    <FeatureHelp
                      help={feature.help}
                      sequence={sequence}
                      initialIndex={index}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href={planInquiryHref(plan)}
              className={`button ${plan.featured ? "" : "button-secondary"} ${styles.choose}`}
            >
              Изберете {plan.id}
              <Arrow />
            </Link>
          </article>
        ))}
      </ScrollReveal>
    </>
  );
}

export function CustomPlanOffer() {
  return (
    <section className={styles.custom} aria-labelledby="custom-plan-title">
      <div className={`wrap ${styles.customInner}`}>
        <div className={styles.customCard}>
          <div className={styles.customArt} aria-hidden="true">
            <div className={styles.customOrbit} />
            <div className={styles.customOrbitInner} />
            <div className={styles.customHub}>
              <Icon name="sparkles" />
            </div>
            <span className={`${styles.customTag} ${styles.tagDesign}`}>
              <Icon name="palette" />
              Дизайн
            </span>
            <span className={`${styles.customTag} ${styles.tagFeatures}`}>
              <Icon name="layers" />
              Функционалности
            </span>
            <span className={`${styles.customTag} ${styles.tagSupport}`}>
              <Icon name="headphones" />
              Поддръжка
            </span>
            <span className={styles.customArtCaption}>
              Вашата идея. Нашата грижа.
            </span>
          </div>
          <div className={styles.customCopy}>
            <span className={styles.customEyebrow}>
              <Icon name="sparkles" />
              ИНДИВИДУАЛНО РЕШЕНИЕ
            </span>
            <h2 id="custom-plan-title">
              Индивидуална оферта за изработка на сайт на абонамент
            </h2>

            <p>
              Всеки бизнес е различен. Ако стандартните планове не покриват
              Вашите нужди, можем да предложим индивидуално решение с
              подходящите функционалности, дизайн и техническа поддръжка.
            </p>
            <Link
              href={`/contact?plan=${encodeURIComponent(customPlanValue)}`}
              className={`button ${styles.customButton}`}
            >
              Поискайте индивидуална оферта
              <Arrow />
            </Link>
            <p className={styles.customNote}>Разкажете ни какво Ви е нужно.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
