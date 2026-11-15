# Saitena Website — „Ясно напред“

Публичният сайт на Saitena за изработка на сайтове на месечен абонамент. Проектът е в локален етап на разработка: има адаптивни страници, светла/тъмна тема, интерактивни FAQ и блог, карта и изпращане на контактни съобщения към **локален Mailpit**. Auth flow се разработва срещу отделен локален Laravel API; production deployment и интеграция не са конфигурирани.

## Преди работа

Прочетете [AGENTS.md](AGENTS.md) и [локалното умение saitena-development](.agents/skills/saitena-development/SKILL.md). Работете в съществуващия проект, пазете паралелните промени и не инициализирайте нов проект или Git repository.

Не променяйте хостинг платформата, други проекти, production услуги, DNS, Cloudflare или поддомейни. Не спирайте чужди процеси/контейнери и не извършвайте глобално Docker почистване. Нови зависимости и инфраструктура се добавят само при реална необходимост.

За предаване към друг AI има подробен [контекст на проекта](docs/AI-HANDOFF.txt). [Предложението от етап 1](docs/stage-1.md) и част от старите screenshots са исторически. Текущият дизайн е единствено „Ясно напред“; изборът между три концепции не трябва да се възстановява.

## Технологии

- Next.js **16.4.6**, App Router; React **19.3.1**; strict TypeScript **7.0.2**.
- CSS Modules и общи семантични CSS променливи; без Tailwind или тежки анимационни библиотеки.
- Manrope за основния интерфейс, Segoe UI за параграфите; локални font assets чрез `@fontsource`.
- Leaflet **1.9.4** за OpenStreetMap; Nodemailer **10.5.0** за локалната поща.
- Prettier **3.10.1**. Няма конфигуриран ESLint script.
- Последно използвана локална среда: Node.js **24.20.0**, npm и Windows PowerShell. Точните зависимости са в `package.json` и `package-lock.json`.

Съдържанието се управлява през кода в `src/lib/`. Няма CMS, база данни или административен панел. Езикът е български; английската версия е само архитектурно подготвена чрез `src/lib/i18n.ts`. Всички актуални slug-ове са на английски.

## Локално стартиране

Изпълнявайте командите от **актуалната коренова папка на проекта**, включително след преместване. Запазете скритите `.env`, `.agents` и `.vscode`, както и `package-lock.json`, `public/` и `docs/`.

```powershell
# При първоначална инсталация или възстановяване на dependencies:
npm ci

npm run dev
```

