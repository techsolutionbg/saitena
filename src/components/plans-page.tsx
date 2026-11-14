import { comparisonGroups, plans, priceLabel } from "@/lib/plans";
import { PlanCards, CustomPlanOffer } from "./plan-cards";
import { Check, Icon } from "./icons";
import { FAQPreview } from "./faq-preview";
import { getPlanFeatureHelp } from "@/lib/plan-feature-help";
import { FeatureHelp } from "./feature-help";
import styles from "./plans.module.css";

function ComparisonValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") return value;
  return value ? (
    <span className={styles.included}>
      <Check />
      <span className={styles.srOnly}>Включено</span>
    </span>
  ) : (
    <span className={styles.notIncluded}>
      <span aria-hidden="true">—</span>
      <span className={styles.srOnly}>Не е включено</span>
    </span>
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
      <header className={styles.hero}>
        <div className="wrap">
          <span className="eyebrow">АБОНАМЕНТНИ ПЛАНОВЕ</span>
          <h1>Ориентировъчни цени за сайтове на абонамент.</h1>
          <p>
            Посочените цени са ориентировъчни и Ви помагат да сравните
            плановете. Крайната оферта се определя след разговор за Вашия проект
            и зависи от неговия обхват, необходимите функционалности, дизайна и
            нуждите от поддръжка. Заедно уточняваме подходящото решение и
            условията преди започване на работа.
          </p>
        </div>
      </header>
      <section
        className={`wrap ${styles.plans}`}
        aria-label="Абонаментни планове"
      >
        <PlanCards headingLevel="h2" />
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
          <span className="eyebrow">ДЕТАЙЛИТЕ НА ЕДНО МЯСТО</span>
          <h2 id="plan-comparison">
            Сравнете плановете и открийте подходящия за Вас
          </h2>
          <p className={styles.tableHint} id="comparison-help">
            Вижте какво включва всеки план и сравнете възможностите, за да
            изберете подходящото решение за Вашия бизнес.
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
        <p className={styles.terms}>
          Всички посочени цени на сайта са в евро и са без начислен ДДС. Цените
          са ориентировъчни и не са фиксирани. Окончателната месечна такса се
          определя индивидуално според избрания абонаментен план, необходимите
          функционалности, обема на разработката и специфичните изисквания на
          клиента. Преди започване на работа ще получите конкретна оферта с ясно
          описани услуги и условия.
        </p>
      </section>
      <CustomPlanOffer />
      <FAQPreview title="Имате въпроси за абонамента?" />
    </>
  );
}
