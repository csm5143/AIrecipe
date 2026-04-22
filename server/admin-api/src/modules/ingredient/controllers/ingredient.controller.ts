import { Request, Response } from 'express';
import { paginated } from '../../../types/response';

const db: any[] = [];
let idCounter = 1;

export async function getIngredients(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const keyword = (req.query.keyword as string || '').toLowerCase();
  const category = req.query.category as string;
  const status = req.query.status as string;

  let filtered = [...db];

  if (keyword) {
    filtered = filtered.filter(
      i => i.name.toLowerCase().includes(keyword) || (i.alias && i.alias.toLowerCase().includes(keyword))
    );
  }
  if (category) {
    filtered = filtered.filter(i => i.category === category);
  }
  if (status) {
    filtered = filtered.filter(i => i.status === status);
  }

  const total = filtered.length;
  const list = filtered.slice((page - 1) * pageSize, page * pageSize);

  res.json({
    code: 200,
    message: 'success',
    data: { page, pageSize, total, list },
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    timestamp: Date.now(),
  });
}

export async function createIngredient(req: Request, res: Response) {
  const data = req.body;
  const item = {
    id: idCounter++,
    name: data.name,
    alias: data.alias || '',
    category: data.category || 'vegetable',
    subCategory: data.subCategory || '',
    calories: data.calories || 0,
    protein: data.protein || 0,
    fat: data.fat || 0,
    carbs: data.carbs || 0,
    fiber: data.fiber || 0,
    sodium: data.sodium || 0,
    status: data.status || 'ACTIVE',
    remark: data.remark || '',
  };
  db.push(item);
  res.json({ code: 200, message: '创建成功', data: { id: item.id }, timestamp: Date.now() });
}

export async function updateIngredient(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const idx = db.findIndex(i => i.id === id);
  if (idx === -1) {
    res.status(404).json({ code: 404, message: '食材不存在', timestamp: Date.now() });
    return;
  }
  const data = req.body;
  db[idx] = { ...db[idx], ...data, id };
  res.json({ code: 200, message: '更新成功', data: { id }, timestamp: Date.now() });
}

export async function deleteIngredient(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const idx = db.findIndex(i => i.id === id);
  if (idx === -1) {
    res.status(404).json({ code: 404, message: '食材不存在', timestamp: Date.now() });
    return;
  }
  db.splice(idx, 1);
  res.json({ code: 200, message: '删除成功', data: null, timestamp: Date.now() });
}

export async function batchImportIngredients(req: Request, res: Response) {
  const items: any[] = req.body;
  if (!Array.isArray(items)) {
    res.status(400).json({ code: 400, message: '请传入食材数组', timestamp: Date.now() });
    return;
  }

  const categoryMap: Record<string, string> = {
    meat: 'meat', egg_dairy: 'dairy', egg: 'dairy', dairy: 'dairy',
    vegetable: 'vegetable', seafood: 'seafood', grain: 'grain', staple: 'grain',
    fruit: 'fruit', fungus: 'fungus', soy: 'soy',
    seasoning: 'seasoning', medicinal: 'seasoning', nut: 'nut',
    other: 'other',
  };

  let imported = 0;
  let skipped = 0;

  for (const item of items) {
    if (!item.name) { skipped++; continue; }
    const exists = db.some(i => i.name === item.name);
    if (exists) { skipped++; continue; }

    db.push({
      id: idCounter++,
      name: item.name,
      alias: item.alias || '',
      category: categoryMap[item.category] || 'other',
      subCategory: item.subCategory || '',
      calories: item.calories || 0,
      protein: item.protein || 0,
      fat: item.fat || 0,
      carbs: item.carbs || 0,
      fiber: item.fiber || 0,
      sodium: item.sodium || 0,
      status: item.selected === false ? 'INACTIVE' : 'ACTIVE',
      remark: '',
    });
    imported++;
  }

  res.json({
    code: 200,
    message: `导入完成：新增 ${imported} 条，跳过 ${skipped} 条`,
    data: { imported, skipped },
    timestamp: Date.now(),
  });
}
