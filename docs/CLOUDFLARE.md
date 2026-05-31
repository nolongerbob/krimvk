# Cloudflare для krimvk.ru

Чеклист по подсказкам Cloudflare при подключении домена.

---

## 1. DNSSEC — выключить в REG.RU

Cloudflare просит **отключить DNSSEC** у регистратора, пока зона на их NS.

**REG.RU:**

1. Домен **krimvk.ru** → **DNS** / **DNSSEC** (или «Защита DNS»).
2. Если DNSSEC **включён** — **отключить** / удалить DS-записи.
3. Подождать до 24 ч (часто 15–60 мин).

В Cloudflare мастер настройки шаг «DNSSEC off» должен стать зелёным.

Позже DNSSEC можно включить **через Cloudflare** (DNS → Settings), не в REG.RU.

---

## 2. DNS в Cloudflare

| Запись | Значение | Прокси |
|--------|----------|--------|
| A `@` | `89.111.165.160` | **Proxied** (оранжевое облако) |
| A `www` | `89.111.165.160` | **Proxied** |
| TXT `resend._domainkey` | (как было) | **DNS only** (серое) |
| TXT `send` SPF | (как было) | **DNS only** |
| MX `send` | amazonses… | **DNS only** |
| TXT `_dmarc` | (как было) | **DNS only** |

**NS в REG.RU** — заменить на nameservers Cloudflare (из панели CF).

---

## 3. SSL в Cloudflare

**SSL/TLS** → режим **Full (strict)**.

- На VPS уже есть Let's Encrypt — подходит.
- **Не** использовать Flexible.

**Edge Certificates:** Always Use HTTPS — включить.

### Продление сертификата на VPS (важно!)

Если закроете порт 80/443 только для IP Cloudflare (шаг 4), **certbot --nginx** по HTTP-01 **перестанет** обновляться (Let's Encrypt ходит не через Cloudflare).

Варианты:

| Вариант | Действие |
|---------|----------|
| **A. Origin Certificate** (проще с CF) | Cloudflare → SSL → Origin Server → Create → установить на nginx вместо Let's Encrypt ([документация CF](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/)) |
| **B. DNS-01** | `certbot certonly --dns-cloudflare` + API token |
| **C. Не закрывать 80** | оставить UFW `allow 80` для всех (слабее защита origin) |

Пока certbot уже работает и firewall **ещё не** закрыт — продление обычно идёт как раньше.

---

## 4. Только IP Cloudflare на origin (firewall)

Делать **после** того, как сайт открывается через Cloudflare.

```bash
cd /var/www/krimvk
git pull
sudo bash scripts/ufw-cloudflare-origin.sh
```

Скрипт:

- **SSH 22** — открыт (иначе потеряете доступ к VPS).
- **80 / 443** — только с [диапазонов Cloudflare](https://www.cloudflare.com/ips/).
- Прямой заход `http://89.111.165.160` — не должен открывать сайт (норма).

Проверка:

```bash
curl -fsSI https://krimvk.ru/api/health
sudo ufw status numbered | head -30
```

Откат (открыть 80/443 для всех снова):

```bash
sudo ufw reset
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 5. Реальный IP в логах nginx

```bash
sudo cp /var/www/krimvk/nginx/cloudflare-real-ip.conf /etc/nginx/conf.d/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Безопасность в панели Cloudflare (Free)

- **Security → Settings** — уровень Medium.
- **Bots** — базовая защита.
- **Caching** — для `/admin*` правило **Bypass cache** (Cache Rules).
- **WAF** — что доступно на Free, включить.

Плюс на VPS: `sudo bash scripts/harden-vps.sh`, rate limit в nginx — [WEB_SECURITY.md](./WEB_SECURITY.md).

---

## 7. Порядок действий (кратко)

1. Cloudflare: добавить сайт, DNS, NS в REG.RU.  
2. REG.RU: **DNSSEC off**.  
3. Дождаться `https://krimvk.ru`.  
4. SSL: **Full (strict)**.  
5. `ufw-cloudflare-origin.sh` + `cloudflare-real-ip.conf`.  
6. Решить продление SSL (Origin CA или DNS-01).  

---

## Связанные файлы

- `scripts/ufw-cloudflare-origin.sh`
- `nginx/cloudflare-real-ip.conf`
- [WEB_SECURITY.md](./WEB_SECURITY.md)
