import { comparisonGroups, plans, priceLabel } from "@/lib/plans";
import { plansFAQ } from "@/lib/plans-faq";
import { PlanSecurity } from "./plan-security";
import { PlanCards, CustomPlanOffer } from "./plan-cards";
import { Check, Icon } from "@/components/ui/icons";
import { FAQPreview } from "@/components/faq/faq-preview";
import { getPlanFeatureHelp } from "@/lib/plan-feature-help";
import { FeatureHelp } from "@/components/ui/feature-help";
import { MobilePlanDisclosure } from "./mobile-plan-disclosure";
import { PricesHero } from "./prices-hero";
import styles from "./plans.module.css";
import { isPrivatePreview } from "@/lib/release-mode";

function ComparisonValue({
  value,
  showLabel = false,
}: {
  value: boolean | string;
  showLabel?: boolean;
}) {
  if (typeof value === "string") return value;
  return value ? (
    <span className={styles.included}>
      <Check />
      <span className={showLabel ? undefined : styles.srOnly}>Включено</span>
    </span>
  ) : (
    <span className={styles.notIncluded}>
      <span aria-hidden="true">—</span>
      <span className={showLabel ? undefined : styles.srOnly}>
        Не е включено
      </span>
    </span>
  );
}

function MobilePlanComparison() {
  const features = comparisonGroups.flatMap((group) => group.features);

  return (
    <div className={styles.mobileComparison}>
      {plans.map((plan) => {
        const helpSequence = features.map((feature) =>
          getPlanFeatureHelp(feature.id, plan, feature.label),
        );

        return (
          <MobilePlanDisclosure
            planId={plan.id}
            price={priceLabel(plan)}
            key={plan.id}
          >
            {comparisonGroups.map((group) => (
              <section
                className={styles.mobileComparisonGroup}
                key={group.title}
              >
                <h4>{group.title}</h4>
                <dl>
                  {group.features.map((feature) => {
                    const index = features.findIndex(
                      (item) => item.id === feature.id,
                    );

                    return (
                      <div
                        className={styles.mobileComparisonFeature}
                        key={feature.id}
                      >
                        <dt className={styles.featureLabel}>
                          <span>{feature.label}</span>
                          <FeatureHelp
                            help={helpSequence[index]}
                            sequence={helpSequence}
                            initialIndex={index}
                          />
                        </dt>
                        <dd>
                          <ComparisonValue
                            value={feature.value(plan)}
                            showLabel
                          />
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ))}
          </MobilePlanDisclosure>
        );
      })}
    </div>
  );
}

export function PlansPage() {
  const comparisonFeatures = comparisonGroups.flatMap(
    (group) => group.features,
  );
  const comparisonHelp = comparisonFeatures.map((feature) =>
    getPlanFeatureHelp(feature.id),
  );
  const seoHelp = plans.map((plan) =>
    getPlanFeatureHelp("seo", plan, plan.seo),
  );
  return (
    <>
      <PricesHero />
      {isPrivatePreview && (
        <p className="wrap demo-prices-note">
          Демонстрационни цени и планове — не са търговска оферта.
        </p>
      )}
      <CustomPlanOffer />
      <section
        className={`wrap ${styles.plans}`}
        aria-labelledby="subscription-plans-title"
      >
        <header className={styles.comparisonIntro}>
          <h2 id="subscription-plans-title">Планове за сайтове на абонамент</h2>
          <p>
            Изберете план според нуждите и целите на Вашия бизнес. Всеки
            абонамент включва изработка на уебсайт, хостинг, техническа
            поддръжка и грижа за сигурността, без първоначална такса за
            разработка. Сравнете възможностите и месечните цени, за да откриете
            най-подходящото решение за Вас.
          </p>
        </header>
        <PlanCards />
        <a className={styles.comparisonLink} href="#plan-comparison">
          Вижте всички характеристики
          <Icon name="chevron" />
        </a>
      </section>
      <section
        className={`wrap ${styles.comparisonSection}`}
        aria-labelledby="plan-comparison"
      >
        <header className={styles.comparisonIntro}>
          <h2 id="plan-comparison">
            Сравнение на плановете за сайтове на абонамент
          </h2>
          <p className={styles.tableHint} id="comparison-help">
            Сравнете START, BUSINESS и PREMIUM по брой страници, дизайн,
            хостинг, сигурност, оптимизация и месечна поддръжка. Открийте
            подходящия план за изработка и развитие на сайта на Вашия бизнес.
          </p>
        </header>
        <div
          className={styles.tableContainer}
          role="region"
          aria-label="Таблица за сравнение на плановете"
          aria-describedby="comparison-help"
        >
          <table className={styles.table} role="table">
            <caption className={styles.srOnly}>
              Подробно сравнение на плановете START, BUSINESS и PREMIUM.
            </caption>
            <thead role="rowgroup">
              <tr role="row">
                <th scope="col" role="columnheader">
                  Характеристика
                </th>
                {plans.map((plan) => (
                  <th
                    scope="col"
                    role="columnheader"
                    id={`compare-${plan.id}`}
                    key={plan.id}
                    className={plan.featured ? styles.featuredCell : undefined}
                  >
                    <span>{plan.id}</span>
                    <span>{priceLabel(plan)} / месец</span>
                  </th>
                ))}
              </tr>
            </thead>
            {comparisonGroups.map((group, groupIndex) => (
              <tbody key={group.title} role="rowgroup">
                <tr className={styles.category} role="row">
                  <th scope="rowgroup" role="rowheader" colSpan={4}>
                    <span className={styles.categoryLabel}>{group.title}</span>
                  </th>
                </tr>
                {group.features.map((feature, featureIndex) => (
                  <tr key={feature.label} role="row">
                    <th
                      scope="row"
                      role="rowheader"
                      id={`compare-feature-${groupIndex}-${featureIndex}`}
                    >
                      <div className={styles.featureLabel}>
                        <span>{feature.label}</span>
                        <FeatureHelp
                          help={getPlanFeatureHelp(feature.id)}
                          sequence={comparisonHelp}
                          initialIndex={comparisonFeatures.findIndex(
                            (item) => item.id === feature.id,
                          )}
                        />
                      </div>
                    </th>
                    {plans.map((plan, planIndex) => {
                      const value = feature.value(plan);
                      return (
                        <td
                          key={plan.id}
                          role="cell"
                          headers={`compare-feature-${groupIndex}-${featureIndex} compare-${plan.id}`}
                          className={
                            plan.featured ? styles.featuredCell : undefined
                          }
                        >
                          <span
                            className={styles.mobilePlan}
                            aria-hidden="true"
                          >
                            {plan.id}
                          </span>
                          <span className={styles.cellValue}>
                            <ComparisonValue value={value} />
                            {feature.id === "seo" && (
                              <FeatureHelp
                                help={getPlanFeatureHelp("seo", plan, plan.seo)}
                                sequence={seoHelp}
                                initialIndex={planIndex}
                              />
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
        <MobilePlanComparison />
        <p className={styles.terms}>
          Saitena не е регистрирана по ДДС и не начислява ДДС върху посочените
          цени. Всички цени са в евро. Цените са ориентировъчни и не са
          фиксирани. Окончателната месечна такса се определя индивидуално според
          избрания абонаментен план, необходимите функционалности, обема на
          разработката и специфичните изисквания на клиента. Преди започване на
          работа ще получите конкретна оферта с ясно описани услуги и условия.
        </p>
      </section>
      <PlanSecurity />
      <FAQPreview
        showContactLink
        items={plansFAQ}
        label="Въпроси за избора и сравнението на абонаментни планове"
        title="Често задавани въпроси за сайтовете на абонамент"
        description="Разгледайте отговорите за разликите между START, BUSINESS и PREMIUM, общите услуги и включените лимити. Те ще Ви помогнат да сравните плановете и да изберете подходящия обхват за Вашия сайт на абонамент."
      />
    </>
  );
}
