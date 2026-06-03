# Защита krimvk.ru: DDoS, боты, WAF (Yandex + VPS)

> **SWS отключён (экономия):** DNS снова **A → VPS** `89.111.165.160` — [DISABLE_SWS.md](./DISABLE_SWS.md).  
> Ниже — справка, если включите SWS снова.

Схема без SWS: **DNS → VPS nginx → Next.js** ([CDN_SIMPLE.md](./CDN_SIMPLE.md)).  
С SWS: **DNS → прокси Yandex → VPS**.

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

### Чеклист: всё работает и что реально закрыто

**Схема сейчас:** браузер → DNS `krimvk.ru` / `www` → **SWS** (`51.250.116.133`) → **HTTPS** origin `89.111.165.160:443` (SNI `krimvk.ru`) → nginx → Next.js.

| Угроза | Закрыто? | Как |
|--------|----------|-----|
| Боты / L7 / WAF / капча на домене | ✅ | SWS профиль `krimvk-prod` |
| POST, ЛК, API через домен | ✅ | Трафик на SWS, не на CDN |
| Объёмная L3–L4 на IP VPS | ⚠️ частично | SWS не заменяет Qrator на `89.111.165.160` — см. уровень 2 |
| Обход SWS по IP / `origin` в DNS | ⚠️ | Прямой заход на VPS возможен — UFW только с IP Yandex (опционально) |
| Static CDN `cdn.*` | ❌ позже | [YANDEX_STATIC_CDN.md](./YANDEX_STATIC_CDN.md) |

#### 1. DNS и SWS (2 мин)

```bash
dig +short krimvk.ru A www.krimvk.ru A
# оба → 51.250.116.133 (IP прокси SWS)

dig +short origin.krimvk.ru A
# лучше пусто; если A → 89.111.165.160 — обход для ботов возможен
```

Консоль **Smart Web Security** → `krimvk.ru`:

- Статус **Healthy**, цель `89.111.165.160:443`
- **Подключение к целевому ресурсу:** **HTTPS**, SNI **`krimvk.ru`** (не HTTP на 443)
- Профиль **`krimvk-prod`** подключён, логи включены

#### 2. Сайт с интернета (curl)

```bash
curl -sI https://krimvk.ru/api/health
# HTTP/2 200

curl -sI https://www.krimvk.ru/
# 301/308 на https://krimvk.ru/ (канонический хост)

curl -s -o /dev/null -w "POST %{http_code}\n" -X POST "https://krimvk.ru/api/emergency" \
  -H "Content-Type: application/json" -d '{}'
# 400 (не 405/502 — POST доходит до приложения)

curl -sI "https://krimvk.ru/.env"
# 404 (middleware)
```

#### 3. В браузере (5 мин)

- [ ] Главная, новости, статические страницы
- [ ] **Вход** `/login` → дашборд `/dashboard` (не чёрный экран / `request-id`)
- [ ] **Выход** и повторный вход
- [ ] **Восстановление пароля** (письмо с `send.*` — MX не трогали)
- [ ] Форма **аварийной заявки** `/emergency` (отправка)
- [ ] В админке: **загрузка файла** (правило `allow-uploads`)
- [ ] С телефона без VPN (РФ), при возможности Safari

#### 4. VPS (SSH, раз в неделю или после деплоя)

```bash
pm2 status
# krimvk online, ↺ не растёт

curl -s -o /dev/null -w "%{http_code}\n" -H "Host: krimvk.ru" http://127.0.0.1:3000/api/health
# 200

sudo nginx -t
grep -r real_ip /etc/nginx/conf.d/ /etc/nginx/sites-enabled/krimvk 2>/dev/null | head -5
# set_real_ip_from 51.250.116.133; real_ip_header X-Forwarded-For;

sudo ufw status
sudo fail2ban-client status
```

Деплой только от пользователя **krimvk**: `./scripts/deploy-vps.sh` (не `sudo npm run build`).

#### 5. SWS не режет людей (логи)

Консоль → профиль → **логи** / Cloud Logging: смотреть **ALLOW** для обычных визитов, **CAPTCHA/DENY** — единично.

Если жители жалуются на капчу или блок:

1. Найти **request-id** с экрана → событие в логах SWS.  
2. Ослабить точечно (ARL, Smart Protection), не отключать SWS целиком — [YANDEX_SWS_MAXIMUM.md](./YANDEX_SWS_MAXIMUM.md) §7.

#### 6. Защита самого сервера (IP VPS), не только домена

Удаление **`origin`** в REG.RU убирает подсказку в DNS, но IP **`89.111.165.160`** всё равно сканируют. Два слоя:

| Мера | Что даёт |
|------|----------|
| **UFW: 80/443 только с SWS** | Прямой HTTP(S) на IP с интернета не доходит; сайт только через SWS |
| **DDoS Protection (Qrator)** | Объёмный L3–L4 на IP — см. уровень 2 выше |

**Перед UFW:** SWS стабилен (`curl` через `51.250.116.133` → 200), открыта запасная SSH-сессия.

```bash
cd /var/www/krimvk
# опционально: только ваш IP для SSH и прямого 443
# sudo ADMIN_IP=ВАШ_ДОМАШНИЙ_IP bash scripts/ufw-yandex-sws-origin.sh
sudo bash scripts/ufw-yandex-sws-origin.sh
```

Подсети в скрипте — из [списка IP Yandex Cloud](https://yandex.cloud/ru/docs/security/ip-list) (Smart Web Security). Если после обновления у Yandex сайт упал — сверьте диапазоны в доке и в скрипте.

**Certbot:** HTTP-01 на :80 с интернета перестанет работать → `certbot certonly --dns-reg.ru ...` или временно откат UFW на обновление сертификата.

**Проверка:**

```bash
# с Mac — сайт жив
curl -fsSI https://krimvk.ru/api/health

# с Mac — прямой IP (должен отказать / таймаут)
curl -m 5 -sSI https://89.111.165.160/ -k --resolve krimvk.ru:443:89.111.165.160 || echo "blocked OK"
```

nginx `set_real_ip_from` — те же подсети + `51.250.116.133/32` (`nginx/yandex-sws-real-ip.conf.example`).

#### 7. Что ещё не «покрыто» (нормально)

- **Qrator / DDoS Protection** на сам IP — отдельный тикет (уровень 2).  
- **CDN** только для `/_next/static` — отдельный этап.  
- **100%** скрытие IP — без UFW + Qrator не достижимо; сканеры всё равно «стучатся», но не попадают в приложение.

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
