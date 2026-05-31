# Yandex Object Storage для krimvk

Настройка **без KMS** одной командой через [Yandex Cloud CLI](https://yandex.cloud/en/docs/cli/quickstart).

## Быстрый старт

### 1. Установить и войти в yc (один раз, на Mac или VPS)

```bash
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
exec -l $SHELL
yc init
```

Нужны права на каталог: **`iam.serviceAccounts.admin`**, **`storage.admin`** (или роль **`admin`** на каталог).

### 2. Автонастройка

**На Mac** (создаёт SA, бакет, ключ; ключи в `.env.s3.generated`):

```bash
cd /path/to/krimvk
git pull
chmod +x scripts/setup-yandex-s3.sh
./scripts/setup-yandex-s3.sh
```

**На VPS** (то же + сразу `.env` и тест):

```bash
cd /var/www/krimvk
git pull
./scripts/setup-yandex-s3.sh --apply-env
pm2 restart krimvk --update-env
```

Скрипт делает:

1. `storage.editor` вашему пользователю (консоль)
2. SA **`krimvk-s3`** + `storage.editor` на каталог
3. **Новый** статический ключ
4. Бакет **`krimvk`**, без KMS, `disable-statickey-auth=false`
5. `storage.editor` SA на бакете (API)
6. Ключи в `.env.s3.generated` (не в git)

### 3. Открытие файлов в браузере (без политики на бакете)

**Не добавляйте** политику `GetObject` на бакет — на Yandex из‑за неё часто пропадает и **загрузка**, и **чтение** (`AccessDenied`).

Сайт отдаёт файлы с **вашего домена** (в адресной строке не Yandex):

`https://ваш-домен.ru/files/disclosure/имя.pdf`

В `.env` обязательно:

```env
NEXTAUTH_URL=https://ваш-домен.ru
```

В `.env` (уже в `apply-s3-env.sh`):

```env
S3_PUBLIC_VIA_PROXY=1
```

После деплоя:

```bash
npm run build
pm2 restart krimvk --update-env
```

Проверка (подставьте ключ файла):

```bash
curl -sI "https://ВАШ_ДОМЕН/files/disclosure/1780216326147_bill_113613011.pdf" | head -1
# HTTP/1.1 200 OK
```

Старые ссылки в БД (Yandex) — кнопки на сайте ведут на `/files/...`. Чтобы в БД тоже был ваш домен:

```bash
# NEXTAUTH_URL=https://ваш-домен.ru в .env
node scripts/rewrite-s3-file-urls.js
```

---

## Ручная прописка ключей на VPS

Если скрипт запускали на Mac:

```bash
cd /var/www/krimvk
./scripts/apply-s3-env.sh 'YCAJ...' 'secret...'
./scripts/test-s3-upload.sh
pm2 restart krimvk --update-env
```

---

## Переменные

| Переменная | По умолчанию |
|------------|--------------|
| `S3_BUCKET_NAME` | `krimvk` |
| `YC_SA_NAME` | `krimvk-s3` |
| `YC_FOLDER_ID` | из `yc config get folder-id` |

---

## Ошибки

| Симптом | Решение |
|---------|---------|
| `yc: command not found` | установить yc, `yc init` |
| `AccessDenied` в test | уберите **политику бакета**; `./scripts/setup-yandex-s3.sh --apply-env` |
| PDF не открывается | политика не нужна — `git pull`, `npm run build`, ссылки через `/api/public-file` |
| «Нет доступа» в консоли | скрипт выдаёт `storage.editor` вашему user; нужен `yc init` под владельцем |
| `SignatureDoesNotMatch` | secret с пробелом/кавычками — `./scripts/apply-s3-env.sh` |

Диагностика: `./scripts/test-s3-upload.sh`

---

## Консоль (альтернатива CLI)

См. прежние шаги в истории или `apply-s3-env.sh` + `test-s3-upload.sh`.

Блок `.env`:

```env
STORAGE_PROVIDER=s3
S3_BUCKET_NAME=krimvk
S3_REGION=ru-central1
S3_ENDPOINT=https://storage.yandexcloud.net
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_URL_BASE=https://storage.yandexcloud.net/krimvk
S3_USE_ACL=0
S3_PUBLIC_VIA_PROXY=1
AWS_ACCESS_KEY_ID=YCAJ...
AWS_SECRET_ACCESS_KEY=...
```
