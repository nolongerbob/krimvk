# Статус аудита безопасности

Обновляйте после крупных релизов.

**Ветка разработки:** `develop` (порт 3001 / `krimvk-dev`). Прод `main` на VPS не меняется до merge и smoke.

## Закрыто

| # | Тема | Коммит / где |
|---|------|----------------|
| 1 | Auto-login по `userId` | HMAC `loginToken`, `lib/post-verify-login-token.ts` |
| 2 | Публичные файлы заявок/чатов/счётчиков/договоров | `/api/files/private`, `docs/PRIVATE_FILES.md` |
| 3 | `password1c` plain в БД | AES-256-GCM, `docs/PASSWORD1C_ENCRYPTION.md` |
| 4 | CSP + заголовки | `lib/security/csp.js`, `next.config.js` |
| 5 | Админ только из БД | `requireAdmin()`, `app/admin/layout.tsx` |
| 6 | DaData без анонимного доступа | `/api/address/suggest` + сессия + rate limit |
| 7 | Rate limit приватных файлов | `http-guard.ts` → `/api/files/private` |
| 8 | IDOR: GET файлов заявки только для админа | `requireAdmin()` в `admin/applications/[id]/files` GET |
| 9 | IDOR: чужие фото в чате | `messages/{userId}/`, `lib/message-image-access.ts` |
| 10 | JWT `ADMIN` на приватных файлах | `canAccessPrivateS3Key` + `isAdminUser()` из БД |
| 11 | Пароли 1С в URL + `session` в direct-account | token-only API, POST connect |
| 12 | Allowlist `region` для 1С | `lib/1c-regions.ts` |
| 13 | Telegram debug/DELETE, скрейп без лимита | кэш 2 мин, rate limit |
| 14 | Спам формы аварии | `/api/emergency` лимит 5/15 мин |
| 15 | Email автора в публичных новостях | `lib/format-public-author.ts` |
| 16 | SVG / подделка MIME в загрузках | `validate-image-upload.ts` |
| 17 | Публичные админ-загрузки без allowlist | `validate-upload.ts` |
| 18 | Спам чата / поиск / OCR / PDF | `http-guard.ts` |
| 19 | Перебор email при регистрации | `auth/register` |
| 20 | Счётчики: фото + analyze-image | `validate-image-upload` |
| 21 | Публичные файлы: inline HTML/SVG | `lib/content-disposition.ts` |
| 22 | Water-quality upload | `validate-water-quality`, max 200MB |
| 23 | DOMPurify в dependencies | `package.json` |
| 24 | Единый mobile auth | `POST /api/auth/mobile-login`, `getAppSession` + Bearer |
| 27 | Email в API страниц | `app/api/pages/[slug]` без email в author |
| 28 | PII в логах accounts | убраны `console.log` с userId |
| 25 | S3 `uploads/` частично | legacy private under `uploads/applications/` blocked in `isAllowedPublicS3Key` |
| 29 | ЛК: один overview вместо водопада | `GET /api/dashboard/overview`, `hooks/use-dashboard-overview.ts` |
| 30 | Mobile auth | `POST /api/auth/mobile-login`, Bearer в `getAppSession` |
| 31 | ISR главная/новости | `revalidate = 120` на `/`, `/news` |
| 32 | Ошибки UI | `app/error.tsx`, `app/global-error.tsx` |

## Открыто

| # | Серьёзность | Тема |
|---|-------------|------|
| 26 | Средняя | `npm audit` — периодически на `develop`; критичные — по мере выхода патчей |
| — | Низкая | Полное удаление `uploads/` из PUBLIC после миграции URL в БД |
| — | Низкая | `typescript.ignoreBuildErrors: false` после миграции async `params` |

## Операционно (develop / после merge в main)

- [ ] Smoke: `./scripts/smoke-local.sh` (по умолчанию `http://127.0.0.1:3001`)
- [ ] `npm run audit:s3-private` при изменении S3
- [ ] `npm run audit:public-urls`
- [ ] Деплой **только** после merge develop → main (прод не трогать до этого)

## Проверка после деплоя на staging/prod

```bash
curl -sI https://krimvk.ru/api/address/suggest -X POST -H 'Content-Type: application/json' -d '{"query":"симф"}' | head -1
curl -sI "https://krimvk.ru/files/applications/test" | head -1
```
