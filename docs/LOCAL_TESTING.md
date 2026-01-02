# Тестирование локально перед переносом на VPS

## Проверка перед переносом

### 1. База данных

```bash
# Проверить, что схема синхронизирована
npx prisma db push

# Проверить, что Prisma Client сгенерирован
npx prisma generate
```

### 2. Запуск локального сервера

```bash
npm run dev
```

Откройте http://localhost:3000

### 3. Проверка функционала

#### Админ-панель
- [ ] Зайти в `/admin/disclosure`
- [ ] Добавить документ с названием и файлом
- [ ] Редактировать документ (название, порядок, активность)
- [ ] Поиск по документам
- [ ] Удаление документа

#### Публичная страница
- [ ] Открыть `/o-kompanii/raskrytie-informatsii`
- [ ] Проверить отображение документов
- [ ] Проверить поиск по документам
- [ ] Проверить скачивание файлов

#### Навигация
- [ ] Проверить ссылку в меню "О компании" → "Раскрытие информации"
- [ ] Проверить мобильное меню

### 4. Проверка хранилища файлов

Убедитесь, что в `.env` установлено:
```env
STORAGE_PROVIDER=local
STORAGE_PATH=./public/uploads
```

Проверьте, что файлы сохраняются в `public/uploads/disclosure/`

### 5. Проверка API

```bash
# Публичный API
curl http://localhost:3000/api/disclosure

# Админ API (нужна авторизация)
curl http://localhost:3000/api/admin/disclosure
```

## После успешного тестирования

1. Убедитесь, что все изменения закоммичены:
   ```bash
   git status
   git add -A
   git commit -m "Add disclosure information feature"
   git push
   ```

2. На VPS выполните:
   ```bash
   git pull
   npx prisma generate
   npx prisma db push
   npm run build
   pm2 restart krimvk
   ```

## Возможные проблемы

### Файлы не загружаются
- Проверьте права на директорию `public/uploads/disclosure/`
- Проверьте `STORAGE_PATH` в `.env`

### Ошибки базы данных
- Убедитесь, что PostgreSQL запущен
- Проверьте `DATABASE_URL` в `.env`
- Выполните `npx prisma db push`

### Ошибки TypeScript
- Выполните `npx prisma generate`
- Перезапустите dev сервер

