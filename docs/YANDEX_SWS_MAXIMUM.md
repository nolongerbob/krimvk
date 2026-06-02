# Smart Web Security — максимальная защита krimvk.ru

Прокси SWS: **51.250.116.133** → origin **89.111.165.160:443** (HTTPS).

---

## 1.0 SmartCaptcha `krimvk-captcha`

**Отдельный сервис** в консоли: **SmartCaptcha** (не путать с CDN).

1. **Создать капчу** → имя `krimvk-captcha`
2. **Список сайтов:** `krimvk.ru`, `www.krimvk.ru`
3. Сложность: **средняя** (или выше для максимума)
4. **Создать** → скопировать **ключ клиента** и **ключ сервера** (серверный — в `.env` на VPS, если позже виджет на формах)

В профиле безопасности:

- поле **SmartCaptcha** → **Создать** (или обновить список) → выбрать `krimvk-captcha`, не «По умолчанию»

Подозрительный трафик с **Smart Protection (полный режим)** уйдёт на капчу на edge **без** правок в Next.js.

**Логи профиля** (как на вашем скрине):

- Записывать логи: **вкл**
- **Cloud Logging** — вкл
- Вердикты: **DENY and CAPTCHA** + **ALLOW**

Опционально (фаза 2): виджет на `/login` и `/register` — ключ клиента в форме, `SMARTCAPTCHA_SERVER_KEY` для проверки токена. Документация: [SmartCaptcha](https://yandex.cloud/ru/docs/smartcaptcha/quickstart).

---

## 1. Профиль безопасности `krimvk-prod-max`

### Данные профиля

| Поле | Значение |
|------|----------|
| Имя | `krimvk-prod-max` |
| Базовое правило по умолчанию | **Запретить** (deny) — всё неизвестное режется |
| SmartCaptcha | **`krimvk-captcha`** (создать в SmartCaptcha, см. §1.0) |
| Анализировать тело запроса | **Вкл**, при превышении 8 KB → **Запретить** |
| Записывать логи | **Вкл** |
| Профиль ARL | `krimvk-arl` (см. §2) |

> Загрузки файлов >8 KB: обязательны **исключения** в правилах (§1.3), иначе сломаются `/api/*/upload*`.

### 1.1 Профиль WAF `krimvk-waf`

**Smart Web Security → Профили WAF → Создать:**

| Параметр | Значение |
|----------|----------|
| Имя | `krimvk-waf` |
| Наборы правил | **OWASP CRS** + **Yandex Ruleset** (+ **ML WAF**, если доступен) |
| Режим | **Блокировка** (не только наблюдение) |
| Чувствительность | средняя → высокая после 2–3 дней без ложных срабатываний |

### 1.2 Профиль ARL `krimvk-arl`

**Профили ARL → Создать** (лимиты на IP, уточните в UI):

| Зона | Лимит (старт) |
|------|----------------|
| Общий сайт | 120 req/min |
| `/api/auth/*` | 15 req/min |
| `/api/admin/*` | 60 req/min |
| `/api/*` (остальное) | 180 req/min |

Привязать ARL к профилю `krimvk-prod-max`.

### 1.3 Правила в профиле (сверху вниз по приоритету)

Добавляйте правила **выше** базового (меньший priority number = раньше в таблице, ориентир: как у `sp-rule-1` = 999900).

| # | Имя | Тип | Условие | Действие |
|---|-----|-----|---------|----------|
| 1 | `allow-uploads` | Base | URI начинается с `/api/` и содержит `upload` | **Разрешить** |
| 2 | `allow-health` | Base | URI = `/api/health` | **Разрешить** |
| 3 | `waf-all` | WAF | весь трафик, профиль `krimvk-waf` | **Блокировка** |
| 4 | `sp-api` | Smart Protection | URI начинается с `/api/` | режим **полный** / API protection |
| 5 | `sp-site` | Smart Protection | весь трафик | режим **полный** |
| 6 | `arl` | (через профиль ARL) | — | лимиты §1.2 |
| 7 | Базовое | Base | всё остальное | **Запретить** |

Если UI не даёт «Запретить» по умолчанию + точечные Allow — оставьте базовое **Разрешить**, но правила 3–5 с **блокировкой/капчей** и ARL обязательны.

### 1.4 Подключить к домену

Домен **krimvk.ru** → **Подключить** → `krimvk-prod-max`.

---

## 2. Origin (целевой ресурс)

| Параметр | Значение |
|----------|----------|
| Адрес | `89.111.165.160:443` |
| Протокол | **HTTPS** |
| HTTP версия | HTTP/1.1 или 2 — как отдаёт nginx |

Статус цели: **Healthy** до смены DNS.

---

## 3. DNS (REG.RU)

| Имя | Значение |
|-----|----------|
| `@` | A **51.250.116.133** |
| `www` | A **51.250.116.133** |
| `origin` | A **89.111.165.160** |
| MX/TXT `send` | без изменений |

---

## 4. VPS — максимум под SWS

```bash
cd /var/www/krimvk && git pull
sudo bash scripts/harden-vps.sh
sudo bash scripts/apply-nginx-rate-limits.sh
```

### 4.1 Real IP прокси

`/etc/nginx/conf.d/yandex-sws-real-ip.conf`:

```nginx
set_real_ip_from 51.250.116.133/32;
# Добавьте CIDR из: https://yandex.cloud/ru/docs/smartwebsecurity/concepts/connect-domain
real_ip_header X-Forwarded-For;
real_ip_recursive on;
```

### 4.2 Ограничить прямой обход IP (рекомендуется)

После стабилизации SWS — UFW: **443** только с подсетей Yandex (список в доке SWS) + ваш SSH IP.  
Исключение: **origin.krimvk.ru** для админ-доступа по IP или VPN.

> Агрессивный whitelist ломает прямой заход на `89.111.165.160` — это цель (обход защиты).

### 4.3 fail2ban

```bash
sudo systemctl status fail2ban
```

При необходимости включите jail для nginx `429/403` (см. `monitoring/fail2ban/`).

---

## 5. DDoS L3–L4 (Qrator)

Параллельно тикет / резерв **нового** публичного IP с `ddos_protection_provider = qrator`, привязка к VM, обновление:

- REG.RU `@`, `www` → **51.250.116.133** (SWS, не меняется при смене IP VM)
- SWS origin остаётся **внутренний IP VM** (89.111.165.160 или новый после Qrator)

Схема: пользователь → **SWS IP** → **защищённый IP VM**.

---

## 6. Проверки после включения

```bash
curl -sI https://krimvk.ru/api/health
curl -s -o /dev/null -w "POST %{http_code}\n" -X POST "https://krimvk.ru/api/emergency" \
  -H "Content-Type: application/json" -d '{}'
```

| Тест | Ожидание |
|------|----------|
| health | 200 |
| emergency POST | 400 |
| Логин ЛК | ок |
| Загрузка файла в админке | ок (правило `allow-uploads`) |
| Сканер `/.env` | 403/404 |

Логи: SWS → запросы / срабатывания WAF.

---

## 7. Если что-то режет пользователей

1. Временно WAF → наблюдение.  
2. Расширить `allow-uploads` / `/api/auth/`.  
3. Поднять лимиты ARL.  
4. Не отключать SWS целиком — точечно ослабить правило.

---

## Связанные файлы

- [YANDEX_PROTECTION.md](./YANDEX_PROTECTION.md)
- [WEB_SECURITY.md](./WEB_SECURITY.md)
