# Общ release план за SEO на Saitena

Статус: кандидат в Draft PR #6, branch `codex/seo-audit-2026-11-17`.
Този план не е разрешение за merge, deployment или индексиране.
Кеширане не се реализира и остава последен отделен етап.

## Подготвен кандидат

- Уникални Next.js metadata, canonical, OG/Twitter и robots за 19 съдържателни
  маршрута; достоверни Organization, WebSite, Service и breadcrumbs JSON-LD.
- Публичните страници вече изпращат основното съдържание като директно видим
  HTML. Премахнати са общите loading boundaries, които изискваха JS за показване
  на скрития content segment. Няма crawler-only версия или дублиращ noscript текст.
- FAQ използва native details/summary и се разгръща без JavaScript. С включен JS
  се запазват контролираните от React въпроси, категории и търсене.
- При забавен HTML transport footer-ът пристига след основното съдържание;
  няма връщане на първоначалния footer CLS. Сравняват се main/H1/footer геометрия,
  текст и screenshots със съществуващия кандидат при четири ширини и две теми.
- Съществуващите 404/308, изображения, canonical query handling и забрани за
  Auth/чернови остават. Auth, Laravel API, клиентският портал, production
  инфраструктурата и паралелните Auth редакции не се включват в тези промени.
- Caddy фрагментите в `.deployment/seo/` са неактивни: постоянен `www` → apex
  redirect, затворен sitemap профил и отделен бъдещ индексируем профил.
  Няма imports към тях от текущи production/Compose/deployment файлове.

## Проверки преди искане за release

Изисква се зелен CI за точния PR head: ESLint, TypeScript, Node/Python tests,
production build, SEO metadata/HTML integration, no-JS и footer CLS browser tests,
Caddy fixtures, HTTPS/SMTP и съществуващите privacy/rollback репетиции.
CI не публикува PR кандидати.

Локалните browser артефакти са в игнорирания `qa-output/seo-rendering/`:
20 baseline/candidate сравнения на крайното оформление, 8 delayed-transport
footer CLS случая и 35 no-JS случая. Отделният layout suite проверява 45
страници/ширини плюс 4 случая с текст 150%. Caddy suite проверява 36 HTTP случая.
Точните резултати и ограничения са в [rendering отчета](seo-rendering-2026-11-17.md).

Не се обявява field CWV/INP pass само от тези проверки. Предишният Lighthouse
одит е лабораторна извадка и не заменя последващия Search Console/CrUX преглед.

## Оставащи одобрения

| Одобрение                            | Точен обхват                                                                              | Какво остава забранено без него                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1. Merge на Draft PR #6              | Прегледаният head SHA и зеленият CI                                                       | Сливане в main                                                                                      |
| 2. Deployment на избран кандидат     | Неизменяем image digest, backup, rollback и GitHub production Environment approval        | Публикуване, включително на noindex версия                                                          |
| 3. Caddy canonical migration         | Exact diff в публичния guarded block, нов paired template/profile hash и rollback receipt | Прилагане на `www` 308 правилото; промяна на текущия Caddy template                                 |
| 4. Фирмени, правни и търговски данни | Реален доставчик/контакти, окончателни политики и приложими условия                       | Обявяване на макетите за окончателни; пълен public release без задължителните потвърждения          |
| 5. Публично индексиране              | Изрично разрешение за noindex removal, public image/config, robots и sitemap edge профил  | Промяна на indexing флагове, премахване на HTTP/meta noindex, отваряне на sitemap в публичния guard |
| 6. Реални блог публикации            | Редакционно одобрение, действителни автор/дати и видими byline данни                      | Article/BlogPosting, индексиране и XML sitemap включване на сегашните примерни материали            |

Одобрения 1 и 2 не означават одобрение 5. Одобрение 3 може да се даде за
noindex release със затворен sitemap. Ако собственикът предпочете един общ
публичен launch, одобрения 2–5 се обединяват в един exact-candidate пакет,
без да се пропускат техните отделни решения.

## Последователност на общия release

1. **Замразяване на кандидата.** Запишете точния commit, CI run и неизменяемия
   image digest. Прегледайте съдържателните и фирмените потвърждения. Никакви
   Auth флагове или API/portal адреси не се включват в SEO пакета.
