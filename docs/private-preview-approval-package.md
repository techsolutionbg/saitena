# Private Preview — инфраструктурен пакет за отделно одобрение

Този пакет е предложение, не разрешение за изпълнение. Собственикът одобри само тестовото съдържание и четирите оригинални SVG за Private Preview, както и commit/push/CI в текущия branch. Няма разрешение за merge, deployment, Cloudflare, Caddy, SSH, firewall или production config промени. Точният commit и реалният CI резултат се посочват в [Draft PR #1](https://github.com/techsolutionbg/saitena/pull/1), за да няма саморефериращ commit с неговия собствен SHA.

## 1. Cloudflare — три строго ограничени правила

Истинският потвърден домашен IPv4 е само в локалния ignored QA пакет, не в публичния Git. IPv6 не е разрешен; static/CGNAT статусът не е потвърден. Във всички примери `HOME_IP` означава точно предоставения единичен IPv4, без CIDR разширяване. Преди прилагане се сверява текущият browser egress. Адрес от динамична/споделена връзка не удостоверява самоличност; промяна изисква ново owner потвърждение.

| Правило                      | Phase                          | Expression                                                                     | Action                                                                   |
| ---------------------------- | ------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Отказ извън дома             | `http_request_firewall_custom` | `(http.host in {"saitena.com" "www.saitena.com"} and not ip.src in {HOME_IP})` | `block`                                                                  |
| Origin authentication header | `http_request_late_transform`  | `(http.host in {"saitena.com" "www.saitena.com"})`                             | `rewrite`: set/overwrite `x-saitena-preview-key` с отделен 64-hex secret |
| Cache bypass                 | `http_request_cache_settings`  | `(http.host in {"saitena.com" "www.saitena.com"})`                             | `set_cache_settings`, `{"cache":false}`                                  |

Пълните JSON fragments са в [.deployment/private-preview-cloudflare.rules.example.json](../.deployment/private-preview-cloudflare.rules.example.json), с `enabled:false`. Локалният QA пакет заменя единствено примерния IP с потвърдения адрес; secret остава placeholder. Няма global Allow/Skip и няма wildcard subdomains. Header се overwrite-ва, не се доверява на подадената от посетителя стойност, и се премахва преди Next.js upstream.

Преди точен API diff е необходим authenticated **read-only** audit: zone/ruleset IDs, текущи rule IDs/order/versions, plan quotas, proxied A/AAAA, Full (strict), origin TLS, Workers/redirect/Origin Rules, Managed Transforms/Pseudo IPv4, Skip/IP Allow и cache overrides. Нямаме потвърден account audit и не твърдим, че тези условия са изпълнени. Rule fragments се добавят към съответните съществуващи rulesets; не се заменя целият ruleset. WAF трябва да се изпълнява без предходно bypass правило; header и cache rules трябва да имат ефективен precedence без последващо overwrite. Няма zone-wide purge. Event/CF-Ray се съпоставя с конкретния одобрен Block rule.

Промени по `api`, `admin`, `infra`, `clients`, `portal`, PHP2, DNS или други hostnames не се включват. Няма автоматично активиране след CI. След одобрение собственикът може да приложи точните правила през dashboard, без да предоставя write token на CI. Ако се одобри API прилагане, token се ограничава до необходимата зона/операции и не се записва в Git/PR/чат.

## 2. Caddy — само маркирания public/www блок

Реалният сървър има single-file bind mount на Caddyfile; истинският source path и live JSON се прочитат отново непосредствено преди действие. Провереният преди тази подготовка SHA256 е `78de26d581cd0e4857d67beca062f18cfb0571013a1ad88ee7772f32b32c58ae`. При разлика се спира и се изготвя нов diff. Markers още липсват; bootstrap е отделна одобрявана промяна.

Renderer: `Runtime.preview_block()` в [.deployment/deploy_agent.py](../.deployment/deploy_agent.py). Параметрите са точният `HOME_IP`, проверените [Cloudflare IPv4](https://www.cloudflare.com/ips-v4/) / [IPv6](https://www.cloudflare.com/ips-v6/) ranges, отделният root-only origin token и конкретният retained/candidate container alias. Не се променят глобални trusted proxies. Реалната IP/token конфигурация е извън Git.

```caddyfile
# BEGIN SAITENA PUBLIC
# SAITENA PRIVATE PREVIEW
saitena.com, www.saitena.com {
 header X-Robots-Tag "noindex, nofollow, noarchive"
 header Cache-Control "private, no-store"
 @denied not {
  remote_ip CF_IPV4_AND_IPV6_RANGES
  header X-Saitena-Preview-Key OWNER_GENERATED_64_HEX_TOKEN
  header CF-Connecting-IP HOME_IP
 }
 @worker header CF-Worker *
 @www host www.saitena.com
 route {
  respond @denied "Forbidden" 403
  respond @worker "Forbidden" 403
  redir @www https://saitena.com{uri} 302
  reverse_proxy APPROVED_CONTAINER:3000 {
   header_up -X-Saitena-Preview-Key
  }
 }
}
http://127.0.0.1:9080 {
 bind 127.0.0.1
 reverse_proxy APPROVED_CONTAINER:3000
}
# END SAITENA PUBLIC
```

Това е шаблон с явни placeholders, не готов за reload файл. Частният QA пакет съдържа конкретен review diff с потвърдения IP/текущите CF ranges, фиктивен token и ясно означен future upstream. Всички bytes извън public/www блока трябва да са запазени. 9080 е само loopback **в Caddy container**, без host port. Реалният secret не трябва да се появява в access/error logs, CI artifacts или публичния PR; Caddyfile/config/backups получават проверен root-only достъп след отделно одобрение.

Bootstrap baseline не трябва да е незащитеният стар public block. Предлага се отделен retained under-construction container с одобрен immutable image и captured текуща страница, без host ports, който първо се поставя зад същия guard. Съдържанието, image digest и името още изискват одобрение; не се подменя съществуващият клиентски портал. Helper отказва bootstrap без същия guard или с различен probe upstream.

## 3. Ограничен SSH и GHCR достъп

Преди подготовката `saitena-deploy` вече съществуваше: заключена парола, без authorized_keys, без sudo команди и Docker група. Това се проверява отново преди инсталация. Не се създава нов привилегирован достъп автоматично.

Предложен единствен public key entry, след одобрение:

```text
restrict,command="sudo -n /usr/local/libexec/saitena-deploy" ssh-ed25519 OWNER_PROVISIONED_DEPLOY_PUBLIC_KEY
```

Предложено единствено sudoers разрешение, проверено с `visudo`:

```text
saitena-deploy ALL=(root) NOPASSWD: /usr/local/libexec/saitena-deploy ""
```

Без personal/root key, Docker group, shell/PTY/forwarding или общ sudo. Helper/config/parent paths са root-owned и невъзможни за запис от deploy user. Helper приема само ограничен stdin JSON `{release,sha,image,mode}`, а не shell команди. Кодът е привилегирован и изисква owner review преди инсталация. Root config/state/journal са защитени; recovery с аргументи е само за отделно одобрен оператор, не за deployment key.

Management endpoint е Tailscale; достижимост от GitHub-hosted runner не е доказана. Няма разрешение за нов firewall rule, tunnel или self-hosted runner. Owner трябва отделно да избере/одобри минимален network path. Не се предоставя споделен Docker socket на self-hosted runner за непроверени PR-и.

Actions build използва краткоживеещ `GITHUB_TOKEN` с `packages:write`, само за `ghcr.io/techsolutionbg/saitena/public`. Сървърът се нуждае от отделен read-only package credential в root credential store или изрично одобрен anonymous pull, ако package visibility го позволява. Наличност/видимост/pull не са потвърдени: текущият локален GitHub token няма `read:packages`. Не се разширяват scopes и не се измислят credentials. Предложени production environment secrets: `SAITENA_DEPLOY_KEY`, `SAITENA_DEPLOY_KNOWN_HOSTS`; variable `SAITENA_DEPLOY_HOST`, само след одобрен достъп и проверен извън автоматичен ssh-keyscan host key. При необходимост policy metadata token е read-only и без repository/server write права.

## 4. Последователност за разрешена активация и rollback

1. Успешен CI на конкретния PR head; PR остава Draft и няма merge без ново разрешение. Public approvals остават false, preview content approval не е инфраструктурно approval.
2. Read-only account/server audit, преглед на точните diffs/permission files и предоставяне на липсващите zone/network/registry данни. Owner одобрява конкретните Cloudflare rules, ограничената идентичност/helper, Caddy bootstrap/baseline и rollback bundle.
3. Root-only backup: original Caddyfile + live JSON, file/mount/inode hash, image IDs, Compose/network и under-construction page identity; protected API/admin/infra/clients health и свободни RAM/CPU/диск за candidate+baseline. Без DB dump/миграции или PHP2 промени.
4. Одобрен edge guard/cache bypass и origin bootstrap, преди новия сайт. Validate на пълния merged config, запазване на bind-mounted inode, reload само на Caddy. Проверки от дома, извън дома и директно през origin IPv4/IPv6 с Host/SNI; spoofed CF header и грешен/липсващ token трябва да бъдат отказани. При неуспех няма следваща стъпка.
5. Само след допълнително go approval: merge, успешен точен push/main CI, stable owner release, root config `enabled:true`/`release_mode:private-preview`, runtime файл само `CONTACT_MAIL_MODE=disabled`, и само `SAITENA_PRIVATE_PREVIEW_ENABLED=true`. Public flag остава изключен. Manual dispatch с повторен tag/mode и owner environment approval за SHA/digest.
6. Helper проверява OCI revision+mode, staged pages/assets/legal404/noindex/contact403, записва durable journal, сменя единствено маркирания блок и проверява internal identity + external403 + protected услуги. Няма monitor-IP изключение.
7. При неуспех — restore на **guarded** baseline със същия token/edge защита, validate/reload, internal hash и external403/protected checks. Не се отваря preview към всички. Старите контейнери/images/volumes се пазят, няма prune или DB rollback. Unfinished journal, cross-mode recovery или чужда последваща routing промяна блокират следващи releases и изискват оператор.

## 5. Acceptance и оставащи блокери

Локалните fixture тестове и real GitHub CI доказват само описаните в PR сценарии; CF edge/registry transport в Docker rehearsal са симулирани. Не са доказателство за внедрен private preview. Предходният read-only origin probe установи HTTPS200 с валиден `saitena.com` сертификат през direct origin IPv4 **и** IPv6; повторната проверка и текущият Caddy hash се записват в частния QA пакет след CI. До одобрен origin guard този обход остава блокер.

След бъдещо одобрено внедряване:

```text
# От потвърдената домашна връзка:
node scripts/check-preview-access.mjs allowed
# От отделна външна връзка:
node scripts/check-preview-access.mjs blocked
node scripts/check-preview-access.mjs blocked ORIGIN_IPV4
node scripts/check-preview-access.mjs blocked ORIGIN_IPV6
```

TLS verification остава включена. Извършват се само GET probes, без регистрации и customer mail. Owner-positive и independent outside-negative резултатите още липсват за реално внедрен preview. Липсват също authenticated Cloudflare audit/exact rule IDs, одобрен SSH network path и credentials, GHCR publish/pull acceptance и approved retained baseline image. Не се заявява успешно публикуване до преминаването им.
