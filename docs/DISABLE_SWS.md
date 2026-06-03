# Отключение Smart Web Security (экономия)

Трафик снова идёт **напрямую на VPS**, без прокси Yandex (`51.250.116.133`).

## 1. REG.RU (главное)

| Имя | Было (SWS) | Стало |
|-----|------------|--------|
| `@` | A `51.250.116.133` | **A `89.111.165.160`** |
| `www` | A `51.250.116.133` | **A `89.111.165.160`** |

MX/TXT на `send.*` **не трогать**.

Проверка (подождите TTL 5–30 мин):

```bash
dig @8.8.8.8 +short krimvk.ru A www.krimvk.ru A
# оба: 89.111.165.160

curl -sI https://krimvk.ru/api/health
# 200, Server: nginx (не ycalb)
```

## 2. Консоль Yandex Cloud (чтобы не платить)

**Smart Web Security** → домен `krimvk.ru` → **отключить защиту** / удалить привязку домена к прокси `krimvk-proxy`.

Пока домен привязан к SWS, может идти биллинг даже без DNS.

## 3. VPS

### UFW

Если включали `scripts/ufw-yandex-sws-origin.sh` (443 только с Yandex):

```bash
sudo bash /var/www/krimvk/scripts/ufw-open-origin.sh
```

### nginx `real_ip`

Конфиг SWS (`yandex-sws-real-ip.conf`) можно **отключить** — не обязателен без прокси:

```bash
sudo mv /etc/nginx/conf.d/yandex-sws-real-ip.conf /etc/nginx/conf.d/yandex-sws-real-ip.conf.disabled 2>/dev/null || true
sudo nginx -t && sudo systemctl reload nginx
```

### Приложение

```bash
cd /var/www/krimvk && git pull
pm2 restart krimvk --update-env
```

## 4. Что остаётся без SWS

| Уровень | Защита |
|---------|--------|
| nginx rate limit, fail2ban, middleware | да (VPS) |
| SWS WAF / капча / 429 на краю | **нет** |
| DDoS на IP | только тикет Qrator или терпеть |

Схема DNS: [CDN_SIMPLE.md](./CDN_SIMPLE.md).

## 5. Вернуть SWS позже

Снова A `@`/`www` → IP прокси из консоли SWS, origin HTTPS + SNI `krimvk.ru`, см. [YANDEX_PROTECTION.md](./YANDEX_PROTECTION.md).
