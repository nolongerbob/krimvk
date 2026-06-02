# Статика через Yandex CDN, сайт и ЛК — напрямую на VPS

Yandex **не разрешил POST** на CDN для динамического приложения. Рабочая схема:

```text
https://krimvk.ru          → A → VPS (HTML, API, NextAuth, ЛК)
https://www.krimvk.ru      → редирект на krimvk.ru
https://cdn.krimvk.ru      → CNAME → Yandex CDN → origin (только GET, /_next/static/*)
```

Защита от DDoS на весь сервер: [YANDEX_DDOS.md](./YANDEX_DDOS.md).

---

## 1. DNS (REG.RU)

| Имя | Тип | Значение |
|-----|-----|----------|
| `@` | A | `89.111.165.160` |
| `www` | A | `89.111.165.160` (или редирект REG.RU → `https://krimvk.ru`) |
| `origin` | A | `89.111.165.160` |
| `cdn` | **CNAME** | имя из консоли CDN (`*.yccdn.ru` / `edgecdn`) |
| MX, TXT Resend | — | не менять |

Проверка:

```bash
dig +short cdn.krimvk.ru CNAME
dig +short krimvk.ru A
```

---

## 2. CDN-ресурс только для `cdn.krimvk.ru`

Можно **отдельный** ресурс (рекомендуется) или доп. имя на старом — логичнее отдельный: только GET, без POST.

| Параметр | Значение |
|----------|----------|
| Домен контента | **cdn.krimvk.ru** |
| Источник | **origin.krimvk.ru** |
| Протокол | HTTPS |
| Host к источнику | **krimvk.ru** |
| Сертификат | Certificate Manager для `cdn.krimvk.ru` |
| Методы | GET, HEAD, OPTIONS (POST не нужен) |
| GZip на CDN | Вкл |
| Сегментация (slice) | Выкл |
| Кэш | долго для `/_next/static/*`; остальное — не кэшировать |

Файлы из `public/` (`/bvi/`, `/images/`) по-прежнему с **krimvk.ru**, не с CDN.

---

## 3. Приложение (VPS)

В `.env` на VPS **перед сборкой**:

```env
SITE_URL=https://krimvk.ru
NEXTAUTH_URL=https://krimvk.ru
CANONICAL_HOST=krimvk.ru
NEXT_PUBLIC_ASSET_PREFIX=https://cdn.krimvk.ru
```

Деплой:

```bash
cd /var/www/krimvk
git pull
npm run build
pm2 restart krimvk --update-env
```

В HTML чанки должны идти с `https://cdn.krimvk.ru/_next/static/...`.

Проверка:

```bash
curl -s https://krimvk.ru | grep -o 'https://cdn.krimvk.ru[^"]*' | head -3
curl -sI "https://cdn.krimvk.ru/_next/static/chunks/webpack-$(curl -s https://krimvk.ru | grep -o '_next/static/chunks/webpack-[^"]*' | head -1 | xargs basename)" 2>/dev/null || \
curl -sI "$(curl -s https://krimvk.ru | grep -o 'https://cdn.krimvk.ru/_next/static/[^"]*\.js' | head -1)"
```

Ожидаем **200** и `cache-host: yccdn`.

Локально / dev: `NEXT_PUBLIC_ASSET_PREFIX` не задавать.

---

## 4. nginx на origin

Без изменений: `/_next/static` проксируется на Next. CDN запрашивает те же пути с `Host: krimvk.ru`.

При **gzip-on** на CDN — на VPS **gzip в nginx выключен** (см. `nginx.conf.example`).

---

## 5. Старый CDN на www

Записи **www → CNAME на yccdn** для пользователей **убрать**. Иначе снова 405 на POST и Safari.

Ресурс `www` + `krimvk.ru` в CDN можно оставить выключенным для клиентов или удалить позже.

---

## 6. Чеклист

- [ ] `cdn` → CNAME на CDN
- [ ] `@`, `www` → A на VPS
- [ ] CDN-ресурс `cdn.krimvk.ru`, кэш `/_next/static/*`
- [ ] `.env`: `NEXT_PUBLIC_ASSET_PREFIX=https://cdn.krimvk.ru`
- [ ] `npm run build` + `pm2 restart`
- [ ] В браузере: ЛК на krimvk.ru, в Network — static с cdn.*
- [ ] [YANDEX_DDOS.md](./YANDEX_DDOS.md) — защита IP сервера

---

## Связанные файлы

- [YANDEX_DDOS.md](./YANDEX_DDOS.md)
- [YANDEX_CDN.md](./YANDEX_CDN.md) — полный CDN (POST отклонён)
- [RU_ACCESS.md](./RU_ACCESS.md)
