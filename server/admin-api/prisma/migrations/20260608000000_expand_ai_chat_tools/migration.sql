UPDATE "ai_skills"
SET
  "tools" = '["search_recipe","add_to_fridge","add_to_shopping_list","schedule_reminder"]'::jsonb,
  "triggerKeywords" = '["加入小冰箱","添加到小冰箱","放到小冰箱","放进小冰箱","放入小冰箱","小冰箱","加入小菜篮","加入菜篮","添加到小菜篮","添加到菜篮","放到小菜篮","放进小菜篮","放置到小菜篮","放置到小菜蓝","小菜篮","小菜蓝","买菜","购物清单","提醒买菜","提醒","通知","准备食材"]'::jsonb,
  "systemPrompt" = '当用户要求保存识别出的食材时，执行小冰箱写入；当用户明确要求加入小菜篮时，整理食材清单并执行添加；当用户要求买菜或准备食材提醒时，创建定时提醒。',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'shopping-list';

INSERT INTO "ai_skills" ("name", "displayName", "description", "triggerKeywords", "tools", "systemPrompt", "priority", "isActive")
SELECT
  'fridge-management',
  '小冰箱管理',
  '把识别到或用户给出的食材写入小冰箱。',
  '["加入小冰箱","添加到小冰箱","放到小冰箱","放进小冰箱","放入小冰箱","小冰箱"]'::jsonb,
  '["add_to_fridge"]'::jsonb,
  '当用户要求保存食材到小冰箱时，解析最近识别结果或用户给出的食材并执行写入。',
  95,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM "ai_skills" WHERE "name" = 'fridge-management'
);
