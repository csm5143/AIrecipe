-- Migration: init
-- Created: 2025-04-23

-- Create enums
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR');
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'OFFLINE', 'DELETED', 'ACTIVE');
CREATE TYPE "ListStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "FeedbackType" AS ENUM ('BUG_REPORT', 'FEATURE_REQUEST', 'CONTENT_ISSUE', 'OTHER');
CREATE TYPE "FeedbackStatus" AS ENUM ('PENDING', 'REPLIED', 'RESOLVED', 'CLOSED');
CREATE TYPE "ScanStatus" AS ENUM ('PROCESSING', 'SUCCESS', 'FAILED');
CREATE TYPE "LinkType" AS ENUM ('NONE', 'RECIPE', 'PAGE', 'LINK');
CREATE TYPE "NoticeType" AS ENUM ('SYSTEM', 'ACTIVITY', 'UPDATE');
CREATE TYPE "NoticeTarget" AS ENUM ('ALL', 'NEW_USER', 'ACTIVE_USER');

-- ==================== 管理员账号 ====================
CREATE TABLE "admins" (
    "id" SERIAL PRIMARY KEY,
    "username" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "nickname" VARCHAR(255),
    "avatar" VARCHAR(500),
    "role" "AdminRole" NOT NULL DEFAULT 'EDITOR',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" VARCHAR(45),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 操作日志 ====================
CREATE TABLE "operation_logs" (
    "id" SERIAL PRIMARY KEY,
    "adminId" INTEGER NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "targetId" VARCHAR(255),
    "detail" TEXT,
    "ip" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "operation_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "operation_logs_adminId_idx" ON "operation_logs"("adminId");
CREATE INDEX "operation_logs_createdAt_idx" ON "operation_logs"("createdAt");

-- ==================== 用户管理 ====================
CREATE TABLE "users" (
    "id" SERIAL PRIMARY KEY,
    "openid" VARCHAR(255) NOT NULL UNIQUE,
    "unionid" VARCHAR(255) UNIQUE,
    "nickname" VARCHAR(255),
    "avatar" VARCHAR(500),
    "phone" VARCHAR(50) UNIQUE,
    "gender" "Gender" DEFAULT 'UNKNOWN',
    "birthday" TIMESTAMP(3),
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" VARCHAR(45),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "users_openid_idx" ON "users"("openid");
CREATE INDEX "users_unionid_idx" ON "users"("unionid");
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- ==================== 食谱 ====================
CREATE TABLE "recipes" (
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "coverImage" VARCHAR(500),
    "description" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "cookingTime" INTEGER,
    "servings" INTEGER,
    "calories" INTEGER,
    "tags" JSONB,
    "ingredients" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "tips" TEXT,
    "nutrition" JSONB,
    "cuisine" VARCHAR(100),
    "category" VARCHAR(100),
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPrompt" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "collectCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "recipes_status_idx" ON "recipes"("status");
CREATE INDEX "recipes_isFeatured_idx" ON "recipes"("isFeatured");
CREATE INDEX "recipes_createdAt_idx" ON "recipes"("createdAt");
CREATE INDEX "recipes_category_idx" ON "recipes"("category");

-- ==================== 食材 ====================
CREATE TABLE "ingredients" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "alias" VARCHAR(255),
    "coverImage" VARCHAR(500),
    "category" VARCHAR(100),
    "unit" VARCHAR(50),
    "calories" DOUBLE PRECISION,
    "nutrition" JSONB,
    "tags" JSONB,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ingredients_name_idx" ON "ingredients"("name");
CREATE INDEX "ingredients_category_idx" ON "ingredients"("category");

-- ==================== 食谱-食材关联 ====================
CREATE TABLE "recipe_ingredients" (
    "id" SERIAL PRIMARY KEY,
    "recipeId" INTEGER NOT NULL,
    "ingredientId" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "amount" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(50),
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recipe_ingredients_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recipe_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "recipe_ingredients_recipeId_idx" ON "recipe_ingredients"("recipeId");

-- ==================== 收藏夹 ====================
CREATE TABLE "collections" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "coverImage" VARCHAR(500),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "collections_userId_idx" ON "collections"("userId");

-- ==================== 收藏夹条目 ====================
CREATE TABLE "collection_items" (
    "id" SERIAL PRIMARY KEY,
    "collectionId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "collection_items_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE("collectionId", "recipeId")
);
CREATE INDEX "collection_items_collectionId_idx" ON "collection_items"("collectionId");

-- ==================== 收藏（点赞） ====================
CREATE TABLE "favorites" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE("userId", "recipeId")
);
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");
CREATE INDEX "favorites_recipeId_idx" ON "favorites"("recipeId");

-- ==================== 购物清单 ====================
CREATE TABLE "shopping_lists" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" "ListStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shopping_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "shopping_lists_userId_idx" ON "shopping_lists"("userId");

-- ==================== 购物清单条目 ====================
CREATE TABLE "shopping_items" (
    "id" SERIAL PRIMARY KEY,
    "listId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "amount" VARCHAR(100),
    "unit" VARCHAR(50),
    "category" VARCHAR(100),
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shopping_items_listId_fkey" FOREIGN KEY ("listId") REFERENCES "shopping_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "shopping_items_listId_idx" ON "shopping_items"("listId");

-- ==================== 用户反馈 ====================
CREATE TABLE "feedbacks" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER,
    "type" "FeedbackType" NOT NULL DEFAULT 'OTHER',
    "content" TEXT NOT NULL,
    "images" JSONB,
    "contact" VARCHAR(255),
    "status" "FeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "reply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "repliedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feedbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "feedbacks_status_idx" ON "feedbacks"("status");
CREATE INDEX "feedbacks_userId_idx" ON "feedbacks"("userId");
CREATE INDEX "feedbacks_createdAt_idx" ON "feedbacks"("createdAt");

-- ==================== 反馈回复 ====================
CREATE TABLE "feedback_replies" (
    "id" SERIAL PRIMARY KEY,
    "feedbackId" INTEGER NOT NULL,
    "adminId" INTEGER,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feedback_replies_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "feedback_replies_feedbackId_idx" ON "feedback_replies"("feedbackId");

-- ==================== AI 扫描记录 ====================
CREATE TABLE "ai_scans" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "imageUrl" VARCHAR(500) NOT NULL,
    "result" JSONB NOT NULL,
    "recipes" JSONB,
    "status" "ScanStatus" NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_scans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ai_scans_userId_idx" ON "ai_scans"("userId");
CREATE INDEX "ai_scans_createdAt_idx" ON "ai_scans"("createdAt");

-- ==================== Banner ====================
CREATE TABLE "banners" (
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "imageUrl" VARCHAR(500) NOT NULL,
    "linkType" "LinkType" NOT NULL DEFAULT 'NONE',
    "linkValue" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "banners_status_startTime_endTime_idx" ON "banners"("status", "startTime", "endTime");

-- ==================== 公告 ====================
CREATE TABLE "notices" (
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "type" "NoticeType" NOT NULL DEFAULT 'SYSTEM',
    "target" "NoticeTarget" NOT NULL DEFAULT 'ALL',
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
