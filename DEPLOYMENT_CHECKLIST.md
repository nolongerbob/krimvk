# Чеклист готовности к переносу на VPS

## ✅ Выполнено

- [x] Все файлы загрузки используют абстракцию `storage.ts`
- [x] Поддержка локального хранилища (`STORAGE_PROVIDER=local`)
- [x] Поддержка S3 хранилища (`STORAGE_PROVIDER=s3`)
- [x] Обратная совместимость с Vercel Blob (`STORAGE_PROVIDER=vercel`)
- [x] Создан `ecosystem.config.js` для PM2
- [x] Создан `nginx.conf.example` для Nginx
- [x] Создан скрипт `scripts/deploy-vps.sh`
- [x] Создана документация `docs/VPS_DEPLOYMENT.md`
- [x] Обновлен `README.md` с инструкциями по деплою
- [x] Добавлен скрипт `build:vps` в `package.json`

## 📋 Перед переносом на VPS

### 1. Подготовка VPS
- [ ] Установить Node.js 20.x
- [ ] Установить PostgreSQL
- [ ] Установить Nginx
- [ ] Установить PM2
- [ ] Создать пользователя для приложения
- [ ] Настроить firewall (открыть порты 80, 443, 22)

### 2. База данных
- [ ] Создать базу данных PostgreSQL
- [ ] Создать пользователя БД
- [ ] Настроить права доступа
- [ ] Сделать бэкап текущей БД (если есть)

### 3. Код
- [ ] Клонировать репозиторий на VPS
- [ ] Установить зависимости (`npm install`)
- [ ] Создать `.env` файл с правильными настройками
- [ ] Установить `STORAGE_PROVIDER=local`
- [ ] Установить `STORAGE_PATH=/var/www/krimvk/uploads`
- [ ] Создать директорию для файлов

### 4. Миграции
- [ ] Выполнить `npx prisma generate`
- [ ] Выполнить `npx prisma migrate deploy` или `npx prisma db push`
- [ ] Проверить, что все таблицы созданы

### 5. Сборка
- [ ] Выполнить `npm run build:vps`
- [ ] Проверить, что сборка прошла успешно

### 6. Запуск
- [ ] Настроить PM2 (`pm2 start ecosystem.config.js`)
- [ ] Настроить автозапуск (`pm2 startup`)
- [ ] Проверить, что приложение запущено

### 7. Nginx
- [ ] Скопировать `nginx.conf.example` в `/etc/nginx/sites-available/krimvk`
- [ ] Обновить `server_name` на ваш домен
- [ ] Проверить конфигурацию (`nginx -t`)
- [ ] Перезагрузить Nginx

### 8. Домен и SSL
- [ ] Настроить DNS (A-запись на IP VPS)
- [ ] Установить SSL сертификат (Let's Encrypt)
- [ ] Обновить `NEXTAUTH_URL` в `.env`

### 9. Тестирование
- [ ] Проверить доступность сайта
- [ ] Проверить загрузку файлов
- [ ] Проверить авторизацию
- [ ] Проверить работу API
- [ ] Проверить работу админ-панели

### 10. Бэкапы
- [ ] Настроить автоматические бэкапы БД
- [ ] Настроить бэкапы файлов
- [ ] Протестировать восстановление из бэкапа

## 🔄 После переноса

- [ ] Обновить документацию с актуальными URL
- [ ] Настроить мониторинг (логи, метрики)
- [ ] Настроить автоматические обновления
- [ ] Документировать процесс обновления

## 📝 Переменные окружения для VPS

### Если домен еще не привязан:

```env
# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/krimvk"

# NextAuth - используйте IP адрес VPS
NEXTAUTH_URL="http://YOUR_VPS_IP:3000"
NEXTAUTH_SECRET="your-secret-key"

# Хранилище
STORAGE_PROVIDER="local"
STORAGE_PATH="/var/www/krimvk/uploads"
STORAGE_BASE_URL=""  # Оставьте пустым для относительных URL

# Остальные переменные
NODE_ENV="production"
PORT=3000
```

### После привязки домена:

```env
# Обновите NEXTAUTH_URL на домен
NEXTAUTH_URL="https://yourdomain.com"
# Остальное без изменений
```

**Как узнать IP VPS:**
```bash
curl ifconfig.me
```

## 📝 Vercel: переменные окружения

Для работы подтверждения email и восстановления пароля в настройках проекта Vercel нужно задать:

- `RESEND_API_KEY` — API‑ключ из [Resend](https://resend.com)
- `NEXTAUTH_URL` — продакшен‑URL, напр. `https://krimvk.ru`
- `NEXTAUTH_SECRET` — секрет NextAuth
- `DATABASE_URL` — строка подключения к БД (Neon и др.)

Без `RESEND_API_KEY` при регистрации и при повторной отправке письма будет ошибка «Сервис отправки почты не настроен».

## 🔄 Обновление базы данных Neon

Если нужно обновить базу данных Neon (применить миграции):

```bash
# Локально (убедитесь, что DATABASE_URL указывает на Neon)
npm run db:update:neon

# Или синхронизировать схему (создаст недостающие таблицы)
npm run db:sync:neon

# Или применить все миграции
npm run db:deploy:neon
```

**На Vercel** миграции применяются автоматически при деплое через скрипт `vercel-build`:
- `prisma db push` — синхронизирует схему с БД
- `apply-password-reset-token-migration.js` — создаёт таблицу `password_reset_tokens` если её нет

