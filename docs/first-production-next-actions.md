# Първо production публикуване — готовност и следващи действия

Нова цел: [Private Preview план и отчет](private-preview-readiness.md). Подготовката по-долу предхожда отделния preview режим; public release gates продължават да важат за окончателното публично пускане.

Проверка: 15 ноември 2026 г., след commit `656f4254aff290644f2909f0fbc80e27edea678a`.
Това е актуалният оперативен отчет; по-старите отчети описват състоянието към техните проверки.
Публикуване НЕ е активирано. Не са променяни сървърни права, Caddy, DNS, Cloudflare, Laravel, бази данни или работещи услуги.

## GitHub — реално проверено и подготвено

- Съществуващото repository `techsolutionbg/saitena` е Public. Видимостта не е променяна от тази задача.
- [Draft PR #1](https://github.com/techsolutionbg/saitena/pull/1) остава отворен, без merge; проверен head `656f425`.
- Успешни `verify` проверки: [push/dev](https://github.com/techsolutionbg/saitena/actions/runs/43722557479) и [PR/main](https://github.com/techsolutionbg/saitena/actions/runs/43722559081). Това НЕ е release CI за push/main.
- `checks.yml`: push към dev/main и PR към dev/main; без deployment или production secrets.
- `production.yml`: само ръчно dispatch от main, стабилен публикуван release, повторно въвеждане на tag, разрешен owner actor/author, точен SHA с успешен push/main CI, release readiness и image digest.
- Реалната main защита изисква PR и strict `verify`, прилага се и за администратори, забранява force push/deletion. Задължителните peer approvals са нула — подходящо за единствен разработчик, който не може да одобрява собствения си PR review.
- По настоящото възлагане е създаден [Environment production](https://github.com/techsolutionbg/saitena/settings/environments/27372354084/edit). Последващ GET потвърди: един required User reviewer `techsolutionbg`; `prevent_self_review=false`; `can_admins_bypass=false`; само protected branches. Workflow допълнително допуска само main. Собственикът може изрично да потвърди своя deployment; това не е независим втори review.
- Environment secrets и variables са празни. Repository variables също са празни; `SAITENA_PRODUCTION_ENABLED` не е включен. Не са добавяни ключове или policy tokens; production workflow не е стартиран.

## Сървър, Caddy и registry — граници на read-only проверката

Съществуващият локален management SSH достъп работи с проверен host key. Той е личен административен достъп и НЕ се предлага за Actions. Endpoint е в Tailscale; достижимост от GitHub-hosted runner не е доказана.

`saitena-deploy` вече съществува. Проверени: заключена парола, групи само `users`/`saitena-deploy`, shell `/bin/bash`, липсващ `authorized_keys`, няма разрешени sudo команди. Не е променян или преизползван автоматично. Липсват `/usr/local/libexec/saitena-deploy`, `/etc/saitena-deploy/config.json` и frontend SMTP runtime файлът.

Caddy работи с `caddy:2.10-alpine`, в съществуващата edge мрежа. Единичният Caddyfile е монтиран read-only в контейнера и се подава изрично на `caddy run`; автоматично следене на файла няма. Провереният mounted файл има SHA256 `78de26d581cd0e4857d67beca062f18cfb0571013a1ad88ee7772f32b32c58ae`. Точният host mount трябва да се прочете отново непосредствено преди одобрена промяна.

Public/www продължават да обслужват under-construction/стария web upstream. `clients.saitena.com` продължава към съществуващия PHP2 панел; API/admin/infra са запазени. Helper markers за public блока липсват, затова първоначалният bootstrap е отделна одобрявана промяна. Проверените контейнери работят; не са рестартирани. Дискът има приблизително 949 GiB свободни и хостът има 6 CPU; това не е измерване на свободен CPU/RAM под реален товар.

Предвиден registry: `ghcr.io/techsolutionbg/saitena/public`. Actions build job има `packages:write` чрез краткоживеещ GITHUB_TOKEN. Локалната GHCR metadata заявка е отказана с 403 поради липсващ `read:packages` scope; наличност, видимост и server pull НЕ са потвърдени. Не са разширявани token права. Неуспешната проверка на default root Docker credential store не доказва липса на други credential stores.

Cloudflare authenticated zone audit остава неприключен. Публични DNS/TLS резултати не доказват Full (strict), origin renewal, cache/WAF или SMTP DNS настройки. Portal и PHP2 не са част от първото публикуване на публичния сайт.

## Предложена ограничена SSH идентичност — не е инсталирана

След отделно одобрение може да се използва съществуващият `saitena-deploy`, ако повторната проверка потвърди същите ограничения. Собственикът предоставя отделна Ed25519 key pair за този сайт; личен/root ключ не влиза в Actions. Пример за единствен разрешен public key:

```text
restrict,command="sudo -n /usr/local/libexec/saitena-deploy" ssh-ed25519 OWNER_PROVISIONED_PUBLIC_KEY
```

Без Docker група, общ sudo, forwarding, PTY или интерактивна употреба на ключа. Единствено sudoers разрешение, проверено с `visudo`, за root-owned helper без аргументи:

```text
saitena-deploy ALL=(root) NOPASSWD: /usr/local/libexec/saitena-deploy ""
```

Helper приема ограничен JSON от stdin, игнорира клиентската shell команда и допуска само фиксирания image repository, release, SHA и digest. Config/helper/parent directories не трябва да са writable от deploy user; state е root-only 0700, SMTP файл 0600. Config остава `enabled:false` до одобрена активация. Изпълнението му е привилегировано, макар интерфейсът да е ограничен: owner трябва да прегледа helper и root конфигурацията преди инсталация.

След одобрена инсталация: отрицателни SSH тестове за shell/forwarding/arbitrary args, image rejection, конкурентен deploy, правилно host-key pinning и реален GHCR pull. Те НЕ са извършени в production.

## Какво липсва от собственика

1. Фирмено име/правна форма, ЕИК, адреси, ДДС и фактуриране; публичен телефон/имейл/Viber и потвърден офис. Окончателни юридически текстове за договори, прекратяване, собственост, лични данни, реални cookies/външни ресурси и обработващи. Подробно: [owner checklist](first-release-owner-checklist.md).
2. Документирано право за търговско публикуване на 24 runtime актива (21 изображения и 3 SVG), одобрени цени/твърдения. Преглед на вече публичната стара Git история със screenshot/оперативна информация; не се пренаписва история автоматично.
3. SMTP hostname/порт, разрешен From и фиксиран служебен To, credentials чрез защитено хранилище, не през Git/PR/чат. Одобрение за тест само към контролирана служебна кутия, ако се изисква реална доставяемост. Mailpit не доказва inbox delivery.
4. Read-only достъп до Cloudflare зоната за SSL/cache/WAF/DNS проверка. Това не разрешава промени на DNS или мрежови правила.
5. Избор и отделно одобрение на runner → SSH мрежовия път. Няма да се отваря порт, tunnel или self-hosted runner автоматично. Shared runner с Docker socket не е приемлив за непроверени PR-и.
6. Одобрение на съществуващия deploy user, root-owned helper/config/sudoers и key provisioning; проверен извън автоматичен `ssh-keyscan` server host key. След това environment secrets `SAITENA_DEPLOY_KEY`, `SAITENA_DEPLOY_KNOWN_HOSTS` и variable `SAITENA_DEPLOY_HOST`.
7. Решение за GHCR package visibility и server credential с минимално `read:packages`, съхраняван root-only, или изрично одобрен anonymous public pull. Проверка на publish/pull за реалния repository. Ако Actions token не може да чете policy metadata, само тогава отделен read-only `SAITENA_RELEASE_POLICY_TOKEN`, без code/server write права.
8. Отделно одобрение на точния public/www Caddy bootstrap, candidate container и rollback bundle. API/admin/infra/clients/PHP2 остават непроменени. Production activation flag и server `enabled:true` изискват последващо изрично одобрение; не са част от тази подготовка.

## Точен ред за първото публикуване

1. Получаване и преглед на горните данни; замяна на drafts/placeholders и документиране на реалните одобрения. Не се променят false flags само за да мине gate.
2. Финален commit през PR, green checks и отделно разрешен merge. Изчакване на успешен push/main CI за точния release SHA; dev/PR успех не го замества.
3. Одобрена инсталация на ограничения server entry point, network path и registry access; отрицателни acceptance tests. Подготовка на пълен Caddy file + live admin JSON backup, mount/inode/image IDs, protected URL baseline и стар public response hash в root-only rollback bundle. Повторно сравнение с live config непосредствено преди switch.
4. В disposable среда с matching Caddy/mount semantics: проверка на пълния merged config, success/rollback/rollback-failure сценарии; после server preflight без превключване. Приемане на детерминистичен page hash и липса на Cloudflare stale cache/challenge за health; не се изключва TLS verification.
5. Едва след отделно go approval: `SAITENA_PRODUCTION_ENABLED=true` и server config enablement, stable owner-published release на проверения main SHA, ръчен dispatch от main с повторен tag. Build публикува immutable digest; собственикът преглежда SHA/digest и потвърждава protected environment job.
6. Helper стартира отделен candidate, проверява health/routes/assets и защитените услуги, променя само маркирания public/www блок, validate/reload Caddy. Запазва старите контейнери. Следва проверка на публичния release и всички защитени адреси. Няма регистрации или тестови писма към клиенти. Auth/registration и indexing остават изключени за първия информационен release.

## Rollback и тестови доказателства

Helper записва durable root-only journal преди switch. При неуспех след switch възстановява captured Caddy bytes с метод, запазващ mounted inode, validate/reload и проверява предишната публична идентичност и protected endpoints. Старите контейнери/images се запазват; няма DB операции или prune.

При прекъсване/неуспешен rollback се спират следващите releases. Одобрен root оператор може да изпълни `sudo /usr/local/libexec/saitena-deploy recover vX.Y.Z`. Deploy SSH ключът няма такова sudo право с аргументи. Recovery отказва да презапише непознати последващи operator промени; следват review на journal/live config и контролирано ръчно възстановяване. Виж [activation guide](production-cicd-activation.md).

Изпълнено в тази проверка:

- 23/23 Node теста — PASS.
- 8/8 Python helper теста — PASS в disposable Linux container, `--network none`, read-only bind; включват startup failure, rollback/recovery, concurrent edits и identity rejection. Native Windows Python alias не работи; Linux тестовете са изпълнени успешно вместо него.
- Assertions върху реално прочетените Environment/main-protection metadata — PASS; reviewer/self-approval/no-bypass/strict solo policy са проверени.
- `check-release-readiness.mjs` — очакван отказ: 4 pending owner approvals, права за 24 актива и юридически drafts.
- Read-only SSH/server/account/Caddy проверки — извършени. GHCR metadata — 403; authenticated pull и runner SSH — непроверени.

Съществуващите green GitHub CI runs включват build, lint/typecheck, HTTPS/Mailpit и Docker/Caddy fixture rehearsal. Тук не е повтарян пълен build или реален production rollback. Fixture registry mapping НЕ доказва GHCR authentication; production Caddy/SSH acceptance остава след одобрение. Тази документация е локална и не е commit/push/merge-ната като част от настоящата проверка.
