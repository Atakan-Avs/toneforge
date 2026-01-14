/*
  Warnings:

  - A unique constraint covering the columns `[orgId,period]` on the table `Usage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Usage_userId_period_idx";

-- DropIndex
DROP INDEX "Usage_userId_period_key";

-- CreateIndex
CREATE INDEX "Usage_orgId_period_idx" ON "Usage"("orgId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Usage_orgId_period_key" ON "Usage"("orgId", "period");
