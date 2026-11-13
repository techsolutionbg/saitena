import Link from "next/link";
import {
  base,
  concepts,
  plans,
  startFeatures,
  faq,
  type Concept,
} from "@/lib/content";
import { Arrow, Check, Mark } from "./icons";
import { HeroArtwork } from "./artwork";
import { PortfolioGallery } from "./interactive";

export function ButtonLink({
  concept,
  to = "zapitvane",
  children,
  secondary = false,
}: {
  concept: Concept;
  to?: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      href={`${base(concept)}/${to}`}
      className={`button ${secondary ? "button-secondary" : ""}`}
    >
      {children}
      <Arrow />
    </Link>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children && <div className="section-heading-aside">{children}</div>}
    </div>
  );
}
export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-intro wrap">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children && <div className="page-intro-copy">{children}</div>}
    </div>
  );
}

export function PlanCards({
  concept,
  full = false,
}: {
  concept: Concept;
  full?: boolean;
}) {
  return (
    <>
      <div className="plans-grid">
        {plans.map((plan, i) => (
          <article
            className={`plan-card ${i === 0 ? "plan-featured" : ""}`}
            key={plan.name}
          >
            <div className="plan-topline">
              <span>{plan.eyebrow}</span>
              <span>{i === 0 ? "↗" : `0${i + 1}`}</span>
            </div>
            <h3>{plan.name}</h3>
            <div className="plan-price">
              {plan.price ? (
                <>
                  <strong>{plan.price}</strong>
                  <span>/месец</span>
                </>
              ) : (
                <strong className="concept-price">Обхват в развитие</strong>
              )}
            </div>
            <span className="plan-status">
              {plan.price
                ? "Без първоначална такса"
                : "Цената предстои да се уточни"}
            </span>
            <p>{plan.description}</p>
            <ul>
              {(full && i === 0 ? startFeatures : plan.features).map((item) => (
                <li key={item}>
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={`${base(concept)}/zapitvane?plan=${encodeURIComponent(i === 0 ? "START" : `${plan.name} (концепция)`)}`}
              className={`button ${i === 0 ? "" : "button-secondary"}`}
            >
              {i === 0 ? "Запитване за START" : "Обсъдете възможностите"}
              <Arrow />
            </Link>
            <small>{plan.status}</small>
          </article>
        ))}
      </div>
      <p className="plans-footnote">
        * Хостинг, SSL и домейн при договорени условия. MEDIUM и PREMIUM са
        предложения за обсъждане — без потвърдени цени, количествени лимити или
        договорни условия. Данъчният режим на цената на START предстои да бъде
        уточнен.
      </p>
      <div className="custom-plan">
        <div>
          <span className="eyebrow">ИМАТЕ НЕЩО ДРУГО ПРЕДВИД?</span>
          <h3>Вашата идея не се побира в план?</h3>
          <p>Да обсъдим индивидуален обхват според целите ви.</p>
        </div>
        <ButtonLink
          concept={concept}
          to="zapitvane?plan=Индивидуална%20оферта"
          secondary
        >
          Индивидуална оферта
        </ButtonLink>
      </div>
    </>
  );
}

export function FAQ({ limit }: { limit?: number }) {
  return (
    <div className="faq-list">
      {faq.slice(0, limit).map(([question, answer], i) => (
        <details key={question}>
          <summary>
            <span className="faq-index">0{i + 1}</span>
            <span>{question}</span>
            <span className="faq-plus" aria-hidden="true">
              +
            </span>
          </summary>
          <p>{answer}</p>
        </details>
      ))}
    </div>
  );
}

export function Process({ concept }: { concept: Concept }) {
  return (
    <section className="process-section wrap section">
      <SectionHeading
        eyebrow="ОТ ИДЕЯ ДО ПРИСЪСТВИЕ"
        title={
          concept === "atelier"
            ? "Всяка добра история има начало."
            : concept === "pulse"
              ? "СТЪПКА. ПО СТЪПКА."
              : "Лесно начало. Постоянна грижа."
        }
      />
      <div className="process-grid">
        {[
          [
            "Разговаряме",
            "Разбираме бизнеса, целите и хората, до които искате да достигнете.",
          ],
          [
            "Създаваме",
            "Подреждаме съдържанието и оформяме дизайн с вашия характер.",
          ],
          [
            "Развиваме",
            "След одобрение и стартиране се грижим за сайта и месечните промени.",
          ],
        ].map(([title, copy], i) => (
          <article key={title}>
            <span className="process-number">
              0{i + 1}
              <Arrow />
            </span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CTA({ concept }: { concept: Concept }) {
  return (
    <section className="cta-section wrap">
      <div className="cta-inner">
        <span className="eyebrow">СЛЕДВАЩАТА СТЪПКА Е ВАША</span>
        <h2>
          {concept === "atelier"
            ? "Нека дадем дом\nна идеята ви."
            : concept === "pulse"
              ? "ДОБРИТЕ ИДЕИ\nЗАСЛУЖАВАТ САЙТ."
              : "Готови за своето\nмясто онлайн?"}
        </h2>
        <div className="cta-bottom">
          <p>
            Разкажете ни за бизнеса си.
            <br />
            Ще започнем с разговор.
          </p>
          <ButtonLink concept={concept}>Да създадем вашия сайт</ButtonLink>
        </div>
        <Mark className="cta-watermark" />
      </div>
    </section>
  );
}

export function Footer({ concept }: { concept: Concept }) {
  const root = base(concept);
  return (
    <footer className="site-footer wrap">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link href={root} className="brand">
            <Mark />
            <span>saitena.</span>
          </Link>
          <p>
            Сайтът ви е в добри ръце.
            <br />
            Всеки месец.
          </p>
          <span className="footer-location">
            Създадено за бизнесите в България.
          </span>
        </div>
        <div>
          <h2>Разгледайте</h2>
          <Link href={`${root}/uslugi`}>Сайтове на абонамент</Link>
          <Link href={`${root}/planove`}>Абонаментни планове</Link>
          <Link href={`${root}/portfolio`}>Портфолио</Link>
          <Link href={`${root}/za-nas`}>За нас</Link>
        </div>
        <div>
          <h2>Полезно</h2>
          <Link href={`${root}/vuprosi`}>Често задавани въпроси</Link>
          <Link href={`${root}/blog`}>Блог</Link>
          <Link href={`${root}/karta-na-saita`}>Карта на сайта</Link>
          <Link href={`${root}/kontakti`}>Контакти</Link>
        </div>
        <div className="footer-inquiry">
          <h2>Имате идея?</h2>
          <p>Нека ѝ дадем добра посока.</p>
          <Link href={`${root}/zapitvane`} className="text-link">
            Разкажете ни <Arrow />
          </Link>
          <small>
            Контактни и фирмени данни:
            <br />
            предстои потвърждение.
          </small>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Saitena · Дизайн концепция</span>
        <div>
          <Link href={`${root}/pravni/poveritelnost`}>Поверителност</Link>
          <Link href={`${root}/pravni/biskvitki`}>Бисквитки</Link>
          <Link href={`${root}/pravni/uslovia`}>Условия за ползване</Link>
          <Link href={`${root}/pravni/abonamentni-uslovia`}>
            Абонаментни условия
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function Home({ concept }: { concept: Concept }) {
  const data = concepts[concept];
  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="status-dot" />
            ВАШИЯТ ДИГИТАЛЕН ПАРТНЬОР
          </div>
          <h1>
            {data.title.map((line, i) => (
              <span
                key={line}
                className={i === data.title.length - 1 ? "accent-line" : ""}
              >
                {line}
              </span>
            ))}
          </h1>
          <p className="hero-intro">{data.intro}</p>
          <div className="hero-actions">
            <ButtonLink concept={concept}>Да започнем</ButtonLink>
            <Link className="text-link" href={`${base(concept)}/portfolio`}>
              Вижте концепциите <Arrow />
            </Link>
          </div>
          <div className="hero-proof">
            <span>
              <Check />
              Без първоначална такса
            </span>
            <span>
              <Check />
              START: 50 €/месец
            </span>
          </div>
        </div>
        <HeroArtwork variant={concept} />
      </section>
      <div className="benefits-strip">
        <div className="wrap">
          <span>
            Един партньор.
            <br />
            <b>Цялата грижа.</b>
          </span>
          {[
            "Индивидуален дизайн",
            "Хостинг и SSL*",
            "Месечни промени",
            "SEO и GEO",
          ].map((item, i) => (
            <div key={item}>
              <span className="benefit-symbol">{["✳", "⌘", "↗", "◎"][i]}</span>
              {item}
            </div>
          ))}
        </div>
      </div>
      <section className="intro-section wrap section">
        <span className="eyebrow">ПОВЕЧЕ ОТ ИЗРАБОТКА НА САЙТ</span>
        <div>
          <h2>
            {concept === "clarity" ? (
              <>
                Вие градите бизнеса.
                <br />
                <span>Ние се грижим за сайта.</span>
              </>
            ) : concept === "atelier" ? (
              <>
                Създаден за вас.
                <br />
                <span>Обгрижван от нас.</span>
              </>
            ) : (
              <>
                ФОКУС ВЪРХУ БИЗНЕСА.
                <br />
                <span>САЙТЪТ Е ОТ НАС.</span>
              </>
            )}
          </h2>
          <p>
            Сайтът не е еднократна задача. Той е вашата визитка, място за
            услугите ви и начало на нови разговори. Събираме изработката и
            техническата грижа в ясен месечен абонамент.
          </p>
          <Link href={`${base(concept)}/uslugi`} className="text-link">
            Как работи абонаментът <Arrow />
          </Link>
        </div>
      </section>
      <section className="portfolio-section section">
        <div className="wrap">
          <SectionHeading
            eyebrow="ИДЕИ СЪС СОБСТВЕН ХАРАКТЕР"
            title={
              concept === "pulse"
                ? "РАЗЛИЧЕН БИЗНЕС. РАЗЛИЧЕН САЙТ."
                : "Вашият бизнес заслужава свой облик."
            }
          >
            <Link className="text-link" href={`${base(concept)}/portfolio`}>
              Всички концепции <Arrow />
            </Link>
          </SectionHeading>
          <PortfolioGallery
            concept={concept}
            limit={concept === "atelier" ? 3 : 2}
          />
        </div>
      </section>
      <Process concept={concept} />
      <section className="pricing-section section">
        <div className="wrap">
          <SectionHeading
            eyebrow="ПЛАН ЗА ВАШЕТО ПРИСЪСТВИЕ"
            title={
              concept === "pulse"
                ? "ЯСЕН СТАРТ. МЯСТО ЗА РАСТЕЖ."
                : "Малка месечна стъпка. Голямо начало."
            }
          >
            <p>
              Започнете със START.
              <br />
              Обсъдете следващите възможности.
            </p>
          </SectionHeading>
          <PlanCards concept={concept} />
        </div>
      </section>
      <section className="faq-section wrap section">
        <div>
          <span className="eyebrow">ДОБРЕ Е ДА ЗНАЕТЕ</span>
          <h2>
            Имате въпроси?
            <br />
            Нека ги изясним.
          </h2>
          <Link className="text-link" href={`${base(concept)}/vuprosi`}>
            Всички отговори <Arrow />
          </Link>
        </div>
        <FAQ limit={4} />
      </section>
      <CTA concept={concept} />
    </>
  );
}
