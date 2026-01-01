const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateWaterQuality() {
  try {
    console.log('🔄 Starting water quality migration...');

    // Проверяем, существует ли таблица water_quality_regions
    const regionsTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'water_quality_regions'
      ) as exists;
    `;

    if (regionsTableExists[0]?.exists) {
      console.log('📦 Migrating from old structure...');

      // Проверяем, существует ли таблица districts
      const districtsTableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'water_quality_districts'
        ) as exists;
      `;

      if (!districtsTableExists[0]?.exists) {
        console.log('⚠️  Districts table does not exist yet, skipping data migration');
        return;
      }

      // Создаем дефолтный район, если его нет (используем raw SQL)
      const defaultDistrictResult = await prisma.$queryRaw`
        SELECT id FROM water_quality_districts WHERE name = 'Общий район' LIMIT 1;
      `;

      let defaultDistrictId;
      if (defaultDistrictResult.length === 0) {
        const newDistrict = await prisma.$executeRawUnsafe(`
          INSERT INTO water_quality_districts (id, name, "order", "isActive", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, 'Общий район', 0, true, NOW(), NOW())
          RETURNING id;
        `);
        const result = await prisma.$queryRawUnsafe(`
          SELECT id FROM water_quality_districts WHERE name = 'Общий район' LIMIT 1;
        `);
        defaultDistrictId = result[0].id;
        console.log('✅ Created default district');
      } else {
        defaultDistrictId = defaultDistrictResult[0].id;
        console.log('✅ Default district already exists');
      }

      // Получаем все регионы
      const regions = await prisma.$queryRaw`
        SELECT * FROM water_quality_regions;
      `;

      // Мигрируем регионы в города
      for (const region of regions) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO water_quality_cities (id, "districtId", name, "order", "isActive", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING;
        `, region.id, defaultDistrictId, region.name, region.order || 0, region.isActive !== false, region.createdAt || new Date(), region.updatedAt || new Date());
      }
      console.log(`✅ Migrated ${regions.length} regions to cities`);

      // Обновляем years: regionId -> cityId
      // Проверяем, есть ли колонка regionId
      const hasRegionId = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'water_quality_years' 
        AND column_name = 'regionId';
      `;

      if (hasRegionId.length > 0) {
        const yearsWithRegionId = await prisma.$queryRaw`
          SELECT id, "regionId" FROM water_quality_years WHERE "regionId" IS NOT NULL;
        `;

        if (yearsWithRegionId.length > 0) {
          // Проверяем, есть ли колонка cityId
          const hasCityId = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'water_quality_years' 
            AND column_name = 'cityId';
          `;

          if (hasCityId.length === 0) {
            // Добавляем cityId колонку
            await prisma.$executeRawUnsafe(`
              ALTER TABLE water_quality_years 
              ADD COLUMN "cityId" TEXT;
            `);
          }

          // Мигрируем данные: regionId -> cityId (они имеют одинаковые ID)
          for (const year of yearsWithRegionId) {
            await prisma.$executeRawUnsafe(`
              UPDATE water_quality_years 
              SET "cityId" = $1 
              WHERE id = $2;
            `, year.regionId, year.id);
          }
          console.log(`✅ Migrated ${yearsWithRegionId.length} years from regionId to cityId`);

          // Удаляем старую колонку regionId
          await prisma.$executeRawUnsafe(`
            ALTER TABLE water_quality_years 
            DROP COLUMN IF EXISTS "regionId";
          `);
          console.log('✅ Removed old regionId column');
        }
      }
    } else {
      console.log('✅ No old structure found, skipping migration');
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    // Не бросаем ошибку, чтобы сборка могла продолжиться
    console.log('⚠️  Continuing build despite migration error...');
  } finally {
    await prisma.$disconnect();
  }
}

migrateWaterQuality();

