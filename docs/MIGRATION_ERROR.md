# Исправление ошибки "relation does not exist" при миграциях

## Проблема

При выполнении `npx prisma migrate deploy` возникает ошибка:
```
Error: relation "applications" does not exist
```

## Причина

База данных пустая, но миграции предполагают, что базовые таблицы уже существуют. Миграции в проекте создают только дополнительные таблицы (например, `application_files`), но не создают основные таблицы (`users`, `applications` и т.д.).

## Решение

### Для новой пустой базы данных:

Используйте `prisma db push` вместо `migrate deploy`:

```bash
npx prisma generate
npx prisma db push
```

Это создаст всю схему базы данных сразу из `schema.prisma`.

### Если нужно использовать миграции:

1. Сначала создайте начальную миграцию со всеми таблицами:

```bash
npx prisma migrate dev --name init
```

2. Затем примените миграции:

```bash
npx prisma migrate deploy
```

### Альтернатива: Сброс и создание заново

Если база пустая и можно потерять данные:

```bash
# Удалить все таблицы (ОСТОРОЖНО!)
npx prisma migrate reset

# Или вручную через psql:
sudo -u postgres psql -d krimvk
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO krimvk_user;
\q

# Затем создать схему заново:
npx prisma db push
```

## Рекомендация для VPS

Для новой установки на VPS используйте:

```bash
npx prisma generate
npx prisma db push
```

Это проще и создаст всю схему сразу.

