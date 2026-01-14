-- Step 1: Add stripeEventId column (nullable first)
ALTER TABLE "StripeEvent" ADD COLUMN "stripeEventId" TEXT;

-- Step 2: Copy existing eventId values to stripeEventId
UPDATE "StripeEvent" SET "stripeEventId" = "eventId" WHERE "stripeEventId" IS NULL;

-- Step 3: Drop the old unique constraint on eventId
DROP INDEX IF EXISTS "StripeEvent_eventId_key";

-- Step 4: Make stripeEventId NOT NULL (now that all rows have values)
ALTER TABLE "StripeEvent" ALTER COLUMN "stripeEventId" SET NOT NULL;

-- Step 5: Add unique constraint on stripeEventId
CREATE UNIQUE INDEX "StripeEvent_stripeEventId_key" ON "StripeEvent"("stripeEventId");

-- Step 6: Add index on stripeEventId for faster lookups
CREATE INDEX "StripeEvent_stripeEventId_idx" ON "StripeEvent"("stripeEventId");

-- Step 7: Drop the old eventId column
ALTER TABLE "StripeEvent" DROP COLUMN "eventId";

