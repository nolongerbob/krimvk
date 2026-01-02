# Краткая инструкция по переносу на VPS

## Что было добавлено

### Новый функционал: Раскрытие информации

1. **Модель базы данных**: `DisclosureDocument`
2. **Админ-панель**: `/admin/disclosure`
3. **Публичная страница**: `/o-kompanii/raskrytie-informatsii`
4. **API endpoints**: 
   - `/api/disclosure` (публичный)
   - `/api/admin/disclosure` (админ)

## Шаги для переноса на VPS

### 1. На VPS выполните:

```bash
cd /var/www/krimvk
git pull origin main
npm install
```

### 2. Примените изменения базы данных:

```bash
npx prisma generate
npx prisma db push
```

Это создаст новую таблицу `disclosure_documents`.

### 3. Создайте директорию для файлов:

```bash
mkdir -p /var/www/krimvk/uploads/disclosure
chown -R krimvk:krimvk /var/www/krimvk/uploads
chmod -R 755 /var/www/krimvk/uploads
```

### 4. Пересоберите и перезапустите:

```bash
npm run build
pm2 restart krimvk
```

### 5. Проверьте:

- Админ-панель: `https://yourdomain.com/admin/disclosure`
- Публичная страница: `https://yourdomain.com/o-kompanii/raskrytie-informatsii`

## Переменные окружения

Убедитесь, что в `.env` на VPS установлено:

```env
STORAGE_PROVIDER=local
STORAGE_PATH=/var/www/krimvk/uploads
```

## Если что-то не работает

1. Проверьте логи: `pm2 logs krimvk`
2. Проверьте права на директорию uploads
3. Проверьте, что таблица создана: `sudo -u postgres psql -d krimvk -c "\dt disclosure_documents"`

