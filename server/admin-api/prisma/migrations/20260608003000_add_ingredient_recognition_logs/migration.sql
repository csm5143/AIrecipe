CREATE TABLE IF NOT EXISTS "ingredient_recognition_logs" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "ingredients" JSONB NOT NULL,
  "model" TEXT,
  "tokensUsed" INTEGER,
  "rawResponse" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ingredient_recognition_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ingredient_recognition_logs_userId_createdAt_idx"
  ON "ingredient_recognition_logs"("userId", "createdAt");
