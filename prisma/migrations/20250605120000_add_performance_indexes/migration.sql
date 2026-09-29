-- CreateIndex
CREATE INDEX "applications_userId_status_idx" ON "applications"("userId", "status");

-- CreateIndex
CREATE INDEX "user_accounts_userId_isActive_idx" ON "user_accounts"("userId", "isActive");

-- CreateIndex
CREATE INDEX "news_published_publishedAt_idx" ON "news"("published", "publishedAt");

-- CreateIndex
CREATE INDEX "questions_status_updatedAt_idx" ON "questions"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "messages_questionId_createdAt_idx" ON "messages"("questionId", "createdAt");

-- CreateIndex
CREATE INDEX "disclosure_documents_category_isActive_idx" ON "disclosure_documents"("category", "isActive");
