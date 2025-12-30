#!/bin/bash

# Скрипт для извлечения структуры базы данных из MDF файла
# Требует Docker и SQL Server

echo "🔍 Извлечение структуры базы данных из ab_ruch.mdf"
echo ""

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker Desktop для macOS"
    exit 1
fi

# Проверяем наличие файла
if [ ! -f "ab_ruch.mdf" ]; then
    echo "❌ Файл ab_ruch.mdf не найден в текущей директории"
    exit 1
fi

echo "📋 Инструкция по подключению к SQL Server:"
echo ""
echo "1. Запустите SQL Server в Docker:"
echo "   docker run -e 'ACCEPT_EULA=Y' -e 'SA_PASSWORD=YourStrong@Passw0rd' \\"
echo "     -p 1433:1433 --name sqlserver \\"
echo "     -v \$(pwd):/data \\"
echo "     -d mcr.microsoft.com/mssql/server:2022-latest"
echo ""
echo "2. Присоедините базу данных (выполните в SQL Server Management Studio или через sqlcmd):"
echo ""
echo "   CREATE DATABASE ab_ruch ON (FILENAME = '/data/ab_ruch.mdf') FOR ATTACH;"
echo ""
echo "3. Извлеките структуру таблиц:"
echo ""
echo "   SELECT TABLE_NAME, TABLE_TYPE"
echo "   FROM INFORMATION_SCHEMA.TABLES"
echo "   WHERE TABLE_TYPE = 'BASE TABLE'"
echo "   ORDER BY TABLE_NAME;"
echo ""
echo "4. Для каждой таблицы получите структуру:"
echo ""
echo "   SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT"
echo "   FROM INFORMATION_SCHEMA.COLUMNS"
echo "   WHERE TABLE_NAME = 'TableName'"
echo "   ORDER BY ORDINAL_POSITION;"
echo ""
echo "5. Экспортируйте результаты в CSV или SQL скрипт"
echo ""
echo "💡 Альтернатива: Попросите администратора экспортировать структуру в SQL скрипт"




