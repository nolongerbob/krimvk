# Настройка на Timeweb (Бюджетный вариант)

## 💰 Стоимость: ~1000₽/месяц

Вместо 4000₽ на Yandex Cloud!

## 📋 Пошаговая инструкция

### 1. Регистрация и создание VPS

1. Зайдите на https://timeweb.com
2. Зарегистрируйтесь
3. Создайте VPS:
   - **ОС:** Ubuntu 22.04
   - **CPU:** 2 ядра
   - **RAM:** 4GB
   - **Диск:** 40GB SSD
   - **Стоимость:** ~800₽/месяц

### 2. Подключение к серверу

```bash
ssh root@ваш-ip-адрес
```

### 3. Установка Docker и Docker Compose

```bash
# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Устанавливаем Docker Compose
apt install docker-compose -y

# Проверяем установку
docker --version
docker-compose --version
```

### 4. Клонирование проекта

```bash
# Устанавливаем Git
apt install git -y

# Клонируем проект
git clone https://github.com/ваш-репозиторий/krimvk.git
cd krimvk
```

### 5. Настройка переменных окружения

```bash
# Создаем .env файл
cat > .env <<EOF
# База данных (будет создана в Docker)
DB_USER=krimvk
DB_PASSWORD=ваш-надежный-пароль
DB_NAME=krimvk

# NextAuth
NEXTAUTH_SECRET=сгенерируйте-случайную-строку
NEXTAUTH_URL=https://yourdomain.ru

# Хранилище (локальное на сервере)
STORAGE_TYPE=local
STORAGE_PATH=/app/uploads
EOF

# Генерируем NEXTAUTH_SECRET
openssl rand -base64 32
```

### 6. Настройка PostgreSQL в Docker

PostgreSQL будет запущен в Docker контейнере на том же сервере.

### 7. Деплой приложения

```bash
# Запускаем через Docker Compose
docker-compose -f docker/docker-compose-vps.yml up -d

# Проверяем логи
docker-compose -f docker/docker-compose-vps.yml logs -f
```

### 8. Настройка Nginx и SSL

```bash
# Устанавливаем Certbot
apt install certbot python3-certbot-nginx -y

# Получаем SSL сертификат
certbot certonly --standalone -d yourdomain.ru -d www.yourdomain.ru

# Копируем сертификаты в Docker volume
mkdir -p docker/ssl
cp /etc/letsencrypt/live/yourdomain.ru/fullchain.pem docker/ssl/
cp /etc/letsencrypt/live/yourdomain.ru/privkey.pem docker/ssl/

# Перезапускаем Nginx
docker-compose -f docker/docker-compose-vps.yml restart nginx
```

### 9. Настройка автообновления SSL

```bash
# Добавляем в crontab
crontab -e

# Добавляем строку (обновление каждые 2 месяца)
0 0 1 */2 * certbot renew && cp /etc/letsencrypt/live/yourdomain.ru/*.pem docker/ssl/ && docker-compose -f docker/docker-compose-vps.yml restart nginx
```

### 10. Настройка DNS в nic.ru

1. В nic.ru → DNS-записи
2. Добавьте A запись:
   ```
   Имя: @
   Тип: A
   Значение: [IP вашего VPS]
   TTL: 3600
   ```
3. Добавьте CNAME:
   ```
   Имя: www
   Тип: CNAME
   Значение: yourdomain.ru
   ```

### 11. Настройка бэкапов

```bash
# Создаем скрипт бэкапа
cat > /root/backup.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Бэкап базы данных
docker exec krimvk-postgres pg_dump -U krimvk krimvk > $BACKUP_DIR/db_$DATE.sql

# Бэкап файлов
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/lib/docker/volumes/krimvk_uploads_data

# Удаляем старые бэкапы (старше 7 дней)
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /root/backup.sh

# Добавляем в crontab (каждый день в 3:00)
crontab -e
# Добавляем: 0 3 * * * /root/backup.sh
```

## 🔧 Полезные команды

```bash
# Просмотр логов
docker-compose -f docker/docker-compose-vps.yml logs -f app

# Перезапуск приложения
docker-compose -f docker/docker-compose-vps.yml restart app

# Обновление приложения
git pull
docker-compose -f docker/docker-compose-vps.yml build app
docker-compose -f docker/docker-compose-vps.yml up -d app

# Проверка статуса
docker-compose -f docker/docker-compose-vps.yml ps
```

## 💰 Итоговая стоимость

- VPS Timeweb: ~800₽/месяц
- Домен (если покупать): ~200₽/год
- **Итого: ~800₽/месяц** ✅

Вместо 4000₽ на Yandex Cloud!

## ⚠️ Важно

1. **Бэкапы:** Настройте автоматические бэкапы
2. **Мониторинг:** Настройте мониторинг (можно через UptimeRobot бесплатно)
3. **Обновления:** Регулярно обновляйте систему и приложение
4. **Безопасность:** Настройте firewall (ufw)

## 🆘 Проблемы и решения

### Приложение не запускается:
```bash
# Проверьте логи
docker-compose -f docker/docker-compose-vps.yml logs app

# Проверьте базу данных
docker exec -it krimvk-postgres psql -U krimvk -d krimvk
```

### SSL не работает:
```bash
# Проверьте сертификаты
ls -la docker/ssl/

# Проверьте Nginx
docker-compose -f docker/docker-compose-vps.yml logs nginx
```

### Не хватает места:
```bash
# Очистите старые Docker образы
docker system prune -a

# Очистите старые бэкапы
find /root/backups -type f -mtime +7 -delete
```

