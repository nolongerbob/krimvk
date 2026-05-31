# Доступ к сайту из РФ (без VPN)

## Почему «не открывается без VPN»

Цепочка сейчас такая:

```
Браузер → DNS → IP Cloudflare (188.114.x.x) → VPS
```

В РФ **Cloudflare** периодически **режут или замедляют** (Роскомнадзор / операторы). Без VPN до IP Cloudflare не достучаться — сайт «мёртвый».

Плюс на VPS включён **UFW только для IP Cloudflare** — даже если в DNS поставить прямой IP nic.ru, без открытия firewall origin тоже не ответит.

---

## Быстрое решение (рекомендуется для аудитории в РФ)

### 1. Cloudflare — серое облако

**DNS** → записи **A** `@` и `www`:

| Было | Стало |
|------|--------|
| Оранжевое облако (Proxied) | **Серое (DNS only)** |
| IP 89.111.165.160 | то же |

Resend-записи (`resend._domainkey`, `send`, `_dmarc`) — как были, **DNS only**.

NS можно оставить на Cloudflare (удобно править DNS) или вернуть на REG.RU — на доступ из РФ это не критично, главное **не прокси**.

### 2. VPS — открыть 80/443

```bash
cd /var/www/krimvk
git pull
sudo bash scripts/ufw-open-origin.sh
```

### 3. Проверка

```bash
dig +short krimvk.ru A    # должен быть 89.111.165.160, не 188.114.x.x
curl -fsSI https://krimvk.ru/api/health
```

С телефона **без VPN** — открыть https://krimvk.ru

---

## Что теряете / что остаётся

| Без CF proxy | Остаётся на VPS |
|--------------|-----------------|
| CDN/WAF Cloudflare | HTTPS, nginx rate limits, fail2ban |
| Скрытие origin IP | UFW (22 + 80 + 443), SSH hardened |
| Защита от крупного DDoS через CF | fail2ban, rate limit, ntfy |

Для **основной аудитории в Крыму/РФ** прямой доступ на nic.ru VPS обычно **надёжнее**, чем оранжевое облако CF.

---

## Если снова нужен Cloudflare (международный трафик)

- Оранжевое облако + `ufw-cloudflare-origin.sh` — только если CF у ваших пользователей стабильно открыт.
- Альтернатива в РФ: **DDoS-Guard**, **Selectel CDN**, **QRATOR** — прокси без блокировок CF.

---

## Связанные файлы

- [CLOUDFLARE.md](./CLOUDFLARE.md)
- `scripts/ufw-open-origin.sh` — прямой доступ
- `scripts/ufw-cloudflare-origin.sh` — только CF (не для РФ без VPN)
