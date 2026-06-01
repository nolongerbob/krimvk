# Режим обслуживания

Пока идёт деплой или сайт временно недоступен, посетители видят страницу **«Делаем сервис лучше для вас»** вместо ошибки nginx или пустого экрана.

## Два уровня

| Способ | Когда срабатывает |
|--------|-------------------|
| **nginx** (`public/maintenance.html`, `error_page`, файл `.maintenance`) | PM2/Node не отвечает (502/504) или вы вручную включили флаг на сервере |
| **Next.js** (`MAINTENANCE_MODE=1` в `.env`) | Приложение работает, но весь трафик уходит на `/maintenance.html` |

Оба можно включить одной командой: `./scripts/maintenance-on.sh`.

## Быстро на VPS

```bash
cd /var/www/krimvk
git pull   # чтобы был public/maintenance.html
chmod +x scripts/maintenance-on.sh scripts/maintenance-off.sh
./scripts/maintenance-on.sh
# деплой, миграции, npm run build …
./scripts/maintenance-off.sh
```

## Nginx (один раз)

1. Скопируйте сниппет и подключите в `server` для prod:

```bash
sudo cp nginx/maintenance.conf.example /etc/nginx/snippets/krimvk-maintenance.conf
# в /etc/nginx/sites-available/krimvk внутри server { } для 443:
#   include snippets/krimvk-maintenance.conf;
```

2. В `location /` **перед** `proxy_pass` добавьте ручной режим:

```nginx
if (-f /var/www/krimvk/.maintenance) {
    rewrite ^ /maintenance.html break;
}
```

3. Проверка и reload: `sudo nginx -t && sudo systemctl reload nginx`

`/api/health` оставьте отдельным `location` без rewrite — мониторинг увидит, что приложение поднялось.

## Только через .env (без nginx-флага)

```bash
# в .env
MAINTENANCE_MODE=1
pm2 restart krimvk --update-env
```

Выключение: `MAINTENANCE_MODE=0` и снова `pm2 restart krimvk --update-env`.

## Текст страницы

Файл `public/maintenance.html` — автономный HTML (без Node). Меняйте заголовок и текст там; после деплоя достаточно `git pull` на сервере.
