# Production Runbook (nic.ru VPS)

## 1. Базовые команды

```bash
cd /var/www/krimvk
pm2 status
pm2 logs krimvk --lines 200
curl -fsS http://127.0.0.1:3000/api/health
sudo nginx -t && sudo systemctl reload nginx
```

## 2. Стандартный релиз

Следовать [SAFE_RELEASE.md](./SAFE_RELEASE.md) и [DEV_RELEASE_GATE.md](./DEV_RELEASE_GATE.md).
Push/merge больше не переключает сайт автоматически. Workflow только готовит
отдельный релиз. Перед переключением нужны проверенная резервная копия,
совместимые миграции и проверки кандидата на отдельном loopback-порту.

## 3. Ручной rollback

При ошибке нового релиза вернуть сохранённую конфигурацию upstream Nginx,
проверить `nginx -t` и выполнить graceful reload. Старый процесс и его сборку
сохранять работающими до подтверждения нового релиза. Не удалять `.next`,
не перезаписывать активную сборку и не восстанавливать базу поверх новых
показаний/сообщений. Актуальные процесс, порт и файл отката сверять по журналу
конкретной выкладки, а не по устаревшим примерам ниже.

## 4. Мониторинг (Grafana / Prometheus)

Стек в `monitoring/`, установка: [MONITORING_AND_SECURITY.md](./MONITORING_AND_SECURITY.md).

```bash
cd /var/www/krimvk/monitoring && docker compose --profile core ps
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3030/login
```

Доступ к дашбордам с локальной машины: `ssh -L 3030:127.0.0.1:3030 krimvk@VPS_IP` → http://localhost:3030

## 5. Перезагрузка VPS (reboot)

После `sudo reboot` или обновления ядра — **ничего вручную в коде не нужно**, если раньше настроили автозапуск.

**Порядок (с Mac, через 1–2 мин после reboot):**

```bash
ssh -i ~/.ssh/krimvk_deploy krimvk@89.111.165.160

# на VPS
sudo systemctl status nginx --no-pager
pm2 status                    # krimvk должен быть online
curl -fsS http://127.0.0.1:3000/api/health
curl -fsSI https://krimvk.ru/api/health | head -5   # с VPS — через Cloudflare

# если krimvk не поднялся:
cd /var/www/krimvk
pm2 resurrect || pm2 start ecosystem.config.js --only krimvk
pm2 save
```

**Один раз после первого reboot** (если ещё не делали):

```bash
sudo -u krimvk pm2 startup systemd -u krimvk --hp /home/krimvk
# выполнить команду, которую выведет pm2, затем:
pm2 save
```

Мониторинг/docker (если есть): `cd /var/www/krimvk/monitoring && docker compose --profile core up -d`

---

## 6. Резервные копии

См. **[BACKUPS.md](./BACKUPS.md)** — `./scripts/setup-backup-cron.sh` (БД + опционально S3 off-site).

## 7. Инциденты

1. Зафиксировать время начала, симптом и затронутые функции.
2. Проверить `pm2 logs`, `nginx error.log`, `/api/health`.
3. При недоступности после релиза — rollback.
4. После восстановления:
   - краткий постмортем;
   - список корректирующих действий;
   - обновление чеклистов/мониторинга.

## 8. Комплаенс РФ (операционно)

Перед каждым крупным релизом проверять:
- доступны `/legal/privacy`, `/legal/terms`, `/legal/cookies`;
- cookie-consent баннер показывается новым пользователям;
- секреты отсутствуют в git и CI logs;
- доступ к production и БД ограничен по принципу least privilege;
- есть свежие проверенные бэкапы БД и файлов.

## 8. Ссылки на регламенты

- Мониторинг и безопасность: `docs/MONITORING_AND_SECURITY.md`
- Hardening: `docs/SERVER_HARDENING.md`
- Go-live: `docs/GO_LIVE_CHECKLIST.md`
- GitHub secrets: `docs/GITHUB_SECRETS.md`
