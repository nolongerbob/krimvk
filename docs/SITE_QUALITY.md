# Качество сайта (develop / staging)

Прод (`main` на VPS) обновляется отдельно после проверки на **develop** (порт 3001, `krimvk-dev`).

## Цели

| Метрика | Цель |
|---------|------|
| TTFB главной (ISR 120s) | &lt; 500 ms с origin при тёплом кэше |
| Dashboard overview | 1 запрос вместо 5+ водопадов |
| Регрессия после релиза | smoke + ручной чеклист ниже |

## ISR

- `/`, `/news` — `revalidate = 120`
- После публикации новости — `revalidatePath('/')`, `revalidatePath('/news')`

## Регрессия перед merge develop → main

```bash
npm test
npm run build
./scripts/smoke-local.sh          # BASE_URL по умолчанию :3001
npm run test:e2e                  # Playwright, нужен запущенный dev/staging
```

Ручной минимум:

- [ ] Вход в ЛК (NextAuth)
- [ ] Дашборд: счета, баланс, статистика
- [ ] Загрузка файла заявки / приватный файл в сессии
- [ ] Админ: список заявок, upload
- [ ] `npm run audit:s3-private` (если меняли S3)

## Next.js 15 (ветка develop)

- Версия: `next@15.5.x`
- Строгие типы `params`/`searchParams` как `Promise` — постепенная миграция страниц и route handlers
- `typescript.ignoreBuildErrors` временно `true` до завершения миграции

## Связанные документы

- [PRODUCTION_RUNBOOK.md](./PRODUCTION_RUNBOOK.md)
- [SECURITY_AUDIT_STATUS.md](./SECURITY_AUDIT_STATUS.md)
