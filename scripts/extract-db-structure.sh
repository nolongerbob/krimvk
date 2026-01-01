#!/bin/bash

# Скрипт для извлечения полной структуры базы данных ab_ruch

echo "📊 Извлечение структуры базы данных ab_ruch..."
echo ""

# Список всех таблиц
echo "📋 Список таблиц:"
docker exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd" -C -d ab_ruch -Q "SELECT TABLE_SCHEMA + '.' + TABLE_NAME as TableName FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_SCHEMA, TABLE_NAME" -W -h -1 2>&1 | grep -v "^$" | head -50

echo ""
echo "📊 Детальная информация о таблицах:"
echo ""

# Получаем список таблиц и для каждой извлекаем структуру
TABLES=$(docker exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd" -C -d ab_ruch -Q "SELECT TABLE_SCHEMA + '.' + TABLE_NAME as TableName FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_SCHEMA, TABLE_NAME" -W -h -1 2>&1 | grep -v "^$" | grep -v "rows affected" | head -30)

for table in $TABLES; do
  if [[ $table == *.* ]]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Таблица: $table"
    echo ""
    
    # Структура колонок
    echo "Колонки:"
    docker exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd" -C -d ab_ruch -Q "SELECT COLUMN_NAME + ' (' + DATA_TYPE + CASE WHEN CHARACTER_MAXIMUM_LENGTH IS NOT NULL THEN '(' + CAST(CHARACTER_MAXIMUM_LENGTH AS VARCHAR) + ')' WHEN NUMERIC_PRECISION IS NOT NULL THEN '(' + CAST(NUMERIC_PRECISION AS VARCHAR) + CASE WHEN NUMERIC_SCALE > 0 THEN ',' + CAST(NUMERIC_SCALE AS VARCHAR) ELSE '' END + ')' ELSE '' END + ')' + CASE WHEN IS_NULLABLE = 'NO' THEN ' NOT NULL' ELSE '' END as ColumnInfo FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA + '.' + TABLE_NAME = '$table' ORDER BY ORDINAL_POSITION" -W -h -1 2>&1 | grep -v "^$" | grep -v "rows affected" | head -20
    
    # Количество записей
    echo ""
    echo "Количество записей:"
    docker exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd" -C -d ab_ruch -Q "SELECT COUNT(*) as cnt FROM [$table]" -W -h -1 2>&1 | grep -v "^$" | grep -v "rows affected" | head -1
    
    # Пример данных (первые 3 строки)
    echo ""
    echo "Пример данных (первые 3 строки):"
    docker exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd" -C -d ab_ruch -Q "SELECT TOP 3 * FROM [$table]" -W -h -1 2>&1 | head -10 | grep -v "^$" | grep -v "rows affected" | grep -v "^-"
    
    echo ""
    echo ""
  fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Извлечение завершено!"






