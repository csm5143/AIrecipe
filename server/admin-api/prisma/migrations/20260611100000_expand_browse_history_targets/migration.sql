ALTER TABLE "browse_history" ADD COLUMN IF NOT EXISTS "targetType" TEXT NOT NULL DEFAULT 'recipe';
ALTER TABLE "browse_history" ADD COLUMN IF NOT EXISTS "targetId" INTEGER;
ALTER TABLE "browse_history" ADD COLUMN IF NOT EXISTS "targetTitle" TEXT;
ALTER TABLE "browse_history" ADD COLUMN IF NOT EXISTS "targetCover" TEXT;

UPDATE "browse_history"
SET "targetType" = 'recipe',
    "targetId" = "recipeId"
WHERE "targetId" IS NULL AND "recipeId" IS NOT NULL;

ALTER TABLE "browse_history" ALTER COLUMN "recipeId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "browse_history_targetType_targetId_idx" ON "browse_history"("targetType", "targetId");
