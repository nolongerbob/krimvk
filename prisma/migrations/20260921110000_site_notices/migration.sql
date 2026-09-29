CREATE TABLE "site_notices" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "buttonLabel" TEXT NOT NULL DEFAULT 'Что изменится',
    "newsId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "site_notices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "site_notices_period_check" CHECK ("endsAt" > "startsAt")
);
CREATE INDEX "site_notices_enabled_startsAt_endsAt_idx" ON "site_notices"("enabled", "startsAt", "endsAt");
ALTER TABLE "site_notices" ADD CONSTRAINT "site_notices_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;
