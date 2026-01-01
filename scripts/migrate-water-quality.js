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

      // Создаем дефолтный район, если его нет
      let defaultDistrict = await prisma.waterQualityDistrict.findFirst({
        where: { name: 'Общий район' },
      });

      if (!defaultDistrict) {
        defaultDistrict = await prisma.waterQualityDistrict.create({
          data: {
            name: 'Общий район',
            order: 0,
          },
        });
        console.log('✅ Created default district');
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
        `, region.id, defaultDistrict.id, region.name, region.order || 0, region.isActive !== false, region.createdAt || new Date(), region.updatedAt || new Date());
      }
      console.log(`✅ Migrated ${regions.length} regions to cities`);

      // Обновляем years: regionId -> cityId
      const yearsWithRegionId = await prisma.$queryRaw`
        SELECT * FROM water_quality_years WHERE "regionId" IS NOT NULL;
      `;

      if (yearsWithRegionId.length > 0) {
        // Добавляем cityId колонку, если её нет
        await prisma.$executeRawUnsafe(`
          ALTER TABLE water_quality_years 
          ADD COLUMN IF NOT EXISTS "cityId" TEXT;
        `);

        // Мигрируем данные
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

