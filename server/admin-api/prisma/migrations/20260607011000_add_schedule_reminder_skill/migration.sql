UPDATE "ai_skills"
SET
  "tools" = '["add_to_shopping_list","schedule_reminder"]'::jsonb,
  "triggerKeywords" = '["加入小菜篮","加入菜篮","买菜","购物清单","提醒买菜","提醒","通知"]'::jsonb,
  "systemPrompt" = '当用户明确要求加入小菜篮时，整理食材清单并执行添加；当用户要求买菜提醒时，创建定时提醒。',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'shopping-list';
