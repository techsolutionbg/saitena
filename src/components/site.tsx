import Link from "next/link";
import { plans, startFeatures } from "@/lib/content";
import { faq } from "@/lib/faq-content";
import {
  mainNavigation,
  legalNavigation,
  type NavigationItem,
} from "@/lib/navigation";
import { Arrow, Check, Icon, type IconName } from "./icons";
import { Brand } from "./brand";
import { HomeHero } from "./home-hero";
import { BenefitsMarquee } from "./benefits-marquee";
import { HomeStory } from "./home-story";
import { PortfolioGallery } from "./interactive";
import { FAQ } from "./faq";

export function ButtonLink({
  to = "inquiry",
  children,
  secondary = false,
}: {
  to?: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      href={`/${to}`}
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
export function PlanCards({ full = false }: { full?: boolean }) {
  return (
    <>
      <div className="plans-grid">
        {plans.map((plan, index) => (
          <article
            className={`plan-card ${index === 0 ? "plan-featured" : ""}`}
            key={plan.name}
          >
            <div className="plan-topline">
              <span className="plan-icon">
                <Icon
                  name={
                    index === 0 ? "monitor" : index === 1 ? "layers" : "growth"
                  }
                />
              </span>
              <span>{plan.eyebrow}</span>
            </div>
            <h3>{plan.name}</h3>
            <div className="plan-price">
              {plan.price ? (
                <>
                  <strong>{plan.price}</strong>
                  <span>/месец</span>
                </>
              ) : (
                <span>Обхват в развитие</span>
              )}
            </div>
            <span className="plan-status">
              {plan.price
                ? "Без първоначална такса"
                : "Цената предстои да се уточни"}
            </span>
            <p>{plan.description}</p>
            <ul>
              {(full && index === 0 ? startFeatures : plan.features).map(
                (item) => (
                  <li key={item}>
                    <Check />
                    <span>{item}</span>
                  </li>
                ),
              )}
            </ul>
            <Link
              href={`/inquiry?plan=${encodeURIComponent(index === 0 ? "START" : `${plan.name} (концепция)`)}`}
              className={`button ${index === 0 ? "" : "button-secondary"}`}
            >
              {index === 0 ? "Запитване за START" : "Обсъдете възможностите"}
              <Arrow />
            </Link>
            <span className="plan-confirmation">{plan.status}</span>
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
        <span className="section-icon">
          <Icon name="message" />
        </span>
        <div>
          <span className="eyebrow">ИМАТЕ НЕЩО ДРУГО ПРЕДВИД?</span>
          <h3>Вашата идея не се побира в план?</h3>
          <p>Да обсъдим индивидуален обхват според целите ви.</p>
        </div>
        <ButtonLink to="inquiry?plan=Индивидуална%20оферта" secondary>
          Индивидуална оферта
        </ButtonLink>
      </div>
    </>
  );
}
const processItems: { title: string; copy: string; icon: IconName }[] = [
  {
    title: "Разговаряме",
    copy: "Разбираме бизнеса, целите и хората, до които искате да достигнете.",
    icon: "message",
  },
  {
    title: "Създаваме",
    copy: "Подреждаме съдържанието и оформяме дизайн с вашия характер.",
    icon: "monitor",
  },
  {
    title: "Развиваме",
    copy: "След одобрение и стартиране се грижим за сайта и месечните промени.",
    icon: "growth",
  },
];
export function Process() {
  return (
    <section className="process-section wrap section">
      <SectionHeading
        eyebrow="ОТ ИДЕЯ ДО ПРИСЪСТВИЕ"
        title="Лесно начало. Постоянна грижа."
      />
      <div className="process-grid">
        {processItems.map((item, index) => (
          <article key={item.title}>
            <div className="process-top">
              <span className="section-icon">
                <Icon name={item.icon} />
              </span>
              <span>0{index + 1}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
export function CTA({ forFAQ = false }: { forFAQ?: boolean }) {
  return (
    <section className={`cta-section wrap${forFAQ ? " faq-cta" : ""}`}>
      <div className="cta-inner">
        <div>
          <span className="eyebrow">
            {forFAQ ? "ГОТОВИ ЛИ СТЕ ДА ЗАПОЧНЕМ?" : "СЛЕДВАЩАТА СТЪПКА Е ВАША"}
          </span>
          <h2>
            {forFAQ
              ? "Вашият бизнес заслужава силно онлайн присъствие."
              : "Готови за своето място онлайн?"}
          </h2>
          <p>
            {forFAQ
              ? "Получете професионален уебсайт, техническа поддръжка и ясна месечна цена — без голяма първоначална инвестиция."
              : "Разкажете ни за бизнеса си. Ще започнем с разговор."}
          </p>
        </div>
        <ButtonLink>Да създадем вашия сайт</ButtonLink>
        {forFAQ && (
          <Link className="button" href="/plans">
            Разгледайте плановете <Arrow />
          </Link>
        )}
        <img
          src="/brand/saitena-mark.svg"
          className="cta-watermark"
          width={525}
          height={525}
          alt=""
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
const usefulNavigation: NavigationItem[] = [
  { href: "/faq", label: "Всички въпроси и отговори", icon: "help" },
  { href: "/blog", label: "Блог", icon: "book" },
  { href: "/sitemap", label: "Карта на сайта", icon: "sitemap" },
  { href: "/contact", label: "Контакти", icon: "mail" },
];
export function Footer() {
  return (
    <footer className="site-footer wrap">
      <div className="footer-grid">
        <div className="footer-brand">
          <Brand className="brand-footer" withTagline />
          <p>
            Сайтът ви е в добри ръце.
            <br />
            Всеки месец.
          </p>
          <p>Създадено за бизнесите в България.</p>
        </div>
        <div>
          <h2>Разгледайте</h2>
          {mainNavigation.slice(0, 4).map((item) => (
            <Link href={item.href} key={item.href}>
              <Icon name={item.icon} />
              <span>
                {item.href === "/services"
                  ? "Сайтове на абонамент"
                  : item.label}
              </span>
            </Link>
          ))}
        </div>
        <div>
          <h2>Полезно</h2>
          {usefulNavigation.map((item) => (
            <Link key={item.href} href={item.href}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="footer-inquiry">
          <h2>Имате идея?</h2>
          <p>Нека ѝ дадем добра посока.</p>
          <Link href="/inquiry" className="text-link">
            Разкажете ни <Arrow />
          </Link>
          <p>Контактни и фирмени данни: предстои потвърждение.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Saitena</p>
        <nav aria-label="Правни страници">
          {legalNavigation.map((item) => (
            <Link key={item.href} href={item.href}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
export function Home() {
  return (
    <>
      <HomeHero />
      <BenefitsMarquee />
      <HomeStory />
      <section className="portfolio-section section">
        <div className="wrap">
          <SectionHeading
            eyebrow="ИДЕИ СЪС СОБСТВЕН ХАРАКТЕР"
            title="Вашият бизнес заслужава свой облик."
          >
            <Link href="/portfolio" className="text-link">
              Всички примерни проекти <Arrow />
            </Link>
          </SectionHeading>
          <PortfolioGallery limit={2} />
        </div>
      </section>
      <section className="pricing-section section">
        <div className="wrap">
          <SectionHeading
            eyebrow="ПЛАН ЗА ВАШЕТО ПРИСЪСТВИЕ"
            title="Малка месечна стъпка. Голямо начало."
          >
            <p>Започнете със START. Обсъдете следващите възможности.</p>
          </SectionHeading>
          <PlanCards />
        </div>
      </section>
      <div className="faq-backdrop">
        <section className="faq-section wrap section">
          <svg
            className="faq-art"
            viewBox="0 0 1280 1000"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <g
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M32 210C150 120 40 400 145 480S30 760 165 870M1240 100C1100 240 1270 350 1150 500S1280 730 1130 920"
                strokeDasharray="7 14"
              />
              <path d="M38 60h105a20 20 0 0 1 20 20v75a20 20 0 0 1-20 20H85l-30 25v-25H38a20 20 0 0 1-20-20V80a20 20 0 0 1 20-20Z" />
              <path d="M1100 730h130v95h-35l-25 23v-23h-70Z M1120 752h85m-85 20h60" />
              <circle cx="98" cy="620" r="47" />
              <circle cx="1180" cy="300" r="55" />
              <path d="m50 945 18-18-18-18m40 36-18-18 18-18m1080-420 20 20 35-45" />
            </g>
            <g
              fill="currentColor"
              fontFamily="sans-serif"
              fontSize="72"
              textAnchor="middle"
            >
              <text x="90" y="143" transform="rotate(-10 90 143)">
                ?
              </text>
              <text x="1180" y="325" transform="rotate(12 1180 325)">
                ?
              </text>
              <text x="98" y="645">
                ?
              </text>
            </g>
          </svg>
          <div>
            <h2>Всичко важно, преди да започнем.</h2>
            <p>
              Колко струва сайтът? Какво включва абонаментът? Какво се случва,
              ако решите да прекратите услугата? Отговаряме ясно на най-важните
              въпроси, за да направите информиран избор.
            </p>
          </div>
          <FAQ
            items={faq.filter((item) =>
              [
                "subscription",
                "pricing",
                "timeline",
                "monthly-changes",
                "ownership",
                "contract",
              ].includes(item.id),
            )}
            label="Въпроси за добър старт"
            className="faq-cards"
          />
          <span className="eyebrow faq-afterword">ДОБРЕ Е ДА ЗНАЕТЕ</span>
          <Link href="/faq" className="button">
            Всички въпроси и отговори <Arrow />
          </Link>
        </section>
      </div>
      <CTA forFAQ />
    </>
  );
}
