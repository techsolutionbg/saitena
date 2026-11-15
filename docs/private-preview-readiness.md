# Private Preview — план и отчет за готовността

Дата: 15 ноември 2026 г. Основа: `656f425`, Draft PR #1. Сайтът НЕ е публикуван в Private Preview. Собственикът одобри тестовото съдържание и четирите SVG само за Private Preview и разреши commit/push в текущия branch и CI; merge и deployment остават забранени. Production API, Caddy, DNS, Cloudflare, SSH права и работещите услуги не са променяни.

## Режими и съдържание

Добавен е build-time `NEXT_PUBLIC_RELEASE_MODE=private-preview`, отделен от default `public`. Preview показва постоянен надпис за тестово съдържание и демонстрационни цени/описания. Контактната страница използва само:

- „Saitena — ТЕСТОВ доставчик (Private Preview)“;
- `preview@example.invalid` — недоставяем тестов адрес, без mailto;
- „ТЕСТОВ телефон — няма активен номер“;
- „ТЕСТОВ адрес — няма посочен реален офис“.

Не са измисляни ЕИК, регистрации или реални адреси. Няма активна форма, телефон, външна карта, поръчки или регистрация. API contact endpoint отказва и same-origin POST с 403; SMTP не се конфигурира за preview. Auth остава false. Юридическите страници не се генерират за preview, не се показват в footer/sitemap и се отказват с действителен HTTP404 преди React streaming, включително aliases/concept routes. Оригиналните юридически чернови се запазват в source за бъдещо одобрение, без публичен маршрут към тях.

`noindex,nofollow,noarchive` е включено в headers/metadata; robots забранява `/`, XML sitemap е празен. Preview отказва build при auth/indexing=true. Noindex не е контрол на достъп. Caddy налага `private,no-store`; необходим е и изрично проверен Cloudflare cache bypass, защото app/static caching самостоятелно не доказва поверителност.

## Активи и одобрение

24-те стари runtime актива с непотвърдени права НЕ влизат в preview runtime image. Само в disposable Docker build tree се пренасочват TS/TSX/CSS references и се създава public directory с четири оригинални SVG заместителя:

- [илюстрация](../preview-assets/illustration.svg);
- [светло лого](../preview-assets/logo-light.svg);
- [тъмно лого](../preview-assets/logo-dark.svg);
- [знак](../preview-assets/mark.svg).

SVG са изписани като геометрия/текст за този проект, без embedded raster или външни ресурси. Подменят временно и брандирането; окончателните оригинали не са изтривани/одобрявани. Собственикът изрично одобри тези четири заместителя на 15 ноември само за Private Preview. `private-preview-assets.json` пази source, SHA256 и `approved-private-preview`, което не се приема за public approval. LF attributes пазят еднакви hashes на Windows/Linux. Инфраструктурната политика и активацията все още нямат одобрение.

`check-release-readiness.mjs` по подразбиране проверява публичен release. Preview се избира изрично чрез `SAITENA_RELEASE_MODE=private-preview` и изисква отделните owner approvals в `private-preview-approval.json`, права и неизменени hashes на всички включени заместители и липса на непроверени preview файлове. Това изключение не одобрява юридически/фирмени данни за public release. И двата final release Docker targets в момента отказват build. Candidate image е само за преглед/тестове.

## Домашен IP и Cloudflare — само неактивен проект

Собственикът предостави един IPv4 и потвърди „Не е известно; засега само този IPv4“ за static/IPv6 статуса. Истинският IP е само в ignored `qa-output/private-preview-waf-draft.json`, не в публичния Git source. Не е възможно да се докаже статичност от една заявка/WHOIS. Преди активация се сверява текущият browser egress IPv4; IPv6 остава блокиран. Ако браузърът използва IPv6, положителният тест може да откаже въпреки разрешения IPv4 — не се добавя произволен IPv6 префикс.

WAF expression, с документационен пример вместо истинския IP:

