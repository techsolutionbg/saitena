import Link from "next/link";
import { architecture, base, concepts, conceptKeys } from "@/lib/content";
import { HeroArtwork } from "@/components/artwork";
import { Arrow, Mark } from "@/components/icons";

export default function DesignReview() {
  return (
    <div className="design-review">
      <header className="review-header review-wrap">
        <Link href="/" className="brand">
          <Mark />
          <span>saitena.</span>
        </Link>
        <span>
          СТРУКТУРА & ДИЗАЙН <i>/</i> ЕТАП 01
        </span>
        <a href="#decisions" className="review-outline">
          За одобрение <Arrow />
        </a>
      </header>
      <main id="main">
        <section className="review-intro review-wrap">
          <span className="eyebrow">
            <span className="status-dot" /> НОВО ПРИСЪСТВИЕ. ТРИ ПОСОКИ.
          </span>
          <h1>
            Една идея.
            <br />
            Три начина да <em>оживее.</em>
          </h1>
          <div className="review-intro-bottom">
            <p>
              Визуални концепции за Saitena — професионални сайтове на
              абонамент. Разгледайте, сравнете и изберете посоката за следващия
              етап.
            </p>
            <a href="#concepts" className="review-scroll">
              Разгледайте концепциите <span>↓</span>
            </a>
          </div>
        </section>
        <section
          id="concepts"
          className="review-wrap concept-list"
          aria-label="Три визуални концепции"
        >
          {conceptKeys.map((key) => {
            const concept = concepts[key];
            return (
              <article
                className={`concept-review-card review-card-${key}`}
                key={key}
              >
                <div className="concept-card-copy">
                  <div className="concept-card-number">
                    <span>КОНЦЕПЦИЯ / {concept.number}</span>
                    {concept.recommendation && <b>Препоръчана посока ↗</b>}
                  </div>
                  <h2>{concept.name}</h2>
                  <span className="concept-label">{concept.label}</span>
                  <p>{concept.description}</p>
                  <div className="palette">
                    {concept.palette.map((color) => (
                      <span
                        key={color}
                        style={{ background: color }}
                        title={color}
                      >
                        <span>{color}</span>
                      </span>
                    ))}
                  </div>
                  <div className="concept-type">
                    Aa{" "}
                    <span>
                      {concept.font}
                      <small>Кирилица · локални шрифтове</small>
                    </span>
                  </div>
                  <div className="concept-card-actions">
                    <Link className="review-solid" href={base(key)}>
                      Разгледайте сайта <Arrow />
                    </Link>
                    <Link
                      href={`/preview/${key}`}
                      className="mobile-preview-link"
                    >
                      Мобилен преглед ↗
                    </Link>
                  </div>
                </div>
                <Link
                  className={`concept-miniature site theme-${key}`}
                  href={base(key)}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <div className="miniature-header">
                    <span className="brand">saitena.</span>
                    <span>Сайтът ви е в добри ръце. ↗</span>
                  </div>
                  <div className="miniature-hero">
                    <div>
                      <small>ВАШИЯТ ДИГИТАЛЕН ПАРТНЬОР</small>
                      <h3>
                        {concept.title.map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </h3>
                      <span className="miniature-cta">Да започнем ↗</span>
                    </div>
                    <HeroArtwork variant={key} />
                  </div>
                  <div className="miniature-bottom">
                    ДИЗАЙН &nbsp; + &nbsp; ПОДДРЪЖКА &nbsp; + &nbsp; РАЗВИТИЕ
                  </div>
                </Link>
              </article>
            );
          })}
        </section>
        <section className="review-wrap recommendation">
          <span className="eyebrow">ПРЕПОРЪКАТА</span>
          <div>
            <h2>
              „Ясно напред“.
              <br />
              Уверен старт за широка аудитория.
            </h2>
            <p>
              Първата концепция обяснява абонаментния модел най-бързо. Светлата
              среда, четливата типография и ясните следващи стъпки подхождат
              едновременно на частни лица, специалисти и малки фирми.
            </p>
            <p>
              Топлата посока е силна за лични и творчески марки. Тъмната е
              по-смела, но по-тясно насочена към технологични и дигитални
              бизнеси.
            </p>
            <Link href={base("clarity")} className="text-link">
              Отворете препоръчаната концепция <Arrow />
            </Link>
          </div>
        </section>
        <section id="structure" className="architecture-section">
          <div className="review-wrap">
            <div className="review-section-heading">
              <span className="eyebrow">ИНФОРМАЦИОННА АРХИТЕКТУРА</span>
              <h2>
                Ясна структура.
                <br />
                Без излишни страници.
              </h2>
              <p>
                Предложени публични маршрути. В прототипите те имат префикс{" "}
                <code>/concepts/…</code>, за да могат трите посоки да се
                сравняват.
              </p>
            </div>
            <div className="architecture-table">
              {architecture.map(([route, title, description], i) => (
                <div key={route}>
                  <span className="architecture-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <code>{route}</code>
                  </div>
                  <p>{description}</p>
                </div>
              ))}
            </div>
            <div className="architecture-notes">
              <article>
                <span>01 / НАВИГАЦИЯ</span>
                <h3>Малко избори. Ясна следваща стъпка.</h3>
                <p>
                  Сайтове на абонамент · Планове · Портфолио · За нас ·
                  Контакти. Основен бутон „Да поговорим“. FAQ, блог, HTML карта
                  и правни страници във футъра.
                </p>
              </article>
              <article>
                <span>02 / SEO + GEO</span>
                <h3>Една потребност. Една основна страница.</h3>
                <p>
                  Услугата е събрана в /uslugi. Блогът отговаря на въпроси;
                  бъдещите тематични страници имат собствена цел и примери. Без
                  дублиращи градски страници и обещания за AI класиране.
                </p>
              </article>
              <article>
                <span>03 / БЪЛГАРСКИ → АНГЛИЙСКИ</span>
                <h3>Подготвено за следващ език.</h3>
                <p>
                  Български на корена, бъдещ английски под /en. Общ модел за
                  съдържание и отделна карта на преведените маршрути. hreflang
                  след пълен превод; без празни EN страници.
                </p>
              </article>
            </div>
          </div>
        </section>
        <section className="review-wrap decisions-section" id="decisions">
          <div className="review-section-heading">
            <span className="eyebrow">ПРЕДИ СЛЕДВАЩИЯ ЕТАП</span>
            <h2>Решенията са ваши.</h2>
            <p>Прегледайте тези точки преди пълна функционална разработка.</p>
          </div>
          <div className="decisions-grid">
            {[
              [
                "Визуална посока",
                "Избор на концепция; окончателно лого, цветове, типография и тон на текстовете.",
              ],
              [
                "Структура и съдържание",
                "Одобрение на маршрутите, менюто, началната страница и полетата в двете форми.",
              ],
              [
                "Планове и търговски условия",
                "Обхват и цени на MEDIUM/PREMIUM; ДДС за START, срок, прекратяване, собственост, домейн и работа извън включения час.",
              ],
              [
                "Реални данни и материали",
                "Юридическо лице, контакти, екип, реални проекти и права върху изображенията.",
              ],
              [
                "Поверителност и външни услуги",
                "Правни текстове, обработване на запитвания, GA4, Maps, бисквитки и настройки за избор.",
              ],
              [
                "Следващ етап и публикуване",
                "Изрично одобрение за функционална разработка. Хостинг, production и инфраструктура се обсъждат отделно.",
              ],
            ].map(([title, text], i) => (
              <article key={title}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="review-wrap scope-note">
          <Mark />
          <div>
            <h2>Тук приключва етап 1.</h2>
            <p>
              Само структура и адаптивен дизайн. Формите са демонстрационни.
              Няма профили, поръчки, плащания, административен панел или
              production deployment. Замразената хостинг платформа не е
              променяна.
            </p>
          </div>
          <a href="#concepts">Към концепциите ↑</a>
        </section>
        <section className="review-wrap research-sources">
          <h2>Източници за архитектурата</h2>
          <p>
            Официални насоки, проверени на 13.11.2026. Конкретната структура и
            визуалните концепции са предложения за Saitena.
          </p>
          <div>
            <a
              href="https://developers.google.com/search/docs/appearance/ai-features"
              target="_blank"
              rel="noreferrer"
            >
              Google: SEO и AI резултати ↗
            </a>
            <a
              href="https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites"
              target="_blank"
              rel="noreferrer"
            >
              Google: многоезични сайтове ↗
            </a>
            <a
              href="https://developers.google.com/search/docs/essentials/spam-policies"
              target="_blank"
              rel="noreferrer"
            >
              Google: doorway страници ↗
            </a>
            <a
              href="https://europa.eu/youreurope/business/growing/digitalising/online-privacy/index_en.htm"
              target="_blank"
              rel="noreferrer"
            >
              Your Europe: поверителност и бисквитки ↗
            </a>
          </div>
        </section>
      </main>
      <footer className="review-footer review-wrap">
        <span>SAITENA / ДИЗАЙН ПРЕГЛЕД</span>
        <span>13.11.2026 · Next.js / React / TypeScript</span>
      </footer>
    </div>
  );
}
