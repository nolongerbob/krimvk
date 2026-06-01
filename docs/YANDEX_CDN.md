# Yandex Cloud CDN для krimvk.ru (вместо Cloudflare)

CDN в **Yandex Cloud** нормально открывается из РФ. Схема: пользователь → **CDN Яндекса** → ваш VPS **89.111.165.160** (origin).

У вас уже есть **Object Storage** в Yandex — CDN включается в том же облаке.

Документация Яндекса: [CDN — источники](https://yandex.cloud/ru/docs/cdn/concepts/origins), [создание ресурса](https://yandex.cloud/ru/docs/cdn/operations/resources/create-resource).

---

## Схема

```text
Пользователь (РФ)
    → DNS: krimvk.ru → CNAME на *.cdn.yandexcloud.net
    → CDN (TLS, кэш статики)
    → origin.krimvk.ru (A → 89.111.165.160)
    → nginx → Next.js :3000
```

**Cloudflare:** отключить оранжевое облако или вернуть NS на REG.RU / перенести DNS в Yandex Cloud.

**UFW на VPS:** оставить `scripts/ufw-open-origin.sh` (80/443 открыты). Отдельного списка IP CDN для UFW у Яндекса нет — origin должен принимать запросы от CDN.

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

---

## Шаг 4 — DNS для пользователей

### Вариант A — DNS в REG.RU (проще для www)

| Имя | Тип | Значение |
|-----|-----|----------|
| `www` | **CNAME** | `cl-xxxxx.edgecdn.ru.` (из консоли CDN) |
| `@` | **A** | `89.111.165.160` **или** перенаправление `@` → `https://www.krimvk.ru` |

Многие так делают: **www через CDN**, apex редирект на www.

### Вариант B — DNS в Yandex Cloud (apex на CDN)

1. Cloud DNS → зона `krimvk.ru`.
2. NS в REG.RU заменить на NS Яндекса.
3. Для `@`: запись **ANAME** / alias на CNAME CDN (в Yandex DNS это поддерживается).
4. `www` → CNAME на тот же CDN.

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
NEXTAUTH_URL=https://krimvk.ru
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
- [ ] Кэш только static, `/api` без кэша
- [ ] CNAME www (и/или ANAME @) на CDN
- [ ] Cloudflare выключен
- [ ] UFW: 80/443 open (`ufw-open-origin.sh`)
- [ ] Сайт без VPN, health 200

---

## Связанные файлы

- [YANDEX_S3_SETUP.md](./YANDEX_S3_SETUP.md) — файлы в Object Storage
- [RU_ACCESS.md](./RU_ACCESS.md) — прямой доступ без CDN
- [CLOUDFLARE.md](./CLOUDFLARE.md) — не использовать proxy в РФ
