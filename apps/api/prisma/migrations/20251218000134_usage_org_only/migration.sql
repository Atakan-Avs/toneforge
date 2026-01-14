/*
  Warnings:

  - You are about to drop the column `userId` on the `Usage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Usage" DROP CONSTRAINT "Usage_userId_fkey";

-- AlterTable
ALTER TABLE "Usage" DROP COLUMN "userId";
