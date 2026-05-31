# Подключение домена с REG.RU к VPS

VPS: **89.111.165.160** (замените, если другой).  
Приложение: PM2 `krimvk` на порту **3000**, nginx на **80/443**.

Подставьте вместо `krimvk.ru` свой домен.

---

## Шаг 1 — DNS в REG.RU

1. [reg.ru](https://www.reg.ru) → **Домены** → ваш домен.
2. **DNS-серверы** — оставьте серверы REG.RU (ns1.reg.ru / ns2.reg.ru), если не переносите зону.
3. **Управление зоной** / **Ресурсные записи** → добавьте:

| Тип | Имя (хост) | Значение | TTL |
|-----|------------|----------|-----|
| **A** | `@` | `89.111.165.160` | 300–3600 |
| **A** | `www` | `89.111.165.160` | 300–3600 |

4. Удалите или отключите **парковку** / редирект REG.RU на заглушку, если включены.
5. Подождите **5–60 минут**.

Проверка с Mac или VPS:

```bash
dig +short krimvk.ru A
dig +short www.krimvk.ru A
```

Оба должны показать IP VPS.

---

## Шаг 2 — Файрвол (если включён ufw)

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

---

## Шаг 3 — Nginx под домен (на VPS)

```bash
sudo cp /var/www/krimvk/nginx.conf.domain-staging.example /etc/nginx/sites-available/krimvk
```

Отредактируйте домен:

```bash
sudo nano /etc/nginx/sites-available/krimvk
# Замените krimvk.ru на ваш домен в server_name (2 места)
```

Подключите сайт и отключите старый IP-only конфиг, если был:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/krimvk-ip   # если создавали отдельно
sudo ln -sf /etc/nginx/sites-available/krimvk /etc/nginx/sites-enabled/krimvk
sudo nginx -t && sudo systemctl reload nginx
```

Проверка по HTTP (до SSL):

```bash
curl -sI http://krimvk.ru/ | head -3
```

Должен отвечать ваш сайт (не заглушка REG.RU).

---

## Шаг 4 — SSL (Let's Encrypt)

Только когда DNS уже указывает на VPS:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d krimvk.ru -d www.krimvk.ru
```

- Email для уведомлений — ваш.
- Согласие с ToS — Yes.
- Редирект HTTP→HTTPS — **2** (рекомендуется).

Проверка:

```bash
curl -fsS https://krimvk.ru/api/health
```

---

## Шаг 5 — `.env` приложения

```bash
sudo -u krimvk nano /var/www/krimvk/.env
```

```env
NEXTAUTH_URL=https://krimvk.ru
EMAIL_FROM=noreply@krimvk.ru
```

Перезапуск:

```bash
cd /var/www/krimvk
node scripts/rewrite-s3-file-urls.js   # опционально: ссылки в БД на https://домен/files/...
npm run build
pm2 restart krimvk --update-env
```

---

## Шаг 6 — Проверка в браузере

- https://krimvk.ru/
- https://krimvk.ru/admin (логин)
- https://krimvk.ru/o-kompanii/raskrytie-informatsii (PDF открывается)
- https://krimvk.ru/legal/privacy

---

## Частые проблемы

| Симптом | Решение |
|---------|---------|
| Открывается парковка REG.RU | DNS ещё не обновился или A-запись не на VPS |
| `certbot` ошибка connection | порт 80 закрыт / nginx не слушает / DNS не на VPS |
| Сайт по IP, по домену — нет | неверный `server_name` в nginx |
| После входа выкидывает | `NEXTAUTH_URL` не совпадает с доменом (https, без слэша в конце) |
| www не работает | A-запись для `www` + certbot для `www` |

---

## Dev-поддомен (позже, опционально)

В REG.RU: `A` → `dev` → тот же IP.  
В nginx — блок `dev.krimvk.ru` из `nginx.conf.example`.  
Отдельный certbot: `sudo certbot --nginx -d dev.krimvk.ru`.
