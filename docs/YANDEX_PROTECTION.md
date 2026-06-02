# Защита krimvk.ru: DDoS, боты, WAF (Yandex + VPS)

Схема: **DNS → (опционально) Smart Web Security → VPS nginx → Next.js**.  
Сайт на **A → VPS** ([CDN_SIMPLE.md](./CDN_SIMPLE.md)), POST не через CDN.

---

## Три уровня (по порядку)

| Уровень | Где | Защита от | Срок |
|---------|-----|------------|------|
| **1. VPS** | nginx, middleware, UFW, fail2ban | сканеры, брутфорс, лёгкий HTTP-флуд | **сегодня** |
| **2. DDoS Protection** | Qrator на публичном IP | объёмные L3–L4 атаки | тикет / новый IP |
| **3. Smart Web Security (SWS)** | прокси Yandex перед VPS | боты, WAF, L7 DDoS, капча | консоль + смена A |

Уровни **2 и 3** платные; **1** бесплатно.

---

## Уровень 1 — VPS (сделать сейчас)

На сервере:

```bash
cd /var/www/krimvk
git pull
sudo bash scripts/harden-vps.sh
sudo bash scripts/apply-nginx-rate-limits.sh
sudo nginx -t && sudo systemctl reload nginx
```

Уже в проекте:

- **UFW** — только 22, 80, 443
- **fail2ban** — SSH / nginx
- **nginx** `limit_req` / `limit_conn` (`nginx/krimvk-security.conf`)
- **middleware** — сканеры `.env`, `wp-admin` → 404; rate limit на `/api/auth/*`

Проверка:

```bash
sudo ufw status
sudo fail2ban-client status
curl -sI https://krimvk.ru/api/health
```

Подробнее: [WEB_SECURITY.md](./WEB_SECURITY.md).

---

## Уровень 2 — DDoS Protection на IP (L3–L4)

Защищает **весь** трафик на IP (не только HTTP).

**Ограничение:** на уже выданный `89.111.165.160` базовую защиту **часто нельзя включить** — нужен адрес из пула с **Qrator** при резервировании или **расширенная** защита через поддержку.

### Вариант A — новый защищённый IP

