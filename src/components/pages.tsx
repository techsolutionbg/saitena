import Link from "next/link";
import {
  articles,
  base,
  projects,
  routeTitles,
  startFeatures,
  type Concept,
} from "@/lib/content";
import { WebsiteArtwork } from "./artwork";
import { InquiryForm, PortfolioGallery } from "./interactive";
import { Arrow, Check } from "./icons";
import {
  ButtonLink,
  CTA,
  FAQ,
  PageIntro,
  PlanCards,
  Process,
  SectionHeading,
} from "./site";

export function ContentPage({
  concept,
  path,
  plan,
}: {
  concept: Concept;
  path: string;
  plan?: string;
}) {
  const root = base(concept);
  if (path === "uslugi")
    return (
      <>
        <PageIntro
          eyebrow="САЙТОВЕ НА АБОНАМЕНТ"
          title="Професионален сайт. Постоянна грижа."
        >
          <p>
            За частни лица, самостоятелни специалисти и малки и средни фирми в
            България. Събираме изработката и текущата техническа поддръжка в
            една услуга.
          </p>
          <ButtonLink concept={concept} to="planove">
            Разгледайте плановете
          </ButtonLink>
        </PageIntro>
        <section className="wrap service-overview">
          <div className="service-art">
            <WebsiteArtwork />
          </div>
          <div>
            <span className="eyebrow">КАКВО ПОЛУЧАВАТЕ</span>
            <h2>Вашето собствено място онлайн.</h2>
            <p>
              Ясна структура, адаптивен дизайн и съдържание, достъпно за хората
              и търсачките. След стартиране — техническа грижа и включено време
              за промени според плана.
            </p>
            <ul className="feature-list">
              {[
                "Дизайн според характера на бизнеса",
                "Удобно разглеждане на телефон и компютър",
                "Ясно представяне на услугите и контакти",
                "Техническа основа за SEO и GEO",
              ].map((text) => (
                <li key={text}>
                  <Check />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>
        <Process concept={concept} />
        <section className="wrap section">
          <SectionHeading
            eyebrow="ПОТВЪРДЕНИЯТ ОБХВАТ"
            title="START: какво включва 50 €/месец."
          />
          <div className="feature-panel">
            {startFeatures.map((feature, i) => (
              <div key={feature}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <p>{feature}</p>
              </div>
            ))}
          </div>
          <p className="demo-note">
            Без първоначална такса. Данъчният режим, срокът, собствеността и
            останалите договорни условия предстои да се уточнят.
          </p>
        </section>
        <CTA concept={concept} />
      </>
    );
  if (path === "planove")
    return (
      <>
        <PageIntro
          eyebrow="АБОНАМЕНТНИ ПЛАНОВЕ"
          title="Изберете добро начало. Оставете място за растеж."
        >
          <p>
            START има потвърдени цена и обхват. MEDIUM и PREMIUM показват
            възможни посоки за надграждане, които ще уточним заедно.
          </p>
        </PageIntro>
        <section className="wrap plans-page">
          <PlanCards concept={concept} full />
        </section>
        <section className="wrap section">
          <SectionHeading
            eyebrow="ЯСНО СРАВНЕНИЕ"
            title="Как могат да се надграждат плановете."
          />
          <div className="table-scroll">
            <table className="comparison">
              <caption>
                Концептуално сравнение — количествените лимити за MEDIUM и
                PREMIUM не са определени.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Обхват</th>
                  <th scope="col">START</th>
                  <th scope="col">MEDIUM · концепция</th>
                  <th scope="col">PREMIUM · концепция</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Месечна цена", "50 €", "Предстои", "Предстои"],
                  [
                    "Основни страници",
                    "До 6",
                    "Разширен обхват",
                    "По-мащабна структура",
                  ],
                  ["Промени месечно", "1 час", "Повече време", "Според целите"],
                  [
                    "Езици",
                    "Български",
                    "За обсъждане",
                    "Втора езикова версия",
                  ],
                  [
                    "Съдържание",
                    "Основни страници",
                    "Блог / каталог",
                    "План за съдържание",
                  ],
                  [
                    "Поддръжка",
                    "Архиви и мониторинг",
                    "START като основа",
                    "MEDIUM като основа",
                  ],
                ].map(([label, ...cells]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {cells.map((cell, i) => (
                      <td key={i}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="wrap section">
          <SectionHeading
            eyebrow="ПРЕДИ ДА ЗАПОЧНЕМ"
            title="Условията трябва да са ясни."
          />
          <FAQ limit={5} />
        </section>
        <CTA concept={concept} />
      </>
    );
  if (path === "portfolio")
    return (
      <>
        <PageIntro
          eyebrow="ПОРТФОЛИО / ДИЗАЙН КОНЦЕПЦИИ"
          title="Всеки бизнес има собствена история."
        >
          <p>
            Три илюстративни проекта показват как структурата и дизайнът могат
            да отразят различни дейности. Реални клиентски проекти ще бъдат
            добавени с потвърдени права и информация.
          </p>
        </PageIntro>
        <section className="wrap portfolio-page">
          <PortfolioGallery concept={concept} />
        </section>
        <CTA concept={concept} />
      </>
    );
  if (path.startsWith("portfolio/")) {
    const project = projects.find((p) => path === `portfolio/${p.slug}`)!;
    return (
      <>
        <div className="wrap breadcrumb">
          <Link href={`${root}/portfolio`}>Портфолио</Link>
          <span>/</span>
          {project.name}
        </div>
        <PageIntro
          eyebrow={`${project.type.toUpperCase()} · ИЛЮСТРАТИВНА КОНЦЕПЦИЯ`}
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
                Примерен бриф: ясно представяне на дейността, удобен мобилен
                преглед и кратък път от интерес към запитване.
              </p>
              <p>
                Не е реален клиентски проект. Няма заявени резултати, срок или
                клиентски отзив.
              </p>
            </div>
            <div>
              <span className="eyebrow">ПРЕДЛОЖЕНА СТРУКТУРА</span>
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
        <CTA concept={concept} />
      </>
    );
  }
  if (path === "za-nas")
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
            ✳
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
        <CTA concept={concept} />
      </>
    );
  if (path === "kontakti" || path === "zapitvane") {
    const website = path === "zapitvane";
    return (
      <>
        <PageIntro
          eyebrow={website ? "ЗАПИТВАНЕ ЗА САЙТ" : "КОНТАКТИ"}
          title={
            website
              ? "Всяка добра идея започва с разговор."
              : "Насреща сме за следващата ви стъпка."
          }
        >
          <p>
            {website
              ? "Разкажете ни накратко за бизнеса и сайта, който си представяте. Не е нужно да имате готов технически бриф."
              : "Имате въпрос за Saitena, плановете или начина на работа? Тук е мястото да го зададете."}
          </p>
        </PageIntro>
        <section className="wrap contact-layout">
          <aside className="contact-aside">
            <span className="eyebrow">
              {website ? "КАКВО СЛЕДВА" : "ДА СЕ СВЪРЖЕМ"}
            </span>
            <h2>
              {website
                ? "Първо разбираме. После предлагаме."
                : "Един ясен разговор е добро начало."}
            </h2>
            <p>
              {website
                ? "В бъдещата работеща версия: преглеждаме запитването, уточняваме нуждите и предлагаме обхват. Срокът за отговор ще бъде потвърден преди стартиране."
                : "Контактният имейл, телефонът, работното време и фирмените данни предстои да бъдат потвърдени."}
            </p>
            <div className="contact-crosslink">
              <span>
                {website ? "Имате общ въпрос?" : "Планирате нов сайт?"}
              </span>
              <Link
                className="text-link"
                href={`${root}/${website ? "kontakti" : "zapitvane"}`}
              >
                {website ? "Обща контактна форма" : "Запитване за изработка"}
                <Arrow />
              </Link>
            </div>
            <div className="map-placeholder">
              <span aria-hidden="true">⌖</span>
              <b>Място за Google Maps</b>
              <p>
                Само след потвърждение на публичен адрес и настройките за
                поверителност. В този прототип не се зарежда външна карта.
              </p>
            </div>
          </aside>
          <InquiryForm
            concept={concept}
            kind={website ? "website" : "contact"}
            initialPlan={plan}
          />
        </section>
      </>
    );
  }
  if (path === "vuprosi")
    return (
      <>
        <PageIntro
          eyebrow="ЧЕСТО ЗАДАВАНИ ВЪПРОСИ"
          title="Ясни отговори за добър старт."
        >
          <p>
            Най-важното за абонамента, включената грижа и условията, които
            предстои да потвърдим.
          </p>
        </PageIntro>
        <section className="wrap faq-page">
          <FAQ />
        </section>
        <CTA concept={concept} />
      </>
    );
  if (path === "blog")
    return (
      <>
        <PageIntro
          eyebrow="БЛОГ / ПОЛЕЗНО"
          title="По-ясен поглед към вашето онлайн присъствие."
        >
          <p>
            Практични материали за хората зад малкия бизнес. Двете примерни
            статии показват бъдещата структура на блога.
          </p>
        </PageIntro>
        <section className="wrap article-grid">
          {articles.map((article, i) => (
            <Link
              href={`${root}/blog/${article.slug}`}
              className="article-card"
              key={article.slug}
            >
              <div
                className={`article-art article-art-${i}`}
                aria-hidden="true"
              >
                <span>{i === 0 ? "сайт\n+ грижа" : "идея\n→ сайт"}</span>
                <i>0{i + 1} / НАРЪЧНИК</i>
              </div>
              <span className="eyebrow">
                {article.category} · Примерен материал
              </span>
              <h2>{article.title}</h2>
              <p>{article.description}</p>
              <span className="text-link">
                Прочетете <Arrow />
              </span>
            </Link>
          ))}
        </section>
        <CTA concept={concept} />
      </>
    );
  if (path.startsWith("blog/")) {
    const article = articles.find((a) => path === `blog/${a.slug}`)!;
    return (
      <>
        <div className="wrap breadcrumb">
          <Link href={`${root}/blog`}>Блог</Link>
          <span>/</span>
          {article.category}
        </div>
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
            <ButtonLink concept={concept} to="planove">
              Вижте абонаментните планове
            </ButtonLink>
          </div>
          <p className="editor-note">
            Преди реално публикуване: редакционен преглед, потвърден автор, дата
            на публикация и дата на актуализация.
          </p>
        </article>
      </>
    );
  }
  if (path === "karta-na-saita")
    return (
      <>
        <PageIntro eyebrow="HTML SITEMAP" title="Всичко на едно място." />
        <section className="wrap sitemap-grid">
          <div>
            <h2>Основни страници</h2>
            <Link href={root}>Начална</Link>
            {Object.entries(routeTitles)
              .filter(
                ([key]) =>
                  key && !key.startsWith("pravni/") && key !== "karta-na-saita",
              )
              .map(([key, title]) => (
                <Link href={`${root}/${key}`} key={key}>
                  {title}
                </Link>
              ))}
          </div>
          <div>
            <h2>Примерни проекти и статии</h2>
            {projects.map((p) => (
              <Link href={`${root}/portfolio/${p.slug}`} key={p.slug}>
                {p.name}
              </Link>
            ))}
            {articles.map((a) => (
              <Link href={`${root}/blog/${a.slug}`} key={a.slug}>
                {a.title}
              </Link>
            ))}
          </div>
          <div>
            <h2>Правна информация</h2>
            {Object.entries(routeTitles)
              .filter(([key]) => key.startsWith("pravni/"))
              .map(([key, title]) => (
                <Link href={`${root}/${key}`} key={key}>
                  {title}
                </Link>
              ))}
          </div>
        </section>
      </>
    );
  const legalContent: Record<string, [string, string][]> = {
    "pravni/poveritelnost": [
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
    "pravni/biskvitki": [
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
    "pravni/uslovia": [
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
    "pravni/abonamentni-uslovia": [
      [
        "Потвърдено за START",
        "50 €/месец без първоначална такса; до 6 основни страници. Подробният потвърден обхват е представен в страницата „Планове“.",
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
