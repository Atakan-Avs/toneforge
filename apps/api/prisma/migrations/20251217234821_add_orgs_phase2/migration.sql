/*
  Warnings:

  - Made the column `orgId` on table `BrandVoice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `Reply` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `Template` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `Usage` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "BrandVoice" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Reply" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Template" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Usage" ALTER COLUMN "orgId" SET NOT NULL;
