# Как создать .env файл

## Способ 1: Копирование примера (рекомендуется)

### На локальной машине (для разработки):

```bash
# В корне проекта
cp .env.example.vps .env
```

Затем откройте `.env` в редакторе и заполните значениями для локальной разработки:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/krimvk"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="локальный-секрет-ключ"
STORAGE_PROVIDER="local"
STORAGE_PATH="./public/uploads"
```

### На VPS сервере:

```bash
# В директории проекта /var/www/krimvk
cp .env.example.vps .env
nano .env  # или vim .env
```

Заполните реальными значениями для продакшена.

## Способ 2: Создание вручную

### Через терминал:

```bash
# Создать пустой файл
touch .env

# Открыть в редакторе
nano .env
# или
vim .env
# или в VS Code
code .env
```

### Через VS Code / редактор:

1. Создайте новый файл `.env` в корне проекта
2. Скопируйте содержимое из `.env.example.vps`
3. Заполните реальными значениями

## Обязательные переменные

Минимальный набор для работы:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/krimvk"
NEXTAUTH_URL="https://yourdomain.com"  # или http://IP:3000 если домен не привязан
NEXTAUTH_SECRET="ваш-секретный-ключ"
STORAGE_PROVIDER="local"
STORAGE_PATH="/var/www/krimvk/uploads"
NODE_ENV="production"
```

### ⚠️ Что указать в NEXTAUTH_URL, если домен еще не привязан?

**Вариант 1: IP адрес VPS (для начала)**
```env
NEXTAUTH_URL="http://123.45.67.89:3000"
```
Где `123.45.67.89` - IP адрес вашего VPS сервера.

**Вариант 2: После привязки домена**
```env
NEXTAUTH_URL="https://yourdomain.com"
```

**Как узнать IP адрес VPS:**
```bash
# На VPS выполните:
curl ifconfig.me
# или
hostname -I
```

**Важно:** После привязки домена обязательно обновите `NEXTAUTH_URL` в `.env` и перезапустите приложение:
```bash
pm2 restart krimvk
```

## Генерация NEXTAUTH_SECRET

### В Linux/Mac:

```bash
openssl rand -base64 32
```

### В Windows (PowerShell):

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Онлайн генератор:

Используйте любой генератор случайных строк (32+ символов)

## Проверка .env файла

После создания проверьте:

```bash
# Проверить, что файл существует
ls -la .env

# Проверить содержимое (без показа значений)
cat .env | grep -v "=" | wc -l  # должно быть 0 (все строки с =)
```

## Важно!

- ✅ `.env` файл уже в `.gitignore` - он не попадет в Git
- ✅ НЕ коммитьте `.env` в репозиторий
- ✅ Используйте разные `.env` для разработки и продакшена
- ✅ Храните секреты в безопасности

## Примеры для разных окружений

### Локальная разработка:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/krimvk_dev"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-12345"
STORAGE_PROVIDER="local"
STORAGE_PATH="./public/uploads"
NODE_ENV="development"
```

### VPS продакшен:

```env
DATABASE_URL="postgresql://krimvk_user:strong_password@localhost:5432/krimvk"
NEXTAUTH_URL="https://krimvk.ru"
NEXTAUTH_SECRET="сгенерированный-32-символьный-ключ"
STORAGE_PROVIDER="local"
STORAGE_PATH="/var/www/krimvk/uploads"
NODE_ENV="production"
PORT=3000
```

