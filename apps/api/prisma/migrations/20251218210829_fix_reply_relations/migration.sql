-- DropForeignKey
ALTER TABLE "Reply" DROP CONSTRAINT "Reply_userId_fkey";

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
