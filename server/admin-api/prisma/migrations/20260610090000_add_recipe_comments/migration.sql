CREATE TABLE IF NOT EXISTS "comments" (
  "id" SERIAL PRIMARY KEY,
  "recipeId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "parentId" INTEGER,
  "likeCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "comments_recipeId_fkey"
    FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "comments_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "comments_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "comment_likes" (
  "id" SERIAL PRIMARY KEY,
  "commentId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "comment_likes_commentId_fkey"
    FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "comment_likes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "comments_recipeId_parentId_createdAt_idx"
  ON "comments"("recipeId", "parentId", "createdAt");

CREATE INDEX IF NOT EXISTS "comments_userId_createdAt_idx"
  ON "comments"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "comments_parentId_idx"
  ON "comments"("parentId");

CREATE UNIQUE INDEX IF NOT EXISTS "comment_likes_commentId_userId_key"
  ON "comment_likes"("commentId", "userId");

CREATE INDEX IF NOT EXISTS "comment_likes_userId_idx"
  ON "comment_likes"("userId");
