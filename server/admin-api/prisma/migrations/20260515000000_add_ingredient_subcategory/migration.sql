-- =====================================================
-- 食材表添加 subCategory 字段 + ContentStatus 添加 INACTIVE
-- 执行方式：Navicat 中新建查询 -> 粘贴执行
-- =====================================================

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS "subCategory" VARCHAR(100);

-- ContentStatus 枚举已在 Prisma schema 中定义，Prisma Migrate 会自动同步
-- 这里手动添加 PostgreSQL enum 类型（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contentstatus') THEN
    CREATE TYPE ContentStatus AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT', 'PUBLISHED', 'OFFLINE', 'DELETED', 'PENDING', 'REJECTED');
  ELSE
    -- 添加 INACTIVE 到现有枚举（如果还没有的话）
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'INACTIVE') THEN
      ALTER TYPE ContentStatus ADD VALUE IF NOT EXISTS 'INACTIVE';
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Enum update skipped: %', SQLERRM;
END;
$$;
