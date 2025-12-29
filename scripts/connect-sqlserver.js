/**
 * Скрипт для подключения к SQL Server и извлечения структуры базы данных
 * Требует: npm install mssql
 */

const sql = require('mssql');

const config = {
  server: 'localhost',
  port: 1433,
  user: 'sa',
  password: 'YourStrong@Passw0rd',
  options: {
    encrypt: false, // для локального Docker
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function analyzeDatabase() {
  try {
    console.log('🔌 Подключение к SQL Server...');
    await sql.connect(config);
    console.log('✅ Подключено!\n');

    // Сначала попробуем присоединить базу данных
    console.log('📋 Попытка присоединить базу данных ab_ruch...');
    try {
      await sql.query`
        CREATE DATABASE ab_ruch 
        ON (FILENAME = '/var/opt/mssql/data/ab_ruch.mdf')
        FOR ATTACH_REBUILD_LOG
      `;
      console.log('✅ База данных присоединена!\n');
    } catch (err) {
      console.log('⚠️  Не удалось присоединить базу автоматически, пробуем другой способ...\n');
      // Попробуем найти существующие базы
    }

    // Переключаемся на базу данных
    await sql.query`USE ab_ruch`;

    // Получаем список всех таблиц
    console.log('📊 Список таблиц в базе данных:\n');
    const tablesResult = await sql.query`
      SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;

    const tables = tablesResult.recordset;
    console.log(`Найдено таблиц: ${tables.length}\n`);

    const databaseStructure = {
      tables: []
    };

    // Для каждой таблицы получаем структуру
    for (const table of tables) {
      const tableName = `${table.TABLE_SCHEMA}.${table.TABLE_NAME}`;
      console.log(`\n📋 Таблица: ${tableName}`);

      // Получаем колонки
      const columnsResult = await sql.query`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          NUMERIC_PRECISION,
          NUMERIC_SCALE,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          ORDINAL_POSITION
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ${table.TABLE_SCHEMA} 
          AND TABLE_NAME = ${table.TABLE_NAME}
        ORDER BY ORDINAL_POSITION
      `;

      const columns = columnsResult.recordset;
      console.log(`  Колонок: ${columns.length}`);

      // Получаем количество записей
      let rowCount = 0;
      try {
        const countResult = await sql.query`SELECT COUNT(*) as cnt FROM [${table.TABLE_SCHEMA}].[${table.TABLE_NAME}]`;
        rowCount = countResult.recordset[0].cnt;
        console.log(`  Записей: ${rowCount}`);
      } catch (err) {
        console.log(`  Записей: не удалось получить`);
      }

      // Получаем первичные ключи
      const pkResult = await sql.query`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ${table.TABLE_SCHEMA}
          AND TABLE_NAME = ${table.TABLE_NAME}
          AND CONSTRAINT_NAME IN (
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE CONSTRAINT_TYPE = 'PRIMARY KEY'
              AND TABLE_SCHEMA = ${table.TABLE_SCHEMA}
              AND TABLE_NAME = ${table.TABLE_NAME}
          )
      `;

      const primaryKeys = pkResult.recordset.map(r => r.COLUMN_NAME);

      databaseStructure.tables.push({
        schema: table.TABLE_SCHEMA,
        name: table.TABLE_NAME,
        fullName: tableName,
        columns: columns.map(col => ({
          name: col.COLUMN_NAME,
          type: col.DATA_TYPE,
          maxLength: col.CHARACTER_MAXIMUM_LENGTH,
          precision: col.NUMERIC_PRECISION,
          scale: col.NUMERIC_SCALE,
          nullable: col.IS_NULLABLE === 'YES',
          defaultValue: col.COLUMN_DEFAULT,
          position: col.ORDINAL_POSITION
        })),
        rowCount,
        primaryKeys
      });

      // Показываем первые несколько колонок
      columns.slice(0, 5).forEach(col => {
        const typeInfo = col.CHARACTER_MAXIMUM_LENGTH 
          ? `${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH})`
          : col.NUMERIC_PRECISION
          ? `${col.DATA_TYPE}(${col.NUMERIC_PRECISION}${col.NUMERIC_SCALE ? ',' + col.NUMERIC_SCALE : ''})`
          : col.DATA_TYPE;
        console.log(`    - ${col.COLUMN_NAME}: ${typeInfo} ${col.IS_NULLABLE === 'YES' ? '(nullable)' : '(not null)'}`);
      });
      if (columns.length > 5) {
        console.log(`    ... и еще ${columns.length - 5} колонок`);
      }
    }

    // Сохраняем структуру в JSON
    const fs = require('fs');
    fs.writeFileSync('database-structure.json', JSON.stringify(databaseStructure, null, 2));
    console.log('\n\n💾 Структура базы данных сохранена в database-structure.json');

    await sql.close();
    console.log('\n✅ Анализ завершен!');

  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    if (err.code === 'ELOGIN') {
      console.log('\n💡 Проверьте пароль и убедитесь, что SQL Server запущен');
    }
    process.exit(1);
  }
}

analyzeDatabase();