```text
(http.host in {"saitena.com" "www.saitena.com"} and not ip.src in {203.0.113.7})
```

Действие Block, без global Allow/Skip. Разрешеният адрес продължава през останалите security правила. Няма wildcard subdomain match; API/admin/infra/clients/portal и PHP2 не участват. JSON draft е `enabled:false`; няма Cloudflare write клиент или автоматично активиране в проекта.

Точните host-scoped rule fragments са в [Cloudflare examples](../.deployment/private-preview-cloudflare.rules.example.json). След read-only account audit и изрично одобрение се добавят към съществуващите rulesets, без да се заменя целият ruleset:

1. WAF Block за всички неразрешени IP на двата public host-а. Проверка за предходни Skip/IP Allow/redirect/Worker правила и действителен отказ, не само наличие на expression.
2. Request header transform за същите host-ове, който **overwrite-ва** `X-Saitena-Preview-Key` с owner-generated 64 hex secret. Не се използва стойност, подадена от посетителя. Secret се съхранява само в Cloudflare/root config; не в Git/Actions artifacts/HTML/logs. Header се премахва преди proxy към Next.js.
3. Cache bypass само за двата host-а, с проверена precedence. Ако е необходимо изчистване на стар cache, одобряват се само public-host URLs; без zone-wide purge или промени по другите поддомейни.

Нужни са потвърдени proxied A/AAAA за двата host-а, HTTPS Full (strict), правилен origin TLS, преглед на Pseudo IPv4/Managed Transforms (да не подменят/махат реалния CF-Connecting-IP), Workers, origin overrides, cache и plan/rule quotas. Това още НЕ е удостоверено чрез Cloudflare account access. Няма автоматично отваряне на firewall, tunnel или нов DNS запис.

При dynamic IP или CGNAT allowlist не удостоверява самоличност и може да даде достъп на друг ползвател на същия/reassigned адрес. При промяна се спира preview/обновява се само след ново потвърждение. За по-дълъг или по-чувствителен preview е нужен отделен owner избор за identity-based защита; тя не е добавяна мълчаливо.

## Origin bypass — реално установен блокер

Read-only HTTPS GET директно към съществуващите origin IPv4 и IPv6, с Host/SNI `saitena.com` и нормална certificate verification, върна HTTP200 без CF-Ray и за двете семейства. Следователно WAF самостоятелно не е достатъчен. Тестът не променяше услугата и не подаваше регистрации/съобщения. Origin адресите и суровите резултати остават само в ignored QA файлове.

Подготвеният Caddy public/www блок допуска едновременно:

- непосредствен peer от проверените Cloudflare IPv4/IPv6 ranges;
- точен домашен `CF-Connecting-IP`;
- правилния отделен origin token;
- липса на `CF-Worker` subrequest header.

Липсващ token, фалшив home header от direct peer, грешен IP и Worker получават 403. WWW redirect към canonical се изпълнява **след** guard. Не се променят global trusted proxies или други virtual hosts. Само доверие в CF-Connecting-IP или в общ Cloudflare client certificate не доказва принадлежност към собствената зона; затова има отделен secret. Възможна алтернатива е собствен per-hostname AOP сертификат след отделен преглед/одобрение.

