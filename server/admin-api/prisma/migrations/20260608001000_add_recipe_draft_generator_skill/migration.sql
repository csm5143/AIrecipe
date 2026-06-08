UPDATE "ai_skills"
SET
  "tools" = '["search_recipe","generate_recipe_draft","add_to_fridge","add_to_shopping_list","schedule_reminder"]'::jsonb,
  "triggerKeywords" = '["加入小冰箱","添加到小冰箱","放到小冰箱","放进小冰箱","放入小冰箱","小冰箱","加入小菜篮","加入菜篮","添加到小菜篮","添加到菜篮","放到小菜篮","放进小菜篮","放置到小菜篮","放置到小菜蓝","小菜篮","小菜蓝","买菜","购物清单","提醒买菜","提醒","通知","准备食材","生成菜谱","创建菜谱","菜谱草稿"]'::jsonb,
  "systemPrompt" = '当用户要求保存识别出的食材时，执行小冰箱写入；当用户明确要求加入小菜篮时，优先使用正式菜谱，若未找到则调用 recipe-generator 草稿生成结构化食材清单；当用户要求买菜或准备食材提醒时，创建定时提醒。',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'shopping-list';

INSERT INTO "ai_skills" ("name", "displayName", "description", "triggerKeywords", "tools", "systemPrompt", "priority", "isActive")
VALUES (
  'recipe-draft-generator',
  '菜谱草稿生成',
  '基于 recipe-generator 专业菜谱标准，在正式菜谱库未命中时生成结构化菜谱草稿，用于无菜谱小菜篮清单。',
  '["生成菜谱","创建菜谱","菜谱草稿","准备食材","没有菜谱","找不到菜谱","小菜篮","小菜蓝"]'::jsonb,
  '["generate_recipe_draft"]'::jsonb,
  '使用 recipe-generator 的专业厨师+营养师标准生成结构化菜谱草稿：明确食材用量、步骤判断标准、烹饪时间和 tips。草稿仅用于采购清单，不直接发布为正式菜谱。',
  92,
  true
)
ON CONFLICT ("name") DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  "description" = EXCLUDED."description",
  "triggerKeywords" = EXCLUDED."triggerKeywords",
  "tools" = EXCLUDED."tools",
  "systemPrompt" = EXCLUDED."systemPrompt",
  "priority" = EXCLUDED."priority",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;
