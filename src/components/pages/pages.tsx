import Link from "next/link";
import { articles, projects, routeTitles } from "@/lib/content";
import { WebsiteArtwork } from "@/components/illustrations/artwork";
import { InquiryForm } from "@/components/contact/inquiry-form";
import { PortfolioGallery } from "@/components/portfolio/portfolio-gallery";
import { Arrow, Check, Icon } from "@/components/ui/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { CTA } from "@/components/shared/cta";
import { PageIntro } from "@/components/ui/page-intro";
import { SectionHeading } from "@/components/ui/section-heading";
import { FAQ } from "@/components/faq/faq";
import { faq, faqCategories } from "@/lib/faq-content";
import { FAQDirectory } from "@/components/faq/faq-directory";
import { PlansPage } from "@/components/pricing/plans-page";
import { startPlan } from "@/lib/plans";
import { ContactQuickLinks } from "@/components/contact/contact-quick-links";
import { ContactLocation } from "@/components/contact/contact-location";
import { PortfolioHero } from "@/components/portfolio/portfolio-hero";
import { PortfolioCTA } from "@/components/portfolio/portfolio-cta";
import { ServicesHero } from "@/components/services/services-hero";
import { ServicesCatalog } from "@/components/services/services-catalog";
import { WorkProcess } from "@/components/services/work-process";
import { ServicesCTA } from "@/components/services/services-cta";
import { BlogHero } from "@/components/blog/blog-hero";
import { BlogCatalog } from "@/components/blog/blog-catalog";
import { blogPosts } from "@/lib/blog-posts";
import { parseBlogFilters, type BlogQuery } from "@/lib/blog-catalog";
import contactStyles from "@/components/contact/contact-page.module.css";
import {
  hasPreviewProtections,
  isPreview,
  previewDetails,
} from "@/lib/release-mode";

