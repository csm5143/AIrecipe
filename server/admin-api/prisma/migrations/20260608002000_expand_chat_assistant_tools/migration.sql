UPDATE "ai_skills"
SET
  "tools" = '["search_recipe","generate_recipe_draft","add_to_fridge","add_to_shopping_list","schedule_reminder","list_fridge","list_shopping_list","save_user_memory"]'::jsonb,
  "triggerKeywords" = '["小菜篮","小菜蓝","购物清单","买菜清单","提醒","小冰箱","冰箱","食材","记住","忌口","过敏","喜欢吃","不喜欢","生成菜谱","创建菜谱","菜谱草稿"]'::jsonb,
  "systemPrompt" = '你负责把用户的自然语言请求转成小厨子可执行动作。涉及小冰箱、小菜篮、提醒、饮食偏好时优先调用工具；正式菜谱不存在时允许用 recipe-generator 草稿生成无菜谱清单。',
  "updatedAt" = NOW()
WHERE "name" = 'shopping-list';

UPDATE "ai_skills"
SET
  "tools" = '["add_to_fridge","list_fridge","save_user_memory"]'::jsonb,
  "triggerKeywords" = '["小冰箱","冰箱","放入小冰箱","加入小冰箱","现有食材","已有食材","剩下什么","记住","忌口","过敏"]'::jsonb,
  "systemPrompt" = '你负责管理用户小冰箱和饮食记忆。只把明确食材写入小冰箱，不要从菜谱步骤或自然语言说明里截取伪食材。',
  "updatedAt" = NOW()
WHERE "name" = 'fridge-management';

INSERT INTO "ai_skills" (
  "name",
  "displayName",
  "description",
  "triggerKeywords",
  "tools",
  "systemPrompt",
  "priority",
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  'context-reader',
  '用户上下文读取',
  '读取用户小冰箱、小菜篮和饮食偏好，用于更贴近个人情况的对话推荐。',
  '["冰箱","小冰箱","小菜篮","小菜蓝","购物清单","买菜清单","缺什么","用现有食材","根据我的食材"]'::jsonb,
  '["list_fridge","list_shopping_list"]'::jsonb,
  '回答前先读取用户已有食材和小菜篮，只基于真实数据给出建议；缺少数据时明确说明。',
  88,
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("name") DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  "description" = EXCLUDED."description",
  "triggerKeywords" = EXCLUDED."triggerKeywords",
  "tools" = EXCLUDED."tools",
  "systemPrompt" = EXCLUDED."systemPrompt",
  "priority" = EXCLUDED."priority",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

INSERT INTO "ai_skills" (
  "name",
  "displayName",
  "description",
  "triggerKeywords",
  "tools",
  "systemPrompt",
  "priority",
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  'preference-memory',
  '饮食偏好记忆',
  '保存用户明确表达的忌口、过敏、口味和健康目标。',
  '["记住","以后记得","我不吃","不喜欢","喜欢吃","爱吃","过敏","忌口","少油","少盐","控糖","减脂"]'::jsonb,
  '["save_user_memory"]'::jsonb,
  '只保存用户明确表达的长期偏好或限制，不保存临时闲聊。',
  86,
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("name") DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  "description" = EXCLUDED."description",
  "triggerKeywords" = EXCLUDED."triggerKeywords",
  "tools" = EXCLUDED."tools",
  "systemPrompt" = EXCLUDED."systemPrompt",
  "priority" = EXCLUDED."priority",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();
