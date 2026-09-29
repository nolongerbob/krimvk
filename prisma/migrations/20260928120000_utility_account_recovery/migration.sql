ALTER TABLE "messages" ADD COLUMN "isSensitive" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "utility_account_access" (
  "key" TEXT PRIMARY KEY,
  "userId" TEXT,
  "email" TEXT,
  "emailSyncedAt" TIMESTAMP(3),
  "pendingChangeId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "utility_password_changes" (
  "id" TEXT PRIMARY KEY,
  "accountKey" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "questionId" TEXT,
  "recoveryTokenHash" TEXT,
  "passwordEncrypted" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "messageId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3)
);
CREATE INDEX "utility_password_changes_accountKey_createdAt_idx"
  ON "utility_password_changes"("accountKey", "createdAt");
