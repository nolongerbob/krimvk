# Исправление ошибки "permission denied for schema public"

## Проблема

При выполнении `npx prisma migrate deploy` возникает ошибка:
```
Error: ERROR: permission denied for schema public
```

## Решение

### Шаг 1: Подключитесь к PostgreSQL

```bash
sudo -u postgres psql
```

### Шаг 2: Выполните команды в правильном порядке

```sql
-- 1. Переключитесь на базу данных krimvk
\c krimvk

-- 2. Теперь дайте права на схему public
GRANT ALL ON SCHEMA public TO krimvk_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO krimvk_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO krimvk_user;

-- 3. Выход
\q
```

### Важно!

⚠️ **Команды `GRANT` нужно выполнять ПОСЛЕ `\c krimvk`**, иначе они выполняются в контексте базы `postgres`, а не `krimvk`.

## Альтернативный способ (одной командой)

```bash
sudo -u postgres psql -d krimvk -c "GRANT ALL ON SCHEMA public TO krimvk_user;"
sudo -u postgres psql -d krimvk -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO krimvk_user;"
sudo -u postgres psql -d krimvk -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO krimvk_user;"
```

## Использование скрипта

```bash
sudo ./scripts/fix-postgres-permissions.sh
```

## Проверка

После выполнения команд проверьте:

```bash
npx prisma migrate deploy
```

Должно работать без ошибок.