Официалните [Cloudflare IP ranges](https://www.cloudflare.com/ips/) трябва да се вземат/сверят непосредствено преди одобрен bootstrap. Примерният root config е неактивен и с празни IP/token полета: [private preview config](../.deployment/deploy-config.private-preview.example.json). Caddyfile ще съдържа secret след бъдещо прилагане: проверка на root ownership/read permissions, backups и log redaction е задължителна; не се качват в CI.

## CI/CD и health проверки

Dev/main push и PR проверките са запазени. Добавена е задължителна `Private Preview build and privacy checks` стъпка с истински preview build, runtime privacy и реален изолиран Docker/Caddy rehearsal. Release policy изисква и тази успешна стъпка за точния main SHA; стар dev/PR успех не я замества.

Production workflow остава manual dispatch, main only, owner-authored stable release, повторно въвеждане на tag и отделно повторение на режима. `public` изисква `SAITENA_PRODUCTION_ENABLED`; `private-preview` изисква отделен `SAITENA_PRIVATE_PREVIEW_ENABLED`. И двата липсват при read-only проверката. Използва се същият protected environment production, owner confirmation и no admin bypass. Не са създавани secrets/нови права.

Image tag съдържа SHA+mode, deployment използва immutable `@sha256`, проверява OCI revision **и** mode срещу request и root server config. Preview/public не могат да се разменят чрез runtime variable или стар recovery journal. Root helper още не е инсталиран и няма разрешен deployment SSH ключ.

При preview външните server/runner заявки трябва да са блокирани. Не се добавят monitor IP изключения. Candidate се проверява вътрешно; Caddy има listener само на **container loopback** `127.0.0.1:9080`, без host port. Root helper го чете чрез docker exec за health и точен rendered-body hash. Външните saitena/www probes от сървъра изискват 403 с CF-Ray. Отделен положителен тест от дома остава необходим. Провереното живо Caddy няма 9080 listener; не е добавян.

## Точен bootstrap и rollback ред — изисква отделно одобрение

1. Одобряване на тестовото съдържание, четирите SVG и ограничената preview политика; само тогава preview approval records могат да се актуализират. Public approvals остават false. Прегледан commit/PR и отделно разрешен merge; успешен push/main CI за точния SHA.
2. Read-only Cloudflare account audit и преглед на точните rule diffs. Повторно потвърждение на домашния IPv4. Одобряване на ограничен SSH key/helper/sudoers, verified host key, runner network path и GHCR publish/read-only pull. Няма root/personal key в Actions или Docker група за deploy user.
3. Пълен root-only backup на Caddyfile + live JSON, mount/inode, image IDs/Compose/мрежа, current under-construction identity и API/admin/infra/clients baseline. Провереният Caddy hash остава `78de26d581cd0e4857d67beca062f18cfb0571013a1ad88ee7772f32b32c58ae`; re-read преди действие, stop при разлика. Точният mounted path се чете от inspect, не се предполага.
4. Първо се активира одобрената edge защита/cache bypass и се проверяват външният отказ и домашният достъп към сегашния сайт. После се bootstrap-ва само public/www маркираният блок с origin guard и loopback probe. За rollback baseline се използва отделен одобрен retained under-construction container с прегледан immutable image и същото captured съдържание; не се пренасочва публичният сайт към чужд портал. Останалите Caddy bytes се запазват. Validate на пълния merged config преди mount-aware write/reload само на Caddy.
5. Преди новия сайт се проверяват home allow, outside deny, direct IPv4/IPv6 deny, spoofed CF header deny, no token leakage и всички protected услуги. Ако това не е доказано, няма preview deployment. Bootstrap няма автоматичен first-run обход: helper отказва оригинален незащитен public блок или probe към различен upstream.
6. След изрично go approval: root config `enabled:true`, `release_mode:private-preview`, одобрен access config с точните IP/ranges/token; root-only preview env съдържа **само** `CONTACT_MAIL_MODE=disabled`. Включва се само preview enablement flag. Stable owner release и manual dispatch от main с tag/mode потвърждение; owner преглежда SHA/digest и одобрява environment job.
7. Helper стартира нов frontend container, проверява mode/health/routes/assets/legal404/disabled contact, journal-ва оригиналната **вече защитена** конфигурация, сменя само маркирания public блок и проверява internal identity + external403 + protected услуги. Предишните контейнери/volumes/DB остават. Няма промени на PHP2 или други поддомейни.
8. При неуспех връща guarded baseline, validate/reload, internal baseline hash, external403 и protected service checks. Edge защитата и token не се махат като част от автоматичен rollback. При failed recovery — блокира следващи releases, запазва root journal, оператор преглежда; cross-mode/unrecognized config recovery се отказва преди overwrite. Връщане към общодостъпния стар сайт изисква отделно решение и координиран restore, не автоматично отваряне на preview.

## Реални резултати и ограничения

- 27 Node теста: PASS, включително отделни preview approvals, public gate запазен, права/hash/непознат asset отказ, WAF scope и owner/main/mode policy.
- 12 Linux/Python теста: PASS, включително cross-mode image/recovery отказ, guarded bootstrap, rollback и конкурентни operator промени.
- ESLint и TypeScript: PASS.
- Docker candidate builds `public` и `private-preview`: PASS. Preview runtime: 9 страници, legal routes/aliases 404, 5 auth redirects, 2 contact-origin отказа, 4 заместителя, original assets absent, robots/meta/header noindex: PASS.
- Съществуващият public-mode runtime smoke: PASS — 12 страници, 18 static assets, 24 runtime assets и 5 disabled auth redirects; изпълнен само вътре в network-isolated candidate, не като публичен release.
- Real Docker/Caddy preview fixture: разрешена simulated home заявка; 6 denial cases; реален switch, injected post-switch failure, rollback, повторно recovery и запазен стар container: PASS. Registry pull и Cloudflare edge са **симулирани граници**; тестът няма production достъп. Новосъздадените fixture контейнери се спират след теста; volumes/journals не се изтриват.
- Caddy 2.10 default saitena.com/www preview syntax: PASS в network-isolated container с документационни адреси, без live config.
- Final public/preview release Docker build при текущите pending flags: очакван отказ (exit1), не успешен release.
- Secret-pattern scan: без findings за текущите файлове/достъпните patches; не доказва липса на скрити данни във всички исторически binaries.
- Workflow YAML parsing/trigger/mode/environment contracts и Git diff whitespace: PASS. Това не е изпълнение на GitHub Actions за текущите локални промени.
- Production origin IPv4/IPv6 GET: действителен 200 bypass; активният Caddy hash е непроменен. Няма реален home allow/outside deny тест на внедрен preview, Cloudflare account validation, runner SSH или authenticated GHCR pull. GitHub Actions за тези локални промени още не е изпълнен.

След одобрена активация от домашната мрежа: `node scripts/check-preview-access.mjs allowed`. От отделна външна връзка: `node scripts/check-preview-access.mjs blocked`; повторение с `blocked <origin-IPv4>` и `blocked <origin-IPv6>` за direct-origin TLS probes. Инструментът не изпраща форми и не изключва TLS verification. По настоящата незатворена production конфигурация тези negative тестове трябва да се провалят — не ги обявяваме за успешни.

## Решение и одобрения

Тестовото съдържание и четирите SVG са одобрени само за Private Preview. Кандидатът **не е разрешен за активиране**. Необходими са отделни owner approvals за: точните три host-scoped Cloudflare правила и secret provisioning; ограничена SSH идентичност/helper/network/GHCR достъп; public-only Caddy bootstrap, retained baseline container и privacy-preserving rollback; конкретния main release/digest и последната preview активация. Липсват Cloudflare account audit, достъп/credentials и реалните приемателни тестове. Public registration и public production enablement остават изключени. Актуален approval пакет и CI evidence: [private-preview-approval-package.md](private-preview-approval-package.md).

Източници за предложената конфигурация: [Cloudflare host/IP custom rules](https://developers.cloudflare.com/waf/tools/zone-lockdown/), [Request Header Transform](https://developers.cloudflare.com/rules/transform/request-header-modification/), [Cache Rules API](https://developers.cloudflare.com/cache/how-to/cache-rules/create-api/), [CF headers/Worker semantics](https://developers.cloudflare.com/fundamentals/reference/http-headers/), [Caddy matchers](https://caddyserver.com/docs/caddyfile/matchers).
