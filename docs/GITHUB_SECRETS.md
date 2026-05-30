# GitHub Secrets для автодеплоя (dev + prod)

Добавьте в **Settings → Secrets and variables → Actions** (repository secrets).

## Общие (один VPS)

| Secret | Пример | Описание |
|--------|--------|----------|
| `VPS_HOST` | `203.0.113.10` | IP или hostname сервера |
| `VPS_PORT` | `22` | SSH-порт (если не задан — укажите `22` явно) |
| `VPS_USER` | `krimvk` | SSH-пользователь для деплоя |
| `VPS_SSH_KEY` | `-----BEGIN OPENSSH...` | Приватный ключ (полностью, с переносами строк) |

## Production (`main` → `/var/www/krimvk`)

| Secret | Пример |
|--------|--------|
| `VPS_APP_DIR` | `/var/www/krimvk` |
| `HEALTHCHECK_URL` | `http://127.0.0.1:3000/api/health` |

## Development (`develop` → `/var/www/krimvk-dev`)

| Secret | Пример |
|--------|--------|
| `VPS_APP_DIR_DEV` | `/var/www/krimvk-dev` |
| `HEALTHCHECK_URL_DEV` | `http://127.0.0.1:3001/api/health` |

## GitHub Environments (рекомендуется)

Создайте environments **production** и **development**:

- **production** — optional: required reviewers перед деплоем на prod
- **development** — без ограничений или с отдельными правилами

Workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) привязан к этим environments.

## Безопасность

1. Отдельный deploy-пользователь, без root.
2. SSH только по ключу.
3. Не коммитьте `.env` / `.env.dev` на сервере в git.
4. Ротация ключей при утечке.
