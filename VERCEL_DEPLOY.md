# Инструкция по деплою на Vercel

## Шаг 1: Подготовка базы данных

Перед деплоем нужно создать базу данных PostgreSQL. Рекомендуемые бесплатные варианты:

### Вариант 1: Supabase (рекомендуется)
1. Зарегистрируйтесь на https://supabase.com
2. Создайте новый проект
3. Перейдите в Settings → Database
4. Скопируйте Connection String (URI формат)
5. Формат: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### Вариант 2: Neon
1. Зарегистрируйтесь на https://neon.tech
2. Создайте новый проект
3. Скопируйте Connection String

### Вариант 3: Railway
1. Зарегистрируйтесь на https://railway.app
2. Создайте новый проект → Add PostgreSQL
3. Скопируйте DATABASE_URL из переменных окружения

## Шаг 2: Деплой на Vercel

### Через веб-интерфейс:

1. **Зарегистрируйтесь на Vercel:**
   - Перейдите на https://vercel.com
   - Войдите через GitHub аккаунт

2. **Импортируйте проект:**
   - Нажмите "Add New Project"
   - Выберите репозиторий `nolongerbob/krimvk`
   - Нажмите "Import"

3. **Настройте переменные окружения:**
   
   В разделе "Environment Variables" добавьте следующие переменные:

   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   NEXTAUTH_URL=https://your-project.vercel.app
   NEXTAUTH_SECRET=your-secret-key-here-min-32-chars
   NODE_ENV=production
   ```

   **Важно:**
   - `NEXTAUTH_SECRET` - сгенерируйте случайную строку минимум 32 символа
   - `NEXTAUTH_URL` - будет автоматически установлен после первого деплоя
   - `DATABASE_URL` - используйте строку подключения из шага 1

4. **Дополнительные переменные (если используются):**
   
   Если у вас есть интеграции с внешними сервисами, добавьте:
   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOSUSLUGI_CLIENT_ID=your-gosuslugi-client-id
   GOSUSLUGI_CLIENT_SECRET=your-gosuslugi-client-secret
   DADATA_API_KEY=your-dadata-api-key
   DADATA_SECRET_KEY=your-dadata-secret-key
   GOOGLE_VISION_API_KEY=your-vision-api-key
   ```

5. **Настройки сборки:**
   - Framework Preset: Next.js (определится автоматически)
   - Build Command: `prisma generate && next build` (уже настроено в vercel.json)
   - Output Directory: `.next` (по умолчанию)
   - Install Command: `npm install` (по умолчанию)

6. **Деплой:**
   - Нажмите "Deploy"
   - Дождитесь завершения сборки (обычно 2-5 минут)

## Шаг 3: Инициализация базы данных

После успешного деплоя нужно применить схему базы данных:

### Вариант 1: Через Vercel CLI (рекомендуется)

1. Установите Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Войдите в Vercel:
   ```bash
   vercel login
   ```

3. Подключите проект:
   ```bash
   vercel link
   ```

4. Примените миграции:
   ```bash
   vercel env pull .env.production
   npx prisma db push
   ```

### Вариант 2: Через локальную машину

1. Скопируйте DATABASE_URL из Vercel в локальный `.env`:
   ```bash
   DATABASE_URL=your-production-database-url
   ```

2. Примените схему:
   ```bash
   npx prisma db push
   ```

### Вариант 3: Через Prisma Studio (для начальной настройки)

1. Подключитесь к production базе локально:
   ```bash
   DATABASE_URL=your-production-database-url npx prisma studio
   ```

2. Создайте первого администратора через скрипт:
   ```bash
   DATABASE_URL=your-production-database-url npm run admin:create
   ```

## Шаг 4: Проверка деплоя

1. Откройте URL вашего проекта (будет показан после деплоя)
2. Проверьте работу основных страниц:
   - Главная страница
   - Регистрация/Вход
   - Личный кабинет (после входа)

## Шаг 5: Настройка домена (опционально)

1. В настройках проекта Vercel перейдите в "Domains"
2. Добавьте свой домен
3. Настройте DNS записи согласно инструкциям Vercel
4. Обновите `NEXTAUTH_URL` в переменных окружения

## Полезные команды

### Просмотр логов:
```bash
vercel logs
```

### Локальная проверка production сборки:
```bash
npm run build
npm start
```

### Обновление переменных окружения:
```bash
vercel env add DATABASE_URL
```

## Troubleshooting

### Ошибка "Prisma Client not generated"
- Убедитесь, что `postinstall` скрипт в package.json содержит `prisma generate`
- Проверьте, что `vercel.json` содержит правильный `buildCommand`

### Ошибка подключения к базе данных
- Проверьте правильность `DATABASE_URL`
- Убедитесь, что база данных доступна из интернета (не localhost)
- Проверьте firewall настройки базы данных

### Ошибка аутентификации
- Проверьте `NEXTAUTH_SECRET` (должен быть минимум 32 символа)
- Убедитесь, что `NEXTAUTH_URL` соответствует URL проекта

### Проблемы с миграциями
- Используйте `prisma db push` для быстрого применения схемы
- Для production лучше использовать `prisma migrate deploy` после создания миграций

## Автоматический деплой

После настройки, каждый push в ветку `main` будет автоматически деплоиться на Vercel.

Для отключения автоматического деплоя:
- Settings → Git → Deploy Hooks → отключите автоматический деплой

