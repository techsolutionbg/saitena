# Public rendering и dormant Caddy SEO конфигурация

Продължение на Draft PR #6 върху `30b81b2`, 17 ноември 2026 г.
Това е разработен и проверен кандидат. Няма production reload, merge,
публикуване, noindex removal, кеширане или промени по Auth/API/portal.

## Причина и решение

Двете автоматични loading граници (`app/loading.tsx` и catch-all loading)
обвиваха публичните страници в Suspense. Полученото HTML съдържаше реалните
текстове и H1 в скрит React `S:` сегмент, докато `main` показваше loading UI.
При изключен JS замяната на сегмента не се изпълняваше.

Границите и неизползваният им stylesheet са премахнати. Основното публично
съдържание пристига в директно видим HTML преди footer-а. Няма UA-specific
markup, повторено noscript съдържание, ново извличане на данни, caching настройка
или промяна на Next.js зависимостите. При client navigation се изчаква готовата
страница. Съществуващите Auth компоненти, маршрути и флагове не са редактирани;
текущите production Auth redirects остават проверени от candidate suite.

FAQ вече е native `details`/`summary`: отговорите се отварят и без JS. React
запазва контролираните accordion state, търсене и категории при включен JS.
Съществуващият вид е запазен, включително нормалният letter spacing от предишния
button, размерите, цветовете, borders и keyboard focus. Нативно затвореният
disclosure управлява достъпността на отговора; няма постоянно aria-hidden върху
отговор, който no-JS потребителят може да отвори.

## Дизайн и footer CLS

Записан е baseline от предишния noindex PR кандидат, преди rendering промените.
Сравнени са `main`, H1 и footer позиции/размери и точният видим текст при
375/768/1366/1920 px, в светла и тъмна тема: 20 сравнения върху началната,
услугите, цените и FAQ. Допустимото геометрично отклонение е максимум 1 px.
Това сравнение минава и след native FAQ промяната.

[Машинно четимото резюме](seo-rendering-evidence-2026-11-17.json) записва
точно 0 px разлика в тези 20 случая, no-JS резултатите и Caddy fixture проверките.

В осем отделни случая HTML transport е разделен преди `main` и преди footer,
с 350/650 ms закъснения. PerformanceObserver не отчита footer layout shifts;
няма client/hydration грешки. Footer-ът се визуализира след готовото основно
съдържание и остава под първоначалния viewport. Това запазва поведението от
предишната CLS корекция без loading placeholder.

Историческият `tests/browser/loading-layout.mjs` вече е compatibility entry
към актуалната регресия `public-rendering.mjs`; старото очакване за скрит stream
segment е заменено с проверки за директно видим HTML и забавен transport.
Предишните Lighthouse стойности в `footer-cls-2026-11-17.md` са исторически,
не нови измервания на този кандидат. Не се твърди field CWV/INP pass.

## HTML, metadata и ресурси

- 35 no-JS браузърни случая: 15 публични страници с обикновен user agent и
  начална/услуги/контакти/примерна статия с Googlebot, Bingbot, OAI-SearchBot,
  PerplexityBot и Claude-SearchBot. H1 е видим, основният текст е достъпен,
  няма loading placeholder, canonical е правилен и JSON-LD се парсва.
- Отделната layout регресия покрива 45 страници/ширини и 4 проверки с текст
  150%. Проверяват се видими headings, alt атрибути, overflow и JS грешки.
- Реалният HTTP integration тест отказва HTML със скрит `S:` segment или
  стария loading текст. Продължава да проверява metadata, canonical,
  OG/Twitter, robots, structured data, query варианти, 404 и 308.
- Изображенията и вътрешните линкове се проверяват с read-only обхода
  `audit-public-seo.mjs`; не се изпращат форми и не се извикват мутиращи API.
- При noindex XML sitemap остава празна в приложението, а публичният edge
  продължава да я блокира. Бъдещият `public` профил има 13 canonical URL-а;
  черновите/правните макети остават изключени независимо от общия indexing флаг.

## Caddy подготовка

Трите фрагмента в `.deployment/seo/` не са включени в действащите deployment
файлове. `canonical-www.caddy` подготвя HTTP 308 към HTTPS apex със същия URI.
`sitemaps-closed.caddy` задържа 404/noindex; `sitemaps-indexing-approved.caddy`
е отделен dormant кандидат само за одобрения indexing release.

Действителният Caddy 2.10 fixture тест минава 36 HTTP проверки, включително
escaped path, повторени query параметри, trailing slash, запазен `Location`,
closed/indexed sitemap профили, грешен/липсващ origin key и CF-Worker отказ.
Неупълномощените заявки остават 403 преди redirect и proxy; origin key не се
предава към upstream. Използвани са нови internal fixture мрежи/контейнери без
публикувани портове, production mounts или истински credentials.

При внедряване imports трябва да останат вътре в съществуващия authorized
public route. Изисква се нов exact Caddy template/profile diff и негово
одобрение, защото текущият deploy agent правилно допуска само upstream смяна
в хеширания public-demo template. Тази защита не е променяна.

## Команди и CI

```powershell
$env:NEXT_PUBLIC_RELEASE_MODE = 'public-demo'
$env:NEXT_PUBLIC_INDEXING_ENABLED = 'false'
$env:NEXT_PUBLIC_AUTH_ENABLED = 'false'
npm run build
npm run test:seo:integration
node scripts/test-seo-browser.mjs
node scripts/test-seo-caddy.mjs
```

Browser скриптовете използват наличен Playwright 1.64.1 и Chrome локално.
CI инсталира същия изолиран test runner и негов Chromium в runner temp/cache
директориите, без application dependency или production cache настройка.
Задайте `PLAYWRIGHT_MODULE` към Playwright ESM entry point при отделен runtime;
`BROWSER_CHANNEL=bundled` избира инсталирания от Playwright Chromium.

За baseline сравнение задайте `CAPTURE_ONLY=true` и отделен `OUTPUT_DIR` преди
промяната. После използвайте `BASELINE_RESULTS` към записания `results.json`.
Скриптът `test-seo-browser.mjs` стартира и спира само собствен локален server
на свободен порт. Данните/screenshots са в игнорираната `qa-output/seo-rendering/`.

CI включва новите browser/Caddy регресии и съществуващите build, Node/Python,
HTTPS/SMTP, origin guard, preview и rollback проверки. Финалният CI статус е
видим в Draft PR #6; не се заобикаля неуспешна проверка.

Оставащите точни одобрения и общият ред за release са събрани в един
[release план](seo-release-plan.md), който заменя отделното решение за no-JS
loading от първоначалния SEO одит. Production поведението се променя едва
след одобрение на конкретния commit/image и приложимия Caddy/indexing профил.
