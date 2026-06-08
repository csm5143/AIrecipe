ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "healthProfile" JSONB;

ALTER TABLE "ai_chat_messages" ADD COLUMN IF NOT EXISTS "toolCalls" JSONB;

CREATE TABLE IF NOT EXISTS "user_memories" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_memories_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "user_memories_userId_createdAt_idx" ON "user_memories"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "user_memories_userId_type_idx" ON "user_memories"("userId", "type");

CREATE TABLE IF NOT EXISTS "scheduled_tasks" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "data" JSONB,
  "triggerAt" TIMESTAMP(3) NOT NULL,
  "fired" BOOLEAN NOT NULL DEFAULT false,
  "firedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "scheduled_tasks_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "scheduled_tasks_triggerAt_fired_idx" ON "scheduled_tasks"("triggerAt", "fired");
CREATE INDEX IF NOT EXISTS "scheduled_tasks_userId_fired_idx" ON "scheduled_tasks"("userId", "fired");

CREATE TABLE IF NOT EXISTS "ai_skills" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "description" TEXT,
  "triggerKeywords" JSONB,
  "tools" JSONB,
  "systemPrompt" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ai_skills_isActive_priority_idx" ON "ai_skills"("isActive", "priority");

INSERT INTO "ai_skills" ("name", "displayName", "description", "triggerKeywords", "tools", "systemPrompt", "priority", "isActive")
VALUES
  (
    'recipe-search',
    '菜谱搜索',
    '根据用户问题检索菜谱，并把真实菜谱结果注入小厨子上下文。',
    '["怎么做","推荐","菜谱","吃什么","做法","食材"]'::jsonb,
    '["search_recipe","get_recipe_detail"]'::jsonb,
    '优先基于系统中的真实菜谱回答，说明菜谱名称、用时、食材和关键步骤。',
    100,
    true
  ),
  (
    'shopping-list',
    '小菜篮',
    '把菜谱食材或用户给出的食材加入购物清单。',
    '["加入小菜篮","加入菜篮","买菜","购物清单","提醒买菜"]'::jsonb,
    '["add_to_shopping_list"]'::jsonb,
    '当用户明确要求加入小菜篮时，先整理食材清单，再执行添加。',
    90,
    true
  )
ON CONFLICT ("name") DO NOTHING;
