# Настройка Yandex Cloud для KrimVK

## 1. Создание инфраструктуры

### Managed PostgreSQL (или другой провайдер)

**Варианты:**
- Yandex Cloud Managed PostgreSQL (рекомендуется)
- Selectel Managed PostgreSQL (дешевле)
- Timeweb Managed PostgreSQL (проще)
- VPS с PostgreSQL (бюджетный вариант)

**Подробное сравнение:** см. `docs/DATABASE_HOSTING_OPTIONS.md`

#### Yandex Cloud Managed PostgreSQL:

1. Зайдите в Yandex Cloud Console
2. Создайте Managed PostgreSQL кластер:
   - Версия: PostgreSQL 15
   - Класс хоста: s2.micro (для начала)
   - Диск: SSD, 20GB
   - Сеть: выберите или создайте сеть
   - Пароль: сгенерируйте надежный

3. Получите connection string:
   ```
   postgresql://user:password@c-xxx.rw.mdb.yandexcloud.net:6432/dbname?sslmode=require
   ```

### Object Storage

1. Создайте bucket:
   - Имя: `krimvk-files`
   - Тип: Standard
   - Регион: ru-central1

2. Создайте сервисный аккаунт:
   - Роль: `storage.editor`

3. Создайте статический ключ доступа:
   - Access Key ID
   - Secret Access Key

4. Настройте CORS для bucket:
   ```json
   [
     {
       "AllowedOrigins": ["https://yourdomain.ru"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

### Container Registry

1. Создайте registry:
   - Имя: `krimvk-registry`

2. Получите ID registry для CI/CD

### Cloud Run (или VPS)

**Вариант A: Cloud Run (Serverless)**
- Создайте сервис Cloud Run
- Укажите образ из Container Registry
- Настройте переменные окружения

**Вариант B: VPS (Compute Instance)**
- Создайте виртуальную машину:
  - Платформа: Intel Ice Lake
  - vCPU: 2
  - RAM: 4GB
  - Диск: 20GB SSD
  - ОС: Ubuntu 22.04

## 2. Переменные окружения

Создайте файл `.env.production`:

```env
# База данных
DATABASE_URL=postgresql://user:password@c-xxx.rw.mdb.yandexcloud.net:6432/dbname?sslmode=require

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://yourdomain.ru

# Yandex Object Storage
YANDEX_STORAGE_ACCESS_KEY=your-access-key
YANDEX_STORAGE_SECRET_KEY=your-secret-key
YANDEX_STORAGE_BUCKET=krimvk-files
YANDEX_STORAGE_ENDPOINT=https://storage.yandexcloud.net

# Другие переменные
NODE_ENV=production
```

## 3. Деплой

### Через Docker Compose (VPS):

```bash
# На сервере
git clone https://github.com/your-repo/krimvk.git
cd krimvk
cp .env.production .env
docker-compose -f docker/docker-compose.yml up -d
```

### Через Cloud Run:

```bash
# Соберите и загрузите образ
docker build -f docker/Dockerfile -t cr.yandex/your-registry-id/krimvk:latest .
docker push cr.yandex/your-registry-id/krimvk:latest

# Задеплойте через консоль или CLI
yc serverless container revision deploy \
  --container-name krimvk \
  --image cr.yandex/your-registry-id/krimvk:latest
```

## 4. Настройка домена

**✅ Домен с nic.ru можно использовать!**

Домен остается на nic.ru, а DNS-записи указывают на Yandex Cloud.

### Вариант 1: DNS-серверы Yandex Cloud (рекомендуется)

1. В Yandex Cloud создайте DNS-зону:
   - Cloud DNS → Создать зону
   - Имя: ваш домен (например, `krimvk.ru`)
   - Получите DNS-серверы (например: `ns1.yandexcloud.net`)

2. В nic.ru:
   - Управление доменом → DNS-серверы
   - Укажите DNS-серверы от Yandex Cloud

3. В Yandex Cloud DNS-зоне добавьте:
   - A запись: `@` → IP сервера/Cloud Run
   - CNAME: `www` → `@`

### Вариант 2: DNS-записи в nic.ru

1. В nic.ru → DNS-записи:
   - A запись: `@` → IP вашего сервера
   - CNAME: `www` → ваш домен

**Подробная инструкция:** см. `docs/DOMAIN_NIC_RU_SETUP.md`

## 5. SSL сертификат

Yandex Cloud автоматически предоставляет SSL через Load Balancer или Cloud Run.

Для VPS используйте Let's Encrypt:
```bash
sudo apt install certbot
sudo certbot --nginx -d yourdomain.ru -d www.yourdomain.ru
```

## 6. Мониторинг

Настройте мониторинг в Yandex Cloud:
- Cloud Monitoring для метрик
- Cloud Logging для логов
- Alerts для уведомлений

## Стоимость (примерно)

- Managed PostgreSQL: ~1500₽/месяц
- Object Storage: ~500₽/месяц (зависит от объема)
- Cloud Run/VPS: ~1000-2000₽/месяц
- CDN: ~500₽/месяц

**Итого: ~3500-4500₽/месяц**

