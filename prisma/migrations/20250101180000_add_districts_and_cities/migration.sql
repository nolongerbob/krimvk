-- CreateTable
CREATE TABLE "water_quality_districts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "water_quality_districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_quality_cities" (
    "id" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "water_quality_cities_pkey" PRIMARY KEY ("id")
);

-- Migrate existing data: create default district and move regions to cities
INSERT INTO "water_quality_districts" ("id", "name", "order", "isActive", "createdAt", "updatedAt")
SELECT 
    'default-district-' || gen_random_uuid()::text,
    'Общий район',
    0,
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM "water_quality_districts");

-- Migrate regions to cities
INSERT INTO "water_quality_cities" ("id", "districtId", "name", "order", "isActive", "createdAt", "updatedAt")
SELECT 
    r."id",
    (SELECT "id" FROM "water_quality_districts" LIMIT 1),
    r."name",
    r."order",
    r."isActive",
    r."createdAt",
    r."updatedAt"
FROM "water_quality_regions" r;

-- Update years to reference cities instead of regions
ALTER TABLE "water_quality_years" RENAME COLUMN "regionId" TO "cityId";

-- Drop old unique constraint and create new one
ALTER TABLE "water_quality_years" DROP CONSTRAINT IF EXISTS "water_quality_years_regionId_year_key";
ALTER TABLE "water_quality_years" ADD CONSTRAINT "water_quality_years_cityId_year_key" UNIQUE ("cityId", "year");

-- Drop old foreign key and create new one
ALTER TABLE "water_quality_years" DROP CONSTRAINT IF EXISTS "water_quality_years_regionId_fkey";
ALTER TABLE "water_quality_years" ADD CONSTRAINT "water_quality_years_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "water_quality_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key for cities to districts
ALTER TABLE "water_quality_cities" ADD CONSTRAINT "water_quality_cities_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "water_quality_districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old regions table
DROP TABLE IF EXISTS "water_quality_regions";

