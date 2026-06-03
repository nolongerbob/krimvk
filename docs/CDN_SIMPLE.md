# POST не через CDN (минимальная настройка)

**Текущая схема:** `@` и `www` → **A `89.111.165.160`** (без Yandex CDN и без SWS).  
Отключение SWS: [DISABLE_SWS.md](./DISABLE_SWS.md).

Чтобы **все POST** (логин, API, формы) шли **только на VPS**, достаточно DNS. Код менять не обязательно.

## Правило

**Через CDN** может быть только поддомен, который **не открывают пользователи** для сайта (например `cdn.krimvk.ru` только для `/_next/static`).

**Не через CDN:** `krimvk.ru`, `www.krimvk.ru` — только **A** на IP сервера.

## REG.RU

| Имя | Должно быть | Нельзя |
|-----|-------------|--------|
| `@` (krimvk.ru) | **A** → `89.111.165.160` | CNAME на `*.yccdn.ru` |
| `www` | **A** → `89.111.165.160` | CNAME на CDN |
| `origin` | **A** → `89.111.165.160` | — |
| `cdn` (опционально) | CNAME на CDN | только если включили static CDN |

Проверка:

```bash
dig +short krimvk.ru A
dig +short krimvk.ru CNAME    # пусто
dig +short www.krimvk.ru CNAME  # пусто
```

## POST

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "https://krimvk.ru/api/emergency" \
  -H "Content-Type: application/json" -d '{}'
```

**400** — POST доходит до Next.js (не CDN).  
**405** — запрос всё ещё попадает на CDN → проверьте DNS (часто `www` на CNAME).

## Опционально: статика с CDN

Не влияет на POST: в `.env` только `NEXT_PUBLIC_ASSET_PREFIX=https://cdn.krimvk.ru` и отдельный CNAME `cdn`.  
Подробно: [YANDEX_STATIC_CDN.md](./YANDEX_STATIC_CDN.md).

## В консоли Yandex CDN

Ресурс с `www.krimvk.ru` / `krimvk.ru` для пользователей **не используйте** (не привязывайте DNS).  
Можно оставить выключенным или завести отдельный ресурс только для `cdn.krimvk.ru`.
