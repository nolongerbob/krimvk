# Решение проблем

## Ошибка: "The table `public.disclosure_documents` does not exist"

### Решение 1: Пересоздать Prisma Client

```bash
# Удалить старый клиент
rm -rf node_modules/.prisma

# Пересоздать
npx prisma generate

# Перезапустить dev сервер
# (остановите текущий и запустите заново)
npm run dev
```

### Решение 2: Применить изменения базы данных

```bash
npx prisma db push
```

### Решение 3: Если таблица не создается

Проверьте, что модель есть в `prisma/schema.prisma`:

```prisma
model DisclosureDocument {
  id          String   @id @default(cuid())
  title       String
  fileName    String
  fileUrl     String
  fileSize    Int
  mimeType    String
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("disclosure_documents")
}
```

Затем:

```bash
npx prisma db push --force-reset
# ВНИМАНИЕ: Это удалит все данные!
```

### Решение 4: Создать таблицу вручную

```sql
CREATE TABLE "disclosure_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disclosure_documents_pkey" PRIMARY KEY ("id")
);
```

## Ошибка: "Server has closed the connection"

Это означает, что соединение с базой данных разорвано. Решения:

1. Проверьте, что PostgreSQL запущен
2. Проверьте `DATABASE_URL` в `.env`
3. Перезапустите dev сервер

## После изменений в schema.prisma

Всегда выполняйте:

```bash
npx prisma generate
npx prisma db push
# Перезапустите dev сервер
```