1. [Консоль](https://console.yandex.cloud) → **VPC** → **IP-адреса** → **Зарезервировать**.
2. Включить **Поставщик защиты от DDoS** → **Qrator**.
3. Привязать IP к VM, отвязать старый.
4. REG.RU: `@`, `www`, `origin` → **новый IP**.
5. В поддержке указать порог легитимного трафика (Мбит/с, пакеты/с).

### Вариант B — тикет без смены IP (расширенная)

Текст:

```
Просим подключить защиту от DDoS для сайта krimvk.ru.
VM Yandex Cloud, публичный IP 89.111.165.160, порты 80/443, nginx → Next.js.
Нужны L3–L4 (и при возможности L7) от объёмных атак.
Легитимный трафик: жители ЖК, РФ, HTTPS, личный кабинет, API.
Можно ли защитить текущий IP или нужен перенос на адрес с Qrator?
```

Документация: [DDoS Protection](https://yandex.cloud/ru/docs/vpc/ddos-protection/).

---

## Уровень 3 — Smart Web Security (боты, WAF, L7)

**SWS** — обратный прокси: пользователь → **IP прокси Yandex** → ваш VPS `89.111.165.160:443`.

Подходит для:

- Smart Protection (ML, поведение)
- WAF (SQLi, XSS, OWASP)
- лимиты запросов (ARL)
- списки стран / Tor / VPN (по политике)
- базовый DDoS на L7 в связке с прокси

**MX на `send.*` не ломается** — меняете только **A** для `@` и `www` (почта Resend на поддоменах).

### Шаг 1 — Прокси-сервер и домен

1. [Консоль](https://console.yandex.cloud) → **Smart Web Security**.
2. **Защита доменов** → **Создать прокси-сервер** (имя, например `krimvk-proxy`).
3. **Добавить домен**:
   - `krimvk.ru`
   - источник (origin): `89.111.165.160`, порт **443**, HTTPS
   - при необходимости добавить `www.krimvk.ru` или редирект www на apex в SWS
4. Скопировать **IP прокси-сервера** из раздела «Как активировать защиту».

Документация: [Быстрый старт SWS](https://yandex.cloud/ru/docs/smartwebsecurity/quickstart).

### Шаг 2 — Профиль безопасности

**Максимальная настройка (WAF block + Smart Protection full + ARL + deny default):**  
→ **[YANDEX_SWS_MAXIMUM.md](./YANDEX_SWS_MAXIMUM.md)** — пошагово под krimvk.ru (включая исключения для upload >8 KB).

Краткий вариант:

1. **Профили безопасности** → **Создать** (шаблон «базовый» или вручную).
2. WAF-профиль + ARL + правила Smart Protection / WAF.
3. **Подключённые хосты** → домен `krimvk.ru`.

### Шаг 3 — DNS (REG.RU)

| Имя | Было | Стало |
|-----|------|--------|
| `@` | A `89.111.165.160` | **A → IP прокси SWS** |
| `www` | A VPS | **A → тот же IP прокси SWS** (или CNAME, если SWS даст) |
| `origin` | A VPS | **оставить A `89.111.165.160`** (прямой доступ только для вас/CDN static) |
| `send`, MX, TXT | — | **не менять** |

Прямой заход на IP мимо SWS возможен — ограничивайте firewall только нужными источниками, если Yandex даст диапазоны прокси (уточните в доке SWS).

### Шаг 4 — nginx за прокси

SWS передаёт `X-Forwarded-For`. В `server` для 443:

```nginx
set_real_ip_from <IP_прокси_SWS>/32;   # или диапазоны из документации Yandex
real_ip_header X-Forwarded-For;
real_ip_recursive on;
```

Иначе `limit_req` и fail2ban видят один IP прокси.

После смены DNS:

```bash
sudo nginx -t && sudo systemctl reload nginx
pm2 restart krimvk --update-env
```

Проверка: логин в ЛК, `/api/health`, нет циклов редиректа.

### Шаг 5 — POST

Трафик идёт **на SWS → VPS**, не на CDN Yandex с запретом POST. ЛК должен работать. Проверка:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "https://krimvk.ru/api/emergency" \
  -H "Content-Type: application/json" -d '{}'
```

Ожидаем **400**.

---

## Рекомендуемый порядок внедрения

```text
Неделя 0:  Уровень 1 (harden-vps + nginx limits) — уже можно
Неделя 1:  Тикет DDoS (уровень 2) или резерв IP с Qrator
Неделя 2:  SWS (уровень 3) в observe → смена A на IP прокси
Позже:     static CDN cdn.* — [YANDEX_STATIC_CDN.md](./YANDEX_STATIC_CDN.md)
```

---

## Один тикет в поддержку (опционально)

```
Тема: DDoS + Smart Web Security для krimvk.ru

Сайт krimvk.ru на VM Yandex Cloud (89.111.165.160), nginx → Next.js, ЛК и API.
Просим:
1) Подключить L3–L4 DDoS Protection (Qrator) — текущий IP или перенос на защищённый.
2) Подтвердить схему: SWS прокси → origin 89.111.165.160:443, MX остаются на поддомене send.
3) Диапазоны IP прокси SWS для set_real_ip_from в nginx.

Ожидаемый трафик: РФ, HTTPS, сотни–тысячи пользователей.
```

---

## Стоимость

- Уровень 1 — бесплатно (ресурсы VPS).
- [Тарифы DDoS](https://yandex.cloud/ru/docs/vpc/pricing), [тарифы SWS](https://yandex.cloud/ru/docs/smartwebsecurity/pricing) — смотрите калькулятор в консоли.

---

## Связанные файлы

- [WEB_SECURITY.md](./WEB_SECURITY.md)
- [YANDEX_DDOS.md](./YANDEX_DDOS.md) — кратко про L3–L4
- [CDN_SIMPLE.md](./CDN_SIMPLE.md)
