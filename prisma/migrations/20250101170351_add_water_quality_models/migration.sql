-- CreateTable
CREATE TABLE "water_quality_regions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "water_quality_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_quality_years" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "water_quality_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_quality_documents" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "water_quality_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "water_quality_years_regionId_year_key" ON "water_quality_years"("regionId", "year");

-- AddForeignKey
ALTER TABLE "water_quality_years" ADD CONSTRAINT "water_quality_years_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "water_quality_regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_quality_documents" ADD CONSTRAINT "water_quality_documents_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "water_quality_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

