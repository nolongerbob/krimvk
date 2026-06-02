# Защита от DDoS (Yandex Cloud) для VPS krimvk

> **Полный план (DDoS + боты + WAF + VPS):** [YANDEX_PROTECTION.md](./YANDEX_PROTECTION.md)

Схема трафика: **сайт и API** — на публичный IP VPS; **статика** — [YANDEX_STATIC_CDN.md](./YANDEX_STATIC_CDN.md). DDoS-защита нужна **на IP сервера** (и опционально L7).

Документация:

- [DDoS Protection в VPC](https://yandex.cloud/ru/docs/vpc/ddos-protection/)
- [Включение при резервировании IP](https://yandex.cloud/ru/docs/vpc/operations/enable-ddos-protection)
- [Smart Web Security](https://yandex.cloud/ru/docs/smartwebsecurity/) (L7, WAF, боты)

---

## Уровни защиты

| Уровень | Продукт | Что закрывает |
|---------|---------|----------------|
| L3–L4 | **DDoS Protection** (Qrator) на публичном IP | объёмные атаки на IP VPS |
| L7 | **Smart Web Security** (профиль + домен/ALB) | HTTP-флуд, боты, WAF |
| Edge (частично) | CDN только на `cdn.krimvk.ru` | разгрузка static, не весь сервер |

Для «защиты всего сервера» минимум — **DDoS Protection на IP**; для веб-приложения разумно добавить **SWS** на домен `krimvk.ru`.

---

## 1. DDoS Protection на IP (L3–L4)

**Важно:** базовую защиту **нельзя включить на уже выданный** обычный IP — адрес берётся из **отдельного пула** при создании VM или резервировании адреса с опцией `qrator`.

Текущий IP: `89.111.165.160`.

### Вариант A — новый защищённый IP (плановая миграция)

1. [Консоль](https://console.yandex.cloud) → **VPC** → **IP-адреса** → **Зарезервировать**.
2. Включить **Поставщик защиты от DDoS** → **Qrator**.
3. Привязать адрес к VM `vm2605282916` (отвязать старый).
4. Обновить **A-записи** в REG.RU: `@`, `www`, `origin` → новый IP.
5. В тикете поддержки DDoS указать **порог легитимного трафика** (объём L3–L4).

### Вариант B — расширенная защита без смены схемы

[Форма / поддержка](https://yandex.cloud/ru/docs/vpc/ddos-protection/index): расширенная защита (Advanced), характеристики сайта и легитимного трафика. После подключения расширенной **базовую на том же IP обычно отключают** — возможна **смена IP**, уточняйте в тикете.

**Текст для тикета:**

```
Просим подключить защиту от DDoS для публичного сайта krimvk.ru.
VM в Yandex Cloud, публичный IP 89.111.165.160, порты 80/443 (nginx → Next.js).
Трафик: жители ЖК, РФ, HTTPS, API и личный кабинет.
Нужна L3–L4 защита на IP; при необходимости подскажите расширенную (L7) 
и смену IP, если текущий адрес нельзя защитить in-place.
```

---

## 2. Smart Web Security (L7) — опционально

Подходит, если нужны WAF, антибот, лимиты на HTTP.

1. **Smart Web Security** → профиль безопасности (Smart Protection, при необходимости WAF).
2. Подключение к ресурсу:
   - **Домен** `krimvk.ru` (прокси SWS перед origin), или
   - **Application Load Balancer** → VM (сложнее, но гибко).

При подключении **домена** трафик идёт через прокси Yandex — DNS может смениться (CNAME на SWS). MX в REG.RU согласуйте с документацией SWS.

Для старта часто достаточно **L3–L4 на IP** + nginx `limit_req` (уже в `nginx.conf.example`).

---

## 3. Что уже есть на VPS

- `limit_conn`, `limit_req` в nginx
- `scripts/ufw-open-origin.sh` (80/443)
- rate limit в middleware (`lib/security/http-guard`)

DDoS Protection дополняет это **до** попадания на VM.

---

## 4. Порядок внедрения

1. [YANDEX_STATIC_CDN.md](./YANDEX_STATIC_CDN.md) — `cdn.krimvk.ru`, сборка с `NEXT_PUBLIC_ASSET_PREFIX`.
2. Тикет / резервирование IP с **Qrator** (запланировать окно смены DNS).
3. По желанию — Smart Web Security на `krimvk.ru`.
4. Мониторинг: `NTFY_*`, `/api/health`.

---

## Стоимость

DDoS Protection и SWS — платные; оценка в [тарифах VPC](https://yandex.cloud/ru/docs/vpc/pricing) и [SWS](https://yandex.cloud/ru/docs/smartwebsecurity/pricing).
