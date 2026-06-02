# Yandex Cloud CDN для krimvk.ru (вместо Cloudflare)

> **Актуальная схема (POST на CDN отклонён):** сайт на VPS, статика на `cdn.krimvk.ru` — [YANDEX_STATIC_CDN.md](./YANDEX_STATIC_CDN.md).  
> DDoS на IP сервера — [YANDEX_DDOS.md](./YANDEX_DDOS.md).

Ниже — исходный план «весь сайт через CDN» (оставлен для справки).

Канонический сайт: **https://krimvk.ru** (без www). **www** → редирект на apex (middleware + по желанию CDN/nginx).

Документация: [источники](https://yandex.cloud/ru/docs/cdn/concepts/origins), [HTTP-методы и POST](https://yandex.cloud/ru/docs/cdn/operations/resources/configure-http).

---

## Пошаговый план (делайте по номерам)

### Сейчас — пока нет POST от поддержки

Пользователи ходят **напрямую на VPS**, CDN для людей **не включать** (POST → 405).

| # | Где | Действие |
|---|-----|----------|
| **1** | REG.RU | `@` и `www` → **A** `89.111.165.160`. `origin` → **A** `89.111.165.160`. MX/TXT почты не трогать. |
| **2** | [Поддержка Yandex](https://console.yandex.cloud/support) | Тикет: включить **POST, PUT, PATCH, DELETE**; основной домен **krimvk.ru**, доп. **www**; origin **origin.krimvk.ru**, Host **krimvk.ru**; Next.js API/NextAuth. Спросить про **ALIAS @ на CDN** при MX на REG.RU. |
| **3** | VPS | `server_name krimvk.ru www.krimvk.ru origin.krimvk.ru;` certbot для `origin` при HTTPS origin. |
| **4** | Yandex CDN | Создать/допилить ресурс (шаг 2 ниже): **krimvk.ru** + **www**, gzip-on, slice выкл, кэш только static. **DNS на CDN не переключать.** |
| **5** | Git / VPS | `git pull`, `npm run build`, `pm2 restart`. Редирект www→apex уже в `lib/canonical-host.ts`. |

### После ответа поддержки «методы включены»

| # | Где | Действие |
|---|-----|----------|
| **6** | CLI | `yc cdn resource update <ID> --allowed-http-methods GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS` |
| **7** | VPS | Проверка: POST → **400** (не 405): см. шаг 3.1. |
| **8** | DNS | **krimvk.ru (@)** на CDN (ANAME в [Yandex DNS](https://yandex.cloud/ru/docs/dns/) или как скажет поддержка). **www** → CNAME на тот же CDN. |
| **9** | VPS | nginx: **gzip выкл**; `.env`: `SITE_URL` / `NEXTAUTH_URL` / `CANONICAL_HOST` = `krimvk.ru`. |
| **10** | CDN | Сброс кэша. Проверка Safari, логин, `curl` health. |

---

## Схема (целевая)

```text
Пользователь → https://krimvk.ru (DNS @ → CDN через ANAME)
            → CDN (TLS, gzip на edge)
            → origin.krimvk.ru → nginx (без gzip) → Next.js

https://www.krimvk.ru → 308 → https://krimvk.ru
```

**Cloudflare:** выключен. **UFW:** `scripts/ufw-open-origin.sh`.

---

## Защита: что даёт CDN

| Даёт | Не даёт |
|------|---------|
| Edge в РФ, кэш static, часть DDoS | Скрытие IP, пока `@` = A на VPS |
| TLS на краю | POST без заявки в поддержку |

Весь публичный трафик — на **krimvk.ru** через CDN; **www** только редирект.

---

## Шаг 0 — VPS и nginx (уже есть)

На origin должны отвечать **и** публичные имена, **и** origin:

```bash
# В /etc/nginx/sites-available/krimvk в server_name добавьте:
server_name krimvk.ru www.krimvk.ru origin.krimvk.ru;

sudo nginx -t && sudo systemctl reload nginx
sudo bash /var/www/krimvk/scripts/ufw-open-origin.sh
```

Проверка с VPS:

```bash
curl -fsSI -H "Host: origin.krimvk.ru" http://127.0.0.1/api/health
```

---

## Шаг 1 — DNS: поддомен origin (REG.RU или Yandex DNS)

| Запись | Тип | Значение | Прокси |
|--------|-----|----------|--------|
| `origin` | **A** | `89.111.165.160` | нет (прямой IP) |

Проверка: `dig +short origin.krimvk.ru A` → `89.111.165.160`.

Записи **Resend** (`resend._domainkey`, `send`, MX, `_dmarc`) **не трогать**.

---

## Шаг 2 — Yandex Cloud: CDN-ресурс

1. [console.yandex.cloud](https://console.yandex.cloud) → каталог (тот же, где бакет `krimvk`).
2. **Cloud CDN** → **Создать ресурс**.
3. **Доменное имя контента:** `krimvk.ru` (при необходимости добавить `www.krimvk.ru` в доп. имена).
4. **Источник:** тип **Свой источник** / Own origin → домен **`origin.krimvk.ru`** (не IP).
5. **Протокол к источнику:** HTTPS, если на VPS уже certbot для `krimvk.ru` / `origin.krimvk.ru`; иначе HTTP (потом включить HTTPS).
6. **Заголовок Host к источнику:** `krimvk.ru` (чтобы nginx и NextAuth видели основной домен).
7. **Сертификат на CDN:** Let's Encrypt в консоли CDN для `krimvk.ru` и `www.krimvk.ru`.

Скопируйте **CNAME** вида `cl-xxxxx.edgecdn.ru` (точное имя покажет консоль после создания).

---

## Шаг 3 — Кэш (важно для Next.js)

Сайт динамический — иначе CDN отдаст старые HTML/API.

В настройках CDN-ресурса → **Кэширование** / правила:

| Путь | Кэш |
|------|-----|
| `/_next/static/*` | Долго (дни) |
| `/uploads/*`, `/files/*` | Средне |
| `/api/*` | **Не кэшировать** |
| `/admin/*`, `/dashboard/*` | **Не кэшировать** |
| `/` и остальное HTML | Коротко или **не кэшировать** на старте |

На старте безопаснее: **кэшировать только** `/_next/static/` и статику; всё остальное — bypass.

**Игнорировать query string / cookies** — **выключено** (иначе ломается сессия и ЛК).

---

## Шаг 3.1 — Настройки CDN (Safari + Next.js) — обязательно

Симптом: в **Safari** на `www` «голый» сайт, в консоли `Failed to load resource: The network connection was lost` на десятках `/_next/static/*`; **Chrome** на том же www часто ок.

Типичная причина: **двойное сжатие** (Next `compress` + nginx `gzip` + CDN **GZip на edge**) и/или **сегментация (slice)** по HTTP/2.

| Параметр в консоли CDN | Значение |
|------------------------|----------|
| **GZip / Brotli на CDN** | **Включить** (gzip-on) — сжатие **только здесь** |
| **Сегментация / Optimize delivery / slice** | **Выключить** |
| **Fetch compressed** | **Выключить** (не путать с gzip-on) |
| Кэш HTML `/`, `/dashboard`, `/api` | Не кэшировать / TTL 0 |
| `/_next/static/*` | Долгий TTL (immutable) |

На **VPS** (после деплоя с `compress: false` в `next.config.js`):

```bash
# В /etc/nginx/sites-available/krimvk закомментируйте блок gzip on; ... (см. nginx.conf.example)
sudo nginx -t && sudo systemctl reload nginx
pm2 restart krimvk --update-env
```

Проверка с Mac (Safari и терминал):

```bash
# Один chunk — 200, text/javascript или css, без PROTOCOL_ERROR
curl -sI --http2 "https://www.krimvk.ru/_next/static/css/$(curl -s https://www.krimvk.ru | grep -o '_next/static/css/[^"]*\.css' | head -1 | sed 's|_next/static/css/||')"

# Не должно быть двойного Content-Encoding
curl -sI -H "Accept-Encoding: gzip" "https://www.krimvk.ru/api/health" | grep -i content-encoding
```

CLI (если есть `yc`):

```bash
yc cdn resource update <ID> --clear-compression-options
yc cdn resource update <ID> --gzip-on
# slice по умолчанию выключен; если включали — отключите в консоли
```

**Методы HTTP (важно):** у Yandex CDN по умолчанию для клиентов **запрещены** `POST`, `PUT`, `PATCH`, `DELETE`. Галочки в консоли (GET, HEAD, PUT, …) **не включают** их сами по себе — нужна заявка в [техподдержку](https://console.yandex.cloud/support). Иначе все POST (логин, формы, API) получают **405** на `www`, хотя GET/static работают (Chrome «открывается», Safari сыпет static — отдельная тема gzip/slice).

Проверка с VPS:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "https://www.krimvk.ru/api/emergency" \
  -H "Content-Type: application/json" -d '{}'
# 400 = POST дошёл до Next.js; 405 = режет CDN
```

После одобрения поддержки:

```bash
yc cdn resource list
yc cdn resource update <ID> \
  --allowed-http-methods GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS
```

Текст для тикета: Next.js, основной домен `krimvk.ru`, `www` — редирект, origin `origin.krimvk.ru`, POST/PUT/PATCH/DELETE для `/api/*`, NextAuth.

После смены настроек: **сброс кэша CDN** в консоли, в Safari — закрыть вкладки / очистить кэш для сайта.

---

## Шаг 4 — DNS для пользователей (после POST от поддержки)

### Вариант A — DNS в Yandex Cloud (рекомендуется для apex на CDN)

1. Cloud DNS → зона `krimvk.ru`.
2. NS в REG.RU заменить на NS Яндекса.
3. Для `@`: запись **ANAME** / alias на CNAME CDN (в Yandex DNS это поддерживается).
4. `www` → CNAME на тот же CDN.
5. Редирект www→apex: middleware (уже в коде) и/или правило rewrite в CDN.

### Вариант B — DNS остаётся в REG.RU

Пока `@` = A `89.111.165.160` — **krimvk.ru мимо CDN**. Уточните в тикете, есть ли ALIAS для `@`, или перенесите зону в Yandex DNS (MX Resend скопировать).

| Имя | После включения CDN |
|-----|---------------------|
| `@` | ANAME/alias на CDN (Yandex DNS) |
| `www` | CNAME на CDN |
| `origin` | A `89.111.165.160` |

Подробнее: [доменные имена CDN](https://yandex.cloud/ru/docs/cdn/concepts/resource#hostnames).

---

## Шаг 5 — Отключить Cloudflare

1. Cloudflare → DNS → `A` `@` / `www`: **серое облако** или удалить записи CF.
2. Либо REG.RU → вернуть **свои NS** (не Cloudflare).
3. Подождать TTL 15–60 мин.

Проверка с телефона **без VPN**:

```bash
dig +short www.krimvk.ru CNAME   # edgecdn / yandexcloud
curl -fsSI https://krimvk.ru/api/health
```

В ответе не должно быть `server: cloudflare` (может быть nginx или заголовки CDN Яндекса).

---

## Шаг 6 — `.env` на VPS

```env
SITE_URL=https://krimvk.ru
NEXTAUTH_URL=https://krimvk.ru
CANONICAL_HOST=krimvk.ru
```

После смены DNS:

```bash
pm2 restart krimvk --update-env && pm2 save
```

---

## SSL на origin

| Где | Сертификат |
|-----|------------|
| Пользователь ↔ CDN | Let's Encrypt в CDN |
| CDN ↔ VPS | Можно HTTP на origin или отдельный cert для `origin.krimvk.ru` |

Если CDN → origin по **HTTPS**, выпустите certbot для `origin.krimvk.ru`:

```bash
sudo certbot certonly --nginx -d origin.krimvk.ru
```

---

## Стоимость

CDN в Yandex Cloud платный (трафик + запросы). Для небольшого сайта обычно **сотни рублей/мес**. Смотрите [тарифы CDN](https://yandex.cloud/ru/docs/cdn/pricing).

---

## Если CDN не нужен — только прямой VPS

Без CDN, только REG.RU **A** → `89.111.165.160` + `ufw-open-origin.sh` — см. [RU_ACCESS.md](./RU_ACCESS.md). Это проще, но без разгрузки и без «яндексовой» сети на краю.

---

## Чеклист

- [ ] `origin.krimvk.ru` → A → 89.111.165.160
- [ ] CDN-ресурс, источник `origin.krimvk.ru`, Host `krimvk.ru`
- [ ] CDN: gzip-on, **без** slice, **без** fetch-compressed; кэш только static
- [ ] nginx: **gzip выключен**; Next: `compress: false`; `pm2 restart`
- [ ] `@` (krimvk.ru) на CDN; `www` CNAME на CDN; www → 308 apex
- [ ] POST от поддержки; `emergency` POST на **krimvk.ru** → **400**
- [ ] Cloudflare выключен; UFW open
- [ ] Safari на **krimvk.ru**: стили и ЛК

---

## Связанные файлы

- [YANDEX_S3_SETUP.md](./YANDEX_S3_SETUP.md) — файлы в Object Storage
- [RU_ACCESS.md](./RU_ACCESS.md) — прямой доступ без CDN
- [CLOUDFLARE.md](./CLOUDFLARE.md) — не использовать proxy в РФ
