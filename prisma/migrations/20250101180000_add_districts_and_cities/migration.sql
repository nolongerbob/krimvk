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
DO $$
DECLARE
    default_district_id TEXT;
BEGIN
    -- Create default district if it doesn't exist
    INSERT INTO "water_quality_districts" ("id", "name", "order", "isActive", "createdAt", "updatedAt")
    SELECT 
        'default-district-' || gen_random_uuid()::text,
        'Общий район',
        0,
        true,
        NOW(),
        NOW()
    WHERE NOT EXISTS (SELECT 1 FROM "water_quality_districts")
    RETURNING "id" INTO default_district_id;
    
    -- Get default district ID if it already exists
    IF default_district_id IS NULL THEN
        SELECT "id" INTO default_district_id FROM "water_quality_districts" LIMIT 1;
    END IF;

    -- Migrate regions to cities (only if regions table exists and has data)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'water_quality_regions') THEN
        INSERT INTO "water_quality_cities" ("id", "districtId", "name", "order", "isActive", "createdAt", "updatedAt")
        SELECT 
            r."id",
            default_district_id,
            r."name",
            r."order",
            r."isActive",
            r."createdAt",
            r."updatedAt"
        FROM "water_quality_regions" r
        ON CONFLICT DO NOTHING;
    END IF;

    -- Update years to reference cities instead of regions
    -- First, add cityId column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'water_quality_years' AND column_name = 'cityId') THEN
        -- If regionId exists, migrate data first
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'water_quality_years' AND column_name = 'regionId') THEN
            -- Add cityId column
            ALTER TABLE "water_quality_years" ADD COLUMN "cityId" TEXT;
            
            -- Migrate data: regionId -> cityId (they have the same IDs)
            UPDATE "water_quality_years" SET "cityId" = "regionId" WHERE "cityId" IS NULL;
            
            -- Drop old column
            ALTER TABLE "water_quality_years" DROP COLUMN "regionId";
        ELSE
            -- Just add the column if regionId doesn't exist
            ALTER TABLE "water_quality_years" ADD COLUMN "cityId" TEXT;
        END IF;
    END IF;
END $$;

-- Drop old unique constraint and create new one
ALTER TABLE "water_quality_years" DROP CONSTRAINT IF EXISTS "water_quality_years_regionId_year_key";
ALTER TABLE "water_quality_years" DROP CONSTRAINT IF EXISTS "water_quality_years_cityId_year_key";
ALTER TABLE "water_quality_years" ADD CONSTRAINT "water_quality_years_cityId_year_key" UNIQUE ("cityId", "year");

-- Drop old foreign key and create new one
ALTER TABLE "water_quality_years" DROP CONSTRAINT IF EXISTS "water_quality_years_regionId_fkey";
ALTER TABLE "water_quality_years" DROP CONSTRAINT IF EXISTS "water_quality_years_cityId_fkey";
ALTER TABLE "water_quality_years" ADD CONSTRAINT "water_quality_years_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "water_quality_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key for cities to districts
ALTER TABLE "water_quality_cities" ADD CONSTRAINT "water_quality_cities_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "water_quality_districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old regions table
DROP TABLE IF EXISTS "water_quality_regions";

