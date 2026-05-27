-- AlterTable: ai_api_keys 加 keyType 字段
ALTER TABLE "ai_api_keys" ADD COLUMN IF NOT EXISTS "keyType" VARCHAR(20);

-- CreateTable: prompt_templates
CREATE TABLE IF NOT EXISTS "prompt_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scene" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "size" TEXT NOT NULL DEFAULT '1024x1024',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- Seed: 导入 7 个硬编码模板
INSERT INTO "prompt_templates" ("name", "description", "scene", "template", "size", "sortOrder") VALUES
('中式家常·俯拍暖光', '适合小炒菜、家常菜的封面图，暖色调，俯拍视角', 'cover', 'professional Chinese food photography, overhead close-up shot of {{dishName}}, featuring {{ingredients}}, served on {{plateStyle}}, warm golden natural window light, steam rising, shallow depth of field, dark rustic wooden table, appetizing and vibrant colors, 4K ultra detailed, commercial food photo, no text no watermark', '1024x1024', 0),
('日系清新·自然光', '适合轻食、饮品、甜品的封面图，明亮清新风格', 'cover', 'Japanese minimalist food photography, bright natural lighting, {{dishName}} with {{ingredients}}, on white ceramic plate, clean composition, soft shadows, light wood table, fresh and airy, 4K, no text', '1024x1024', 1),
('汤品火锅·热气氛围', '适合汤品、火锅、面食，突出热气腾腾的感觉', 'cover', 'steaming hot {{dishName}}, rich broth with {{ingredients}}, in traditional ceramic pot, dramatic warm lighting, steam visible, cozy atmosphere, Chinese cuisine, 4K food photography, no text', '1024x1024', 2),
('烹饪过程·厨房自然光', '步骤图，展示烹饪动作', 'step', 'cooking process photo, {{stepDescription}}, hands preparing food, clean bright kitchen, natural daylight, top-down angle, sharp focus on the action, professional food photography, 4K', '1024x1024', 3),
('轮播图·氛围横版', '适合首页轮播，留白放文字, 横版', 'banner', 'atmospheric food scene, {{dishName}}, elegant restaurant atmosphere, warm golden hour light, horizontal composition, negative space on top for text overlay, shallow depth of field, 4K, commercial photography, no text overlay', '1920x800', 4),
('卡片·竖版特写', '适合小卡片展示，竖版构图', 'card', 'close-up food shot, {{dishName}} with {{ingredients}}, rustic ceramic plate, warm lighting, vertical portrait composition, rich textures, 4K, appetizing, no text', '800x1200', 5),
('图标·扁平矢量', '适合做图标，简约风格', 'icon', 'flat vector style icon of {{dishName}}, simple minimal design, transparent background, single object centered, warm color palette, clean lines, suitable for app icon', '512x512', 6);
