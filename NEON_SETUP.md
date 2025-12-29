# Настройка базы данных в Neon

## Шаг 1: Создание базы данных в Neon

1. **Зарегистрируйтесь/Войдите на Neon:**
   - Перейдите на https://neon.tech
   - Войдите через GitHub (рекомендуется) или создайте аккаунт

2. **Создайте новый проект:**
   - Нажмите "Create Project"
   - Выберите регион (рекомендуется ближайший к вашей аудитории)
   - Введите название проекта: `krimvk`
   - Выберите PostgreSQL версию (рекомендуется последняя)
   - Нажмите "Create Project"

3. **Получите Connection String:**
   - После создания проекта вы увидите Connection String
   - Формат: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`
   - **ВАЖНО:** Скопируйте этот URL полностью

4. **Сохраните DATABASE_URL:**
   - Скопируйте Connection String
   - Он будет использован в следующих шагах

## Шаг 2: Применение схемы базы данных

После получения DATABASE_URL выполните одну из команд:

### Вариант 1: Через скрипт (рекомендуется)
```bash
# Установите DATABASE_URL в переменную окружения
export DATABASE_URL="ваш-connection-string-из-neon"

# Запустите скрипт
npm run db:setup:neon
```

### Вариант 2: Вручную
```bash
# Установите DATABASE_URL
export DATABASE_URL="ваш-connection-string-из-neon"

# Примените схему
npx prisma db push

# Сгенерируйте Prisma Client
npx prisma generate
```

### Вариант 3: Через .env файл
```bash
# Добавьте в .env файл (или создайте .env.production)
DATABASE_URL="ваш-connection-string-из-neon"

# Примените схему
npx prisma db push
```

## Шаг 3: Создание первого администратора

После применения схемы создайте первого администратора:

```bash
# Если используете .env файл
npm run admin:create

# Или с явным указанием DATABASE_URL
DATABASE_URL="ваш-connection-string" npm run admin:create
```

## Шаг 4: Проверка подключения

Проверьте, что база данных работает:

```bash
# Откройте Prisma Studio
DATABASE_URL="ваш-connection-string" npx prisma studio
```

## Использование в Vercel

После настройки базы данных в Neon:

1. Скопируйте Connection String из Neon
2. В Vercel → Settings → Environment Variables добавьте:
   ```
   DATABASE_URL=ваш-connection-string-из-neon
   ```
3. Перезапустите деплой в Vercel

## Безопасность

⚠️ **ВАЖНО:**
- Никогда не коммитьте DATABASE_URL в git
- Используйте переменные окружения
- Connection String уже добавлен в .gitignore

## Troubleshooting

### Ошибка подключения
- Убедитесь, что Connection String скопирован полностью
- Проверьте, что в конце URL есть `?sslmode=require`
- Убедитесь, что база данных создана в Neon

### Ошибка SSL
- Neon требует SSL соединение
- Убедитесь, что в Connection String есть `?sslmode=require`

### Ошибка миграции
- Используйте `prisma db push` для быстрого применения схемы
- Для production лучше создать миграции через `prisma migrate dev`

