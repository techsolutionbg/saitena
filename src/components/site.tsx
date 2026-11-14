import Link from "next/link";
import { buildContactLinks } from "@/lib/contact-links";
import {
  mainNavigation,
  legalNavigation,
  type NavigationItem,
} from "@/lib/navigation";
import { Arrow, Icon, type IconName } from "./icons";
import { CustomPlanOffer } from "./plan-cards";
import { Brand } from "./brand";
import { HomeHero } from "./home-hero";
import { BenefitsMarquee } from "./benefits-marquee";
import { HomeStory } from "./home-story";
import { PortfolioGallery } from "./interactive";
import { FAQPreview } from "./faq-preview";

export function ButtonLink({
  to = "contact",
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
          <Link className="button" href="/prices">
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
  { href: "/faq", label: "Често задавани въпроси", icon: "help" },
  { href: "/blog", label: "Блог", icon: "book" },
  { href: "/sitemap", label: "Карта на сайта", icon: "sitemap" },
];
export function Footer() {
  const contacts = buildContactLinks({
    email: process.env.SAITENA_CONTACT_EMAIL,
    phone: process.env.SAITENA_CONTACT_PHONE,
    viberUrl: process.env.SAITENA_VIBER_URL,
  });
  return (
    <footer className="site-footer wrap">
      <div className="footer-grid">
        <div className="footer-brand">
          <Brand className="brand-footer" withTagline />
          <p>
            Създаваме сайтове на абонамент с красив дизайн, хостинг и техническа
            поддръжка за Вашия бизнес.
          </p>
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
        <div className="footer-contacts">
          <h2>Свържете се с нас</h2>
          {contacts.map((contact) =>
            contact.href ? (
              <a
                key={contact.id}
                href={contact.href}
                className="footer-contact-row"
                aria-label={`${contact.label}: ${contact.value}`}
              >
                <Icon name={contact.icon} />
                <span>
                  <span className="footer-contact-label">{contact.label}</span>
                  {contact.value}
                </span>
              </a>
            ) : (
              <div
                key={contact.id}
                className="footer-contact-row footer-contact-pending"
              >
                <Icon name={contact.icon} />
                <span>
                  {contact.label}
                  <small>Очаква данни</small>
                </span>
              </div>
            ),
          )}
          <Link href="/contact" className="footer-contact-row">
            <Icon name="file" />
            <span>Контактна страница</span>
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <nav aria-label="Правни страници">
          {legalNavigation.map((item) => (
            <Link key={item.href} href={item.href}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <p className="footer-copyright">© {new Date().getFullYear()} Saitena</p>
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
          <header className="home-projects-heading">
            <h2>Нашите проекти</h2>
            <p>
              Разработваме фирмени сайтове, сайтове за услуги и онлайн
              представяне на самостоятелни специалисти. Разгледайте проектите ни
              за различни дейности — с ясна структура, адаптивно оформление и
              собствен визуален характер. Те показват как можем да представим и
              Вашия бизнес онлайн.
            </p>
            <Link href="/portfolio" className="button">
              Всички проекти <Arrow />
            </Link>
          </header>
          <PortfolioGallery limit={4} mobileLimit={2} />
        </div>
      </section>
      <CustomPlanOffer />
      <FAQPreview />
      <CTA forFAQ />
    </>
  );
}