2. **Caddy preflight преди финалното одобрение.** В разрешен maintenance прозорец
   направете read-only capture на реалния Caddyfile, native active config,
   mounts и текущия normalized-template hash. Secret imports остават извън
   Git и публичните артефакти. Подгответе exact diff само в публичния block.
   Не използвайте стария широк frontend fragment, който съдържа portal блок.
3. **Подготовка на два прегледни профила.** Затвореният профил запазва noindex
   и 404 за `/sitemap` и `/sitemap.xml`. Индексируемият профил използва отделния
   dormant sitemap import и същия reviewed website upstream. Canonical import
   стои след origin/worker отказите и преди sitemap/fallback proxy обработката.
4. **Валидация и репетиция.** Изпълнете `caddy validate`/`adapt` на пълния
   предложен файл с реалните imports в изолирана среда. Сравнете всички други
   host blocks. Репетирайте backup, парното превключване template/profile,
   acceptance и връщане на точната предходна версия. Съществуващият deploy agent
   правилно отказва нов template без отделно одобрен matching profile; тази
   проверка не се отслабва и текущият production receipt не се редактира тук.
5. **Финално owner одобрение.** Представете commit/image digest, exact Caddy
   diff, matching profile hash, backup/rollback артефактите и избрания indexing
   режим. Едва след конкретното одобрение може да се извършат merge/deployment
   и съответната Caddy миграция. Текущият Draft PR сам не разрешава тези действия.
6. **Само при одобрено индексиране.** Постройте `public` image с
   `NEXT_PUBLIC_INDEXING_ENABLED=true`, запазени Auth ограничения и съгласуван
   Caddy indexing профил. Сменете само затворения sitemap import и остарелия
   noindex override за публичния сайт. Не променяйте robots/header политики
   на други hostnames. Потвърдете crawl access през CDN и origin guards.
7. **Независима acceptance проверка.** Проверете реалните отговори отвън преди
   приемане. При отклонение върнете целия предходен комплект image + routing
   template + profile/receipt. При неуспешно възстановяване използвайте
   съществуващия fail-closed/watchdog механизъм, без отключване на origin.
8. **Search onboarding.** След одобрения launch и установена собственост
   подайте XML sitemap в Search Console/Bing Webmaster Tools, използвайте URL
   Inspection и Rich Results Test и проследете crawling, индексиране и field CWV.
   Кеширането остава след това като последна отделно възложена оптимизация.

## Acceptance матрица

| Проверка                             | Noindex release                                                      | Одобрено индексиране                                                |
| ------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Основни страници без JS              | Видим H1, реален текст, изображения и вътрешни връзки                | Същото съдържание                                                   |
| Meta/HTTP robots                     | noindex запазен                                                      | index само за одобрени страници; draft/legal noindex остава         |
| `robots.txt`                         | `Disallow: /`                                                        | Allow за публичните страници, защитените маршрути остават изключени |
| `/sitemap`, `/sitemap.xml` отвън     | 404 в затворения edge профил                                         | 200, XML с 13 уникални canonical URL-а при сегашния каталог         |
| `https://www.saitena.com/path?query` | 308 към apex след одобрение 3                                        | 308 към същия path/query на apex                                    |
| HTTP www / apex                      | Проверен постоянен HTTPS redirect със запазен URI; възможни два hops | Същото, или отделно одобрен single-hop exact-host edge rule         |
| Липсващи публични адреси/изображения | Действителен 404                                                     | Действителен 404, без homepage canonical                            |
| Legacy адреси                        | Постоянен 308 към каноничната страница                               | Същото                                                              |
| Origin/CF-Worker откази              | 403 преди redirect/proxy                                             | Запазени 403 преди redirect/proxy                                   |
| Footer                               | Без stream completion footer shift                                   | Същото                                                              |
| Auth/API/portal/други hostnames      | Без SEO промяна                                                      | Без SEO промяна                                                     |

Проверявайте escaped paths, повторени query ключове, trailing slash и
`?plan=START`/блог филтри. Canonical, `og:url`, XML sitemap и redirect destination
трябва да използват един и същ HTTPS apex origin. Не отваряйте чернови, за да
получите изкуствено по-голяма sitemap.