Адрес: [http://127.0.0.1:3000](http://127.0.0.1:3000). Dev сървърът слуша само на loopback интерфейса. Преди стартиране проверете дали вече няма работещ процес. При зает порт използвайте например `npm run dev -- --port 3100`, без да спирате чужди услуги.

Next.js Fast Refresh прилага записаните промени в компонентите и CSS; при необходимост прави пълно презареждане. Не е нужен build след всяка редакция. `npm run start` обслужва предварително изпълнен `npm run build` и няма Fast Refresh.

## Локална автентикация с портала и API

Auth страниците на този сайт използват локалния Laravel API. Порталът `apps/web` работи на втори порт, а отделният Docker Compose project създава собствена MariaDB база и volume. Не използвайте production API за локални регистрации.

Проверете, че портовете 3000, 3001, 8001 и 18027 са свободни. От repository root стартирайте изолирания API, портала и техния собствен Mailpit:

```powershell
$env:SAITENA_PORT = "3000"
$env:WEB_PORT = "3001"
$env:API_PORT = "8001"
docker compose --project-name saitena-website-auth-dev up -d api web
```

За проверка на verification/reset писмата към същия изолиран проект добавете локалния auth override:

```powershell
docker compose -f compose.yaml -f apps/saitena/compose.auth-dev.yaml --project-name saitena-website-auth-dev up -d api web mailpit
```

Auth Mailpit е достъпен само локално на [http://127.0.0.1:18027](http://127.0.0.1:18027). Той приема SMTP само от auth-dev Compose мрежата; не препраща към реална поща. Тестовите email адреси са `example.test`.

Стартирайте този проект в отделен терминал от `apps/saitena`:

```powershell
npm run dev
```

Публичният сайт е на `http://127.0.0.1:3000`, порталът — `http://127.0.0.1:3001`, API — `http://127.0.0.1:8001`. Локалните `.env` файлове сочат единствено към API на loopback. Не отваряйте сайт през `localhost`, докато използвате API на `127.0.0.1`; използвайте един hostname, за да се споделят локалните cookies. `apps/saitena` в development отказва заявки към отдалечен API адрес.

За спиране използвайте същото project име и `docker compose --project-name saitena-website-auth-dev down`. Не добавяйте `-v`, ако искате да запазите изолираната локална база между сесиите.

За преглед от телефон/друго устройство в същата мрежа, при работещ dev сървър на порт 3000, в отделен терминал:

```powershell
npm run dev:lan
```

Използвайте LAN адреса, отпечатан от командата, обикновено на порт **3001**. Не разчитайте на стар IP адрес след преместване или смяна на мрежата. Това е HTTP/WebSocket proxy към съществуващия dev процес, а не втори Next сървър. Има проверки за подмрежа, Host и Origin. Не променя автоматично Firewall или DNS. Настройки и ограничения: [локална мрежа](docs/local-network.md).

## Публични контакти и `.env`

При липса на собствен файл копирайте `.env.example` в `.env.local` или `.env`. **Не презаписвайте вече попълнен `.env`.** Настройките са:

```dotenv
SAITENA_CONTACT_EMAIL=
SAITENA_CONTACT_PHONE=
SAITENA_VIBER_URL=
```

Стойностите не се публикуват в документацията. Валидирането е в `src/lib/contact-links.ts`. Телефонът може да е в български формат с начална `0`, който се преобразува към `+359` за `tel:` връзката, или в международен формат с `+`/`00`. Невалидните стойности не стават активни връзки.

Плаващият телефонен бутон долу вдясно използва същата настройка. При липсващ/невалиден номер се показва неактивен. При промени в env проверете презареждането на dev средата; production build със статични страници трябва да се обнови чрез нов build.

Подробности: [контактни настройки](docs/contact-details.md).

## Локална контактна поща

При необходимост от тестване на формата стартирайте Docker Desktop и:

```powershell
npm run mail:up
npm run dev
```

Ако dev вече работи, не стартирайте втори процес.

- Mailpit UI: [http://127.0.0.1:18025](http://127.0.0.1:18025).
- SMTP: `127.0.0.1:11025`.
- Compose: `compose.mailpit.yaml`, project `saitena-website-mail`, container `saitena-website-mailpit`.
- Named volume: `saitena-website-mailpit-data`; данните се запазват независимо от преместването на source папката.

Development по подразбиране изпраща от `contact@saitena.test` към `inbox@saitena.test`, с адреса на посетителя като Reply-To. За production е добавен отделен server-side SMTP механизъм, който изисква изрично конфигурирани credentials, TLS и фиксиран служебен получател. При липсваща конфигурация връща 503. Няма автоматично писмо до посетителя. Настройки, HTTPS staging и ограничения: [production подготовка](docs/production-preparation-2026-11-15.md).

Формата блокира повторно изпращане, деактивира полетата и бутона при заявка и показва loading състояние. След приемане от SMTP показва центриран диалог за успех и изчиства полетата; при грешка запазва въведеното. Има server validation, Origin/Host проверки и локален rate limit. Това не е завършена production антиспам система. Вариантът на формата `kind="website"` остава демонстрационен.

Подробности: [локална тестова поща](docs/local-contact-mail.md).

## Маршрути и навигация

| Адрес                              | Съдържание                               |
| ---------------------------------- | ---------------------------------------- |
| `/`                                | Начална страница                         |
| `/about`                           | За нас                                   |
| `/services`                        | Услуги                                   |
| `/portfolio` и `/portfolio/[slug]` | Проекти и подробни проектни страници     |
| `/prices`                          | Ориентировъчни цени, планове и сравнение |
| `/faq`                             | Често задавани въпроси                   |
| `/contact`                         | Контактна страница, карта и форма        |
| `/blog` и `/blog/[slug]`           | Публикации и статии                      |
| `/sitemap`                         | HTML карта на сайта                      |
| `/legal/privacy`                   | Поверителност                            |
| `/legal/cookies`                   | Бисквитки                                |
| `/legal/terms`                     | Условия за ползване                      |
| `/legal/subscription-terms`        | Абонаментни условия                      |

Редът на главното меню е **За нас → Услуги → Портфолио → Цени → ЧЗВ → Блог → Контакти**. Desktop и mobile използват един източник — `mainNavigation` в `src/lib/navigation.ts`.

Старите български адреси са permanent redirects. Важни примери: `/plans` и `/planove` → `/prices`; `/vuprosi` → `/faq`; `/kontakti`, `/inquiry` и `/zapitvane` → `/contact`. Плановете водят към `/contact?plan=START|BUSINESS|PREMIUM`; няма отделна активна страница за поръчка. Пълните redirect правила са в `next.config.ts` и legacy route компонента.

## Дизайн и реализирани страници

Една дизайн система с две теми, управлявани чрез `data-theme` и семантичните tokens в `src/app/globals.css`. Използвайте общия `Brand` и активите в `public/brand`, както и SVG иконите от `src/components/ui/icons.tsx`.

Текущата базова типография при 100% text scale е: основен текст **18 px / 400**, компактни заглавия **24 px / 600**, секционни заглавия **28–40 px / 600**, малки надписи **14 px**. На телефон до 640 px базовите стойности са съответно **16 / 22 / 26 / 13 px**. Hero H1 могат да имат одобрена отделна скала. Правилата в [AGENTS.md](AGENTS.md) следват тази система от визуални роли и общо мащабиране; няма универсално ограничение всички заглавия да бъдат 24 px. Контролите са описани в [типографията](docs/typography.md).

Долу вляво popup „Изглед“ предлага истински checkbox за тема, управление на canvas вълните и **общ размер на текста 80–150%**, през 10%. Темата и text scale се запазват локално. Смяната на тема има ефект с полумесец, когато браузърът го поддържа; анимациите се съобразяват с reduced motion. На малки екрани контролите са в долната част на мобилния sidebar.

Header се прибира при скрол надолу и се показва при скрол нагоре. Mobile sidebar е modal dialog с икони и управление с клавиатура. На мястото на стария header CTA има **визуални контроли за количка и профил**. Профилът може да получи име/фамилия чрез props, но няма реализирано удостоверяване или количка; контролите са неактивни.

- **Начална:** центриран Hero с canvas вълни; full-width лента с предимства със стъпково движение/паузи; четири съдържателни секции; четири проекта на desktop/два на phone; индивидуална оферта; FAQ и CTA. Няма планови карти на началната страница.
- **Услуги:** `ServicesHero` → `ServicesCatalog` с шест услуги → `WorkProcess` с пет етапа → `ServicesCTA`. Използват отделни оптимизирани илюстрации и работещи връзки.
- **Цени:** `PricesHero` → индивидуална оферта → планови карти → подробно сравнение → условия/сигурност → FAQ. На phone сравнението е в три отделни разгъваеми блока; START е отворен първоначално и само един план може да е отворен. Има slide animation, обяснителни диалози за характеристиките и навигация между тях.
- **Портфолио:** двуколонен Hero, центрирани филтри, карти с анимация при филтриране и скрол; три колони desktop, две tablet, една phone; CTA след галерията. Наличните четири проекта са примерни и предстои замяната им с реални.
- **FAQ:** универсален компонент с динамични items, slide animation и само един отворен въпрос. Пълната страница има теми в sidebar и търсене. При Tab към следващ въпрос той се отваря; текстът на отговорите не е justify. Home и Prices използват общия `FAQPreview`, с отделни подходящи въпроси.
- **Контакти:** full-width Hero и контактни карти, OpenStreetMap/Leaflet над формата, локално изпращане и success dialog. Пинът за гр. Дупница, ул. „Благодарност“ 9а отваря Google Maps directions. Адресът/координатите са в `src/lib/office-location.ts`.
- **Блог:** отделен Hero; каталог с реалните две публикации, категории и броячи, search, празно състояние, pagination и избор 6/9/12. URL пази `category`, `search`, `page`, `perPage`; филтрираните резултати се изобразяват и на сървъра. Дати липсват и не са измислени; reading time се изчислява. С две статии има една страница, а логиката за повече е проверена с тестови данни. Няма newsletter система — вторият Hero CTA е „Всички публикации“.

Общият `ScrollReveal` осигурява последователно появяване на story секции, планове, security карти, проекти и блог карти. Публикациите използват 650ms duration и 0/110/220ms закъснение; анимацията се възстановява при промяна на показаните резултати. При reduced motion и без JavaScript съдържанието остава видимо, а keyboard focus показва картата веднага.

Route loading spinner има в `src/app/loading.tsx` и `[...slug]/loading.tsx`. Той е Next.js fallback за зареждащ route, а не изкуствено изчакване на всички lazy изображения.

## Абонаментни планове

Единният източник е `src/lib/plans.ts`:

| План     | Цена / месец | Основни страници | Месечни промени | Общо имейл пространство |
| -------- | ------------ | ---------------- | --------------- | ----------------------- |
| START    | 30 €         | до 6             | до 2 часа       | 1 GB                    |
| BUSINESS | 50 €         | до 12            | до 4 часа       | 5 GB                    |
| PREMIUM  | 70 €         | до 20            | до 6 часа       | 10 GB                   |

Цените са **ориентировъчни**; крайната оферта зависи от нуждите на проекта. Има възможност за индивидуална оферта и текст за нерегистрация по ДДС. Labels „потвърден/предложен план“ са премахнати от UI; в модела още има `proposed` flags. BUSINESS е визуално акцентиран.

Не връщайте старите стойности START 50 € или MEDIUM. Характеристиките, SEO/GEO нивата и подробните пояснения се управляват в `plans.ts` и `plan-feature-help.ts`. Изброяването на услуги като GA4, Search Console или XML sitemap в търговските планове не означава, че тези интеграции са инсталирани в самия публичен сайт.

## Основни файлове

| Файл/директория                                                           | Отговорност                                                 |
| ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `src/app/layout.tsx`, `globals.css`, `artwork.css`                        | Общо оформление, теми, typography и графични макети         |
| `src/app/[...slug]/page.tsx`                                              | Маршрути, metadata, query input; `/blog` чете search params |
| `src/components/pages/pages.tsx`                                          | Композиция на вътрешните страници                           |
| `src/components/home/home.tsx`                                            | Композиция на началната страница                            |
| `src/components/layout/`                                                  | Header, Footer, Brand, AccountActions                       |
| `src/components/appearance/`                                              | Настройки на тема, текст и анимации                         |
| `src/components/ui/`                                                      | Икони, бутони, заглавия, ScrollReveal, FeatureHelp          |
| `src/components/contact/`                                                 | Форма, success dialog, карта, контакти и FloatingCall       |
| `src/components/blog/`                                                    | Hero, каталог, карти и pagination                           |
| `src/lib/content.ts`                                                      | Основни страници, примерни проекти и текстове на статиите   |
| `src/lib/plans.ts`, `plan-feature-help.ts`, `plans-faq.ts`                | Планове, пояснения и въпроси за цени                        |
| `src/lib/faq-content.ts`, `faq.ts`                                        | FAQ съдържание и типове                                     |
| `src/lib/blog-posts.ts`, `blog-catalog.ts`                                | Адаптер за статии, филтриране и странициране                |
| `src/lib/contact-links.ts`, `contact-message.ts`, `local-contact-mail.ts` | Публични връзки, валидация и локален SMTP                   |
| `public/brand/`, `public/images/`                                         | Брандиране и оптимизирани визуални assets                   |

Компонентите са разделени по предназначение; пълната организация е в [components README](src/components/README.md). Не възстановявайте старите смесени `site.tsx`/`interactive.tsx`.

## Форматиране и автоматично обновяване

```powershell
npm run format:file -- "src/components/pricing/plan-cards.tsx"
npm run format:check -- "src/components/pricing/plan-cards.tsx"
npm run format:watch -- "src/components/pricing/plan-cards.tsx"
```

Използват се локалният Prettier, `.prettierrc.json` и `.prettierignore`. Подайте конкретни файлове. Watcher следи избрания файл, поддържа atomic save, не презаписва при синтактична грешка и се спира с Ctrl+C.

За VS Code `.vscode/settings.json` включва **Format on Save**, а `.vscode/extensions.json` препоръчва `esbenp.prettier-vscode`. Разширението трябва да е инсталирано/активно. Има и task **Saitena: Форматирай текущия файл**. Използвайте editor formatting или watcher за съответния файл, без глобални настройки.

## Проверки

```powershell
npm run typecheck
npm run build
npm run test:contact
node --test tests/contact-links.test.mjs
node --test tests/blog-catalog.test.mjs
```

За SMTP integration проверката, само при стартирани Next dev и Mailpit:

```powershell
npm run test:contact:integration
```

Integration тестът изпраща тестово писмо към локалния Mailpit и проверява получаването; не изпраща до реален адрес. Unit тестовете не изискват работещ сайт/контейнер. Няма `npm run lint`: не отчитайте ESLint като преминал. Prettier проверява форматиране, не замества lint.

За UI промени проверявайте релевантните desktop/tablet/phone изгледи, двете теми, keyboard focus и reduced motion. Screenshots са в `docs/screenshots/selected/`; част от тях показват стари варианти. В Windows sandbox build понякога изисква разрешение за генерираните `.next` файлове. Build не публикува сайта.

## SEO и оставащи ограничения

Съдържанието е server-rendered, използва семантичен HTML и metadata. Въпреки `robots: index/follow` в root metadata, preview средата реално е ограничена чрез **`X-Robots-Tag: noindex, nofollow, noarchive`** в `next.config.ts` и `robots.txt` с `Disallow: /`. Не премахвайте тези ограничения без отделно решение за публикуване.

`/sitemap` е HTML карта. В текущата структура няма генератор `src/app/sitemap.ts` за XML sitemap.

Production SMTP кодът е проверен в изолиран HTTPS staging с Mailpit; реален transport още не е конфигуриран. Auth страниците използват локалния Laravel API; production регистрацията остава изключена. CMS, backend за количка, поръчки, плащания, admin панел, newsletter и AI chatbot не са реализирани в публичния сайт. Аналитичните услуги в плановете не са доказателство за настроена аналитика на този сайт.

Правните страници са първоначални текстове/структури и изискват преглед преди публично използване. Примерните проекти и публикации предстои да се редактират от собственика. Не измисляйте дати, клиенти, отзиви, гаранции за сигурност или SEO резултати.

## Подробна документация

- [Дизайн система](docs/design-system.md), [типография](docs/typography.md), [настройки за изглед](docs/appearance-controls.md), [брандиране](docs/brand-assets.md).
- [Начална Hero](docs/home-hero.md), [Services Hero](docs/services-hero.md), [каталог с услуги](docs/services-catalog.md), [етапи на работа](docs/work-process.md), [Services CTA](docs/services-cta.md).
- [Планове](docs/subscription-plans.md), [Prices Hero](docs/prices-hero.md), [мобилна анимация на сравнението](docs/mobile-plan-animation.md).
- [Portfolio Hero](docs/portfolio-hero-redesign.md), [Portfolio CTA](docs/portfolio-cta.md).
- [FAQ компонент](docs/faq-component.md), [FAQ директория](docs/faq-directory.md).
- [Контактни настройки](docs/contact-details.md), [локална поща](docs/local-contact-mail.md), [карта](docs/office-map.md), [LAN преглед](docs/local-network.md).
- [Blog Hero](docs/blog-hero.md), [блог каталог](docs/blog-catalog.md), [предаване към друг AI](docs/AI-HANDOFF.txt).

Документацията описва текущата реализация; точните стойности и поведение се проверяват в съответния код. Историческите предложения и screenshots не са основание за възстановяване на заменен дизайн.
