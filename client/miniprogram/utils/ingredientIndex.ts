/**
 * 食材名称索引 — O(1) 查找工具
 * 将 API 返回的食材列表构建为 Map 索引，替代线性扫描
 */

interface IngredientInfo {
  name: string;
  category: string;
}

interface IngredientIndex {
  /** 精确名称 → 分类 */
  exactMap: Map<string, string>;
  /** 别名 → 标准名称 */
  aliasMap: Map<string, string>;
  /** 标准名称列表 */
  names: string[];
  /** 完整数据列表 */
  data: IngredientInfo[];
}

let _index: IngredientIndex | null = null;

/** 从 API 食材列表构建索引 */
export function buildIngredientIndex(items: Array<{ name: string; category?: string }>): IngredientIndex {
  const exactMap = new Map<string, string>();
  const aliasMap = new Map<string, string>();
  const names: string[] = [];
  const data: IngredientInfo[] = [];

  for (const item of items) {
    if (!item.name) continue;
    const name = item.name.trim();
    const category = item.category || 'other';
    const key = name.toLowerCase();

    exactMap.set(key, name);
    names.push(name);
    data.push({ name, category });
  }

  // 反向别名索引（从现有 aliasMap 构建）
  const builtinAliases: Record<string, string[]> = {
    '猪肉': ['猪肉末', '肉末', '绞肉', '肉糜', '猪肉馅', '肉馅', '猪肉碎', '五花肉', '梅花肉', '里脊', '猪里脊'],
    '牛肉': ['牛肉末', '牛肉糜', '牛肉馅', '牛肉碎', '牛绞肉', '牛腩', '牛排', '牛腱', '牛腱子肉'],
    '鸡肉': ['鸡胸肉末', '鸡肉糜', '鸡肉馅', '鸡胸末', '鸡腿', '鸡腿肉', '鸡翅', '鸡翅中', '鸡翅根', '鸡爪', '凤爪', '整鸡'],
    '虾仁': ['虾肉', '虾糜', '基围虾', '大虾'],
    '鱼肉': ['鱼糜', '鱼馅', '鱼蓉', '鱼片'],
    '鸡蛋': ['蛋液', '全蛋', '鸡蛋液'],
    '番茄': ['西红柿'],
    '土豆': ['马铃薯'],
    '黄瓜': ['青瓜'],
    '胡萝卜': ['红萝卜'],
    '大白菜': ['白菜'],
    '卷心菜': ['包菜', '甘蓝'],
    '豆腐': ['嫩豆腐', '老豆腐', '北豆腐', '南豆腐'],
    '蒜瓣': ['大蒜', '蒜', '蒜头'],
    '香菜': ['芫荽'],
    '辣椒': ['尖椒', '青椒', '红椒', '杭椒', '线椒'],
    '洋葱': ['葱头'],
    '葱': ['小葱', '香葱', '细葱', '细香葱'],
    '茄子': ['长茄子', '圆茄子', '紫茄子'],
    '四季豆': ['豆角', '菜豆', '架豆'],
    '西葫芦': ['角瓜', '番瓜', '小瓜'],
    '南瓜': ['倭瓜', '北瓜', '金瓜'],
    '生菜': ['叶生菜', '散叶生菜', '球生菜'],
    '莴笋': ['莴苣', '千金菜'],
    '白萝卜': ['萝卜', '水萝卜', '心灵美'],
    '莲藕': ['藕', '莲菜'],
    '山药': ['淮山', '怀山药', '土薯'],
    '金针菇': ['朴菇', '智力菇'],
    '杏鲍菇': ['刺芹侧耳'],
    '香菇': ['花菇', '冬菇', '香蕈'],
    '口蘑': ['白蘑菇', '圆蘑菇'],
    '木耳': ['云耳', '黑木耳', '川耳'],
    '银耳': ['白木耳', '雪耳'],
    '腐竹': ['豆皮', '腐皮', '豆筋'],
    '糯米': ['江米', '紫糯米', '黑米'],
    '小米': ['粟米', '谷子'],
    '黑米': ['黑糯米', '血糯米'],
    '可乐': ['可口可乐', '百事可乐'],
    '料酒': ['黄酒', '老酒', '花雕'],
    '生抽': ['酱油', '淡酱油'],
    '老抽': ['红烧酱油', '浓酱油'],
    '蚝油': ['牡蛎油'],
    '芝麻油': ['香油', '麻油'],
    '玉米油': ['粟米油'],
    '花生油': ['生油'],
    '面粉': ['小麦粉', '中筋面粉', '低筋面粉', '高筋面粉'],
    '淀粉': ['生粉', '太白粉', '玉米淀粉', '土豆淀粉', '木薯淀粉'],
    '白糖': ['白砂糖', '细砂糖', '糖粉'],
    '冰糖': ['冰片糖'],
    '红糖': ['赤砂糖', '黑糖'],
  };

  for (const [standard, aliases] of Object.entries(builtinAliases)) {
    for (const alias of aliases) {
      aliasMap.set(alias.toLowerCase(), standard);
    }
  }

  _index = { exactMap, aliasMap, names, data };
  return _index;
}

/** 获取当前索引（如未构建则返回空索引） */
function getIndex(): IngredientIndex {
  if (_index) return _index;
  return { exactMap: new Map(), aliasMap: new Map(), names: [], data: [] };
}

/** O(1) 精确匹配食材名称 */
export function findExact(name: string): string | null {
  const idx = getIndex();
  const key = name.trim().toLowerCase();
  return idx.exactMap.get(key) || null;
}

/** O(1) 别名 → 标准名 */
export function resolveAlias(name: string): string | null {
  const idx = getIndex();
  const key = name.trim().toLowerCase();
  return idx.aliasMap.get(key) || null;
}

/**
 * 规范化食材名称（精确匹配 → 别名 → 包含匹配）
 * 包含匹配降级为 O(n)，但只在精确和别名都未命中时执行
 */
export function normalizeName(name: string): string | null {
  const idx = getIndex();
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;

  // 1. O(1) 精确匹配
  const exact = idx.exactMap.get(normalized);
  if (exact) return exact;

  // 2. O(1) 别名映射
  const alias = idx.aliasMap.get(normalized);
  if (alias && idx.exactMap.has(alias.toLowerCase())) return alias;

  // 3. O(n) 包含匹配（降级，取最短名称）
  let bestMatch: string | null = null;
  let shortestLen = Infinity;
  for (const name of idx.names) {
    const lower = name.toLowerCase();
    if (lower.includes(normalized) || normalized.includes(lower)) {
      if (lower.length < shortestLen) {
        shortestLen = lower.length;
        bestMatch = name;
      }
    }
  }
  return bestMatch;
}

/** 获取所有食材名称列表 */
export function getAllNames(): string[] {
  return getIndex().names;
}

/** 获取所有食材数据 */
export function getAllData(): IngredientInfo[] {
  return getIndex().data;
}
