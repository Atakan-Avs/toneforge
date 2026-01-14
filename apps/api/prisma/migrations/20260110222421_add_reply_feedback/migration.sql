-- CreateTable
CREATE TABLE "ReplyFeedback" (
    "id" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReplyFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReplyFeedback_replyId_key" ON "ReplyFeedback"("replyId");

-- CreateIndex
CREATE INDEX "ReplyFeedback_replyId_idx" ON "ReplyFeedback"("replyId");

-- CreateIndex
CREATE INDEX "ReplyFeedback_rating_idx" ON "ReplyFeedback"("rating");

-- AddForeignKey
ALTER TABLE "ReplyFeedback" ADD CONSTRAINT "ReplyFeedback_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
