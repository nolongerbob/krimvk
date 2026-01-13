# Исправление проблем с подключением к PostgreSQL

## Проблема
PostgreSQL постоянно закрывает соединения, что приводит к ошибкам `P1017: Server has closed the connection`.

## Решение

### 1. Настройки Prisma Client

В `lib/prisma.ts` применены следующие настройки:

- `connection_limit=3` - уменьшено количество соединений в пуле
- `pool_timeout=30` - увеличен таймаут получения соединения
- `keepalive_idle=30` - отправлять keepalive каждые 30 секунд
- `keepalive_interval=10` - интервал между keepalive пакетами
- `keepalive_count=3` - количество попыток перед закрытием

### 2. Улучшенная функция withRetry

- Увеличено количество попыток до 5
- Добавлена проверка подключения перед каждым запросом
- Экспоненциальная задержка между попытками
- Автоматическое переподключение при ошибках

### 3. Настройки PostgreSQL (опционально)

Если проблемы продолжаются, можно настроить PostgreSQL:

```sql
-- Увеличить idle timeout (в секундах)
ALTER SYSTEM SET idle_in_transaction_session_timeout = 60000; -- 60 секунд

-- Настроить TCP keepalive
ALTER SYSTEM SET tcp_keepalives_idle = 30;
ALTER SYSTEM SET tcp_keepalives_interval = 10;
ALTER SYSTEM SET tcp_keepalives_count = 3;

-- Перезагрузить конфигурацию
SELECT pg_reload_conf();
```

### 4. Проверка соединений

Проверить активные соединения:
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'krimvk';
```

Проверить настройки:
```sql
SHOW idle_in_transaction_session_timeout;
SHOW tcp_keepalives_idle;
SHOW tcp_keepalives_interval;
SHOW tcp_keepalives_count;
```

## Мониторинг

Для отслеживания проблем:
```bash
tail -f /tmp/nextjs-pg-fixed.log | grep -E "(Error|withRetry|connection)"
```