export function ContentPage({
  path,
  plan,
  blogQuery,
}: {
  path: string;
  plan?: string;
  blogQuery?: BlogQuery;
}) {
  if (path === "services")
    return (
      <>
        <ServicesHero />
        <ServicesCatalog />
        <WorkProcess />
        <ServicesCTA />
      </>
    );
  if (path === "prices") return <PlansPage />;
  if (path === "portfolio")
    return (
      <>
        <PortfolioHero />
        <section
          id="portfolio-projects"
          className="wrap portfolio-page"
          aria-label="Галерия с проекти за сайтове"
        >
          <PortfolioGallery headingLevel={2} />
        </section>
        <PortfolioCTA />
      </>
    );
  if (path.startsWith("portfolio/")) {
    const project = projects.find((p) => path === `portfolio/${p.slug}`)!;
    return (
      <>
        <nav className="wrap breadcrumb" aria-label="Навигационна пътека">
          <Link href="/portfolio">Портфолио</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{project.name}</span>
        </nav>
        <PageIntro
          eyebrow={`КОНЦЕПТУАЛЕН ДИЗАЙН · ${project.type.toUpperCase()}`}
          title={project.name}
        >
          <p>{project.description}</p>
        </PageIntro>
        <section className="wrap case-study">
          <div className="case-main-art">
            <WebsiteArtwork kind={project.kind} />
          </div>
          <div className="case-summary">
            <div>
              <span className="eyebrow">ЗАДАЧАТА</span>
              <h2>{project.title}</h2>
              <p>
                Ясно представяне на дейността, удобен мобилен преглед и кратък
                път от интерес към запитване.
              </p>
            </div>
            <div>
              <span className="eyebrow">СТРУКТУРА НА САЙТА</span>
              <ul className="feature-list">
                {project.scope.map((item) => (
                  <li key={item}>
                    <Check />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="case-gallery">
            <div>
              <WebsiteArtwork kind={project.kind} />
              <p>Визуална посока · desktop</p>
            </div>
            <div className="case-mobile-scene">
              <div className="case-mobile">
                <WebsiteArtwork kind={project.kind} />
                <div className="case-mobile-copy">
                  <span>СОБСТВЕН ХАРАКТЕР</span>
                  <h3>Добрият дизайн започва с ясна идея.</h3>
                  <p>Съдържание и структура за вашия бизнес.</p>
                  <i>Да поговорим ↗</i>
                </div>
              </div>
              <p>Адаптация · mobile</p>
            </div>
          </div>
        </section>
        <CTA />
      </>
    );
  }
  if (path === "about")
    return (
      <>
        <PageIntro
          eyebrow="ЗА SAITENA"
          title="Добър сайт. Човешки разговор. Дългосрочна грижа."
        >
          <p>
            Saitena е услуга за професионална изработка на сайтове на месечен
            абонамент. Идеята е проста: бизнесът ви да има собствено място
            онлайн и партньор за техническата грижа.
          </p>
        </PageIntro>
        <section className="wrap about-statement">
          <span className="statement-symbol" aria-hidden="true">
            <Icon name="sparkles" />
          </span>
          <h2>Технологиите работят най-добре, когато са разбираеми.</h2>
          <p>
            За нас ясният обхват, внимателният дизайн и постоянната грижа са
            основата на една добра услуга.
          </p>
        </section>
        <section className="wrap section">
          <SectionHeading
            eyebrow="ПРИНЦИПИ НА УСЛУГАТА"
            title="Близо до реалните нужди."
          />
          <div className="values-grid">
            {[
              [
                "Яснота от началото",
                "Какво включва планът, какво предстои да уточним и какво е извън обхвата — написано разбираемо.",
              ],
              [
                "Дизайн с цел",
                "Структура и визуален език, които помагат на посетителя да разбере бизнеса и да се свърже с него.",
              ],
              [
                "Грижа във времето",
                "Техническа поддръжка и включени месечни промени според договорения план.",
              ],
            ].map(([title, text], i) => (
              <article key={title}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <p className="editor-note">
            Място за потвърдени екип, история, юридическо лице и фирмени данни.
            На този етап не се използват измислени биографии, отзиви или
            статистики.
          </p>
        </section>
        <CTA />
      </>
    );
  if (path === "contact") {
    if (isPreview)
      return (
        <section id="contact-form" className="wrap prose">
          <h1>Контакти — тестови данни</h1>
          <p>{previewDetails.company}</p>
          <p>{previewDetails.email}</p>
          <p>{previewDetails.phone}</p>
          <p>{previewDetails.address}</p>
          <p>Не са заявени реални ЕИК, регистрация или данъчен статут.</p>
          <p>Изпращането на съобщения и картата са недостъпни.</p>
        </section>
      );
    return (
      <div className={contactStyles.page}>
        <section className={contactStyles.hero} aria-labelledby="contact-title">
          <div className={`wrap ${contactStyles.heroInner}`}>
            <h1 id="contact-title">Контакти</h1>
            <p>
              Имате въпрос за сайтовете на абонамент или искате да обсъдим Вашия
              проект? Свържете се с нас по телефон, Viber или имейл, или ни
              пишете чрез формата по-долу.
            </p>
            <ContactQuickLinks />
          </div>
        </section>
        <ContactLocation />
        <section
          id="contact-form"
          className={`wrap ${contactStyles.formContainer}`}
        >
          <InquiryForm kind="contact" initialPlan={plan} />
        </section>
      </div>
    );
  }
  if (path === "faq")
    return (
      <>
        <section className="faq-hero">
          <div className="wrap faq-hero-inner">
            <div>
              <span className="eyebrow">ЧЕСТО ЗАДАВАНИ ВЪПРОСИ</span>
              <h1>Често задавани въпроси за изработка на сайт на абонамент</h1>
              <p>
                Всичко важно за цените, изработката, поддръжката и условията на
                Saitena — обяснено ясно и разбираемо.
              </p>
              <div className="faq-hero-actions">
                <Link className="button" href="#answers">
                  Разгледайте отговорите <Arrow />
                </Link>
                <Link className="text-link" href="/contact">
                  Задайте ни въпрос <Arrow />
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="wrap faq-page" id="answers">
          <FAQDirectory items={faq} categories={faqCategories} />
        </section>
        <CTA />
      </>
    );
  if (path === "blog")
    return (
      <>
        <BlogHero />
        <BlogCatalog
          posts={blogPosts}
          initialFilters={parseBlogFilters(blogQuery ?? {})}
        />
        <CTA />
      </>
    );
  if (path.startsWith("blog/")) {
    const article = articles.find((a) => path === `blog/${a.slug}`)!;
    return (
      <>
        <nav className="wrap breadcrumb" aria-label="Навигационна пътека">
          <Link href="/blog">Блог</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{article.title}</span>
        </nav>
        <PageIntro
          eyebrow="ПРИМЕРЕН РЕДАКЦИОНЕН МАТЕРИАЛ"
          title={article.title}
        >
          <p>{article.description}</p>
        </PageIntro>
        <article className="prose wrap">
          {article.sections.map(([title, text]) => (
            <section key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
            </section>
          ))}
          <div className="article-related">
            <h2>Продължете с конкретния обхват.</h2>
            <ButtonLink to="prices">Вижте абонаментните планове</ButtonLink>
          </div>
          <p className="editor-note">
            Преди реално публикуване: редакционен преглед, потвърден автор, дата
            на публикация и дата на актуализация.
          </p>
        </article>
      </>
    );
  }
  if (path === "sitemap")
    return (
      <>
        <PageIntro eyebrow="HTML SITEMAP" title="Всичко на едно място." />
        <section className="wrap sitemap-grid">
          <div>
            <h2>Основни страници</h2>
            <Link href="/">Начална</Link>
            {Object.entries(routeTitles)
              .filter(
                ([key]) =>
                  key && !key.startsWith("legal/") && key !== "sitemap",
              )
              .map(([key, title]) => (
                <Link href={`/${key}`} key={key}>
                  {title}
                </Link>
              ))}
          </div>
          <div>
            <h2>Примерни проекти и статии</h2>
            {projects.map((p) => (
              <Link href={`/portfolio/${p.slug}`} key={p.slug}>
                {p.name}
              </Link>
            ))}
            {articles.map((a) => (
              <Link href={`/blog/${a.slug}`} key={a.slug}>
                {a.title}
              </Link>
            ))}
          </div>
          {!hasPreviewProtections && (
            <div>
              <h2>Правна информация</h2>
              {Object.entries(routeTitles)
                .filter(([key]) => key.startsWith("legal/"))
                .map(([key, title]) => (
                  <Link href={`/${key}`} key={key}>
                    {title}
                  </Link>
                ))}
            </div>
          )}
        </section>
      </>
    );
  const legalContent: Record<string, [string, string][]> = {
    "legal/privacy": [
      [
        "Администратор и контакти",
        "Юридическо лице, ЕИК, адрес и контакт за защита на данните — предстои потвърждение.",
      ],
      [
        "Запитвания и лични данни",
        "Предвидете описание на полетата, целите и правните основания, сроковете за съхранение, получателите и евентуалните международни трансфери.",
      ],
      [
        "Права и упражняването им",
        "Прозрачна информация за приложимите права, контакт за искания и право на жалба до компетентния надзорен орган.",
      ],
      [
        "Външни услуги",
        "Описват се реално използваните доставчици за форми, имейл, хостинг, аналитика и карти. В този прототип няма такива интеграции.",
      ],
    ],
    "legal/cookies": [
      [
        "Опис на използваните технологии",
        "Преди стартиране се прави реален опис на бисквитките, целите, доставчиците и сроковете им. В този прототип няма аналитика и тракери.",
      ],
      [
        "Настройки и избор",
        "В бъдещата версия предвидете разбираем избор за незадължителните технологии и лесен начин за промяна. GA4 и външните вграждания се настройват според приложимите изисквания.",
      ],
      [
        "Външни вграждания",
        "Google Maps е само визуално място в дизайна. Реалното зареждане и обработване на данни се решават след преглед.",
      ],
    ],
    "legal/terms": [
      [
        "Доставчик и предназначение",
        "Потвърдени фирмени данни, контакт и предназначение на информационния сайт.",
      ],
      [
        "Съдържание и права",
        "Условия за използване на текстове, изображения и търговски обозначения. Портфолиото се публикува само с потвърдени права.",
      ],
      [
        "Запитвания",
        "Изпращането на запитване в бъдещия сайт не представлява автоматично сключване на договор. Конкретните условия се уговарят отделно.",
      ],
    ],
    "legal/subscription-terms": [
      [
        "Потвърдено за START",
        `${startPlan.price} €/месец без първоначална такса; до ${startPlan.pages} основни страници. Подробният потвърден обхват е представен в страницата „Планове“.`,
      ],
      [
        "За търговско одобрение",
        "ДДС/данъчен режим, срок на договора, плащане, прекратяване, собственост на домейна, сайта и съдържанието, прехвърляне и подновяване на домейна.",
      ],
      [
        "Работа по абонамента",
        "Процес за промени, неизползвано време, задачи извън обхвата, контакти за поддръжка и време за реакция. Без автоматично обещание за SLA.",
      ],
      [
        "Права на клиентите",
        "Преглед на приложимите условия за частни лица и фирми, преддоговорна информация и приложими потребителски права. Без изготвен окончателен договор.",
      ],
    ],
  };
  return (
    <>
      <PageIntro
        eyebrow="ПРАВНА ИНФОРМАЦИЯ · СТРУКТУРЕН МАКЕТ"
        title={routeTitles[path]}
      >
        <p>
          Това е предложена структура, не действащ правен документ.
          Окончателният текст зависи от фирмените данни, договорните решения и
          реалните технологии.
        </p>
      </PageIntro>
      <div className="prose wrap">
        <p className="editor-note">
          За правен и търговски преглед преди стартиране. Не се използва като
          готов договор или политика.
        </p>
        {legalContent[path]?.map(([title, text]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
      </div>
    </>
  );
}
