/**
 * 食材用量解析与合并工具
 * 功能：
 * 1. 规范食材名称映射（鸡胸 = 鸡胸肉 等）
 * 2. 解析用量格式（数字 + 单位）
 * 3. 同类用量合并（3个 + 2个 = 5个）
 * 4. 不同单位保留多条（鸡蛋: 3个 + 鸡蛋: 150g → 两条）
 */

export interface ParsedAmount {
  /** 原始字符串 */
  raw: string;
  /** 数值部分（null 表示无法解析，如"适量"、"少许"） */
  number: number | null;
  /** 单位 */
  unit: string;
  /** 能否相加 */
  addable: boolean;
}

export interface MergedIngredient {
  name: string;
  /** 合并后的用量列表（可能有多个不同单位的） */
  amounts: ParsedAmount[];
  /** 是否全不可相加 */
  allUnaddable: boolean;
}

/** 食材名称标准化映射（同一种食材的不同叫法） */
const INGREDIENT_ALIASES: Record<string, string> = {
  // 鸡胸相关
  '鸡胸': '鸡胸肉',
  '鸡胸肉': '鸡胸肉',
  '鸡大胸': '鸡胸肉',
  
  // 鸡蛋相关
  '鸡蛋': '鸡蛋',
  
  // 蔬菜
  '番茄': '番茄',
  '西红柿': '番茄',
  '土豆': '土豆',
  '马铃薯': '土豆',
  '胡萝卜': '胡萝卜',
  
  // 肉类
  '牛肉': '牛肉',
  '牛里脊': '牛里脊',
  '五花肉': '五花肉',
  '猪五花': '五花肉',
  
  // 调味
  '盐': '盐',
  '食用盐': '盐',
  
  // 油
  '食用油': '食用油',
  '植物油': '食用油',
  '色拉油': '食用油',
  
  // 其他常见别名
  '豆腐': '豆腐',
  '北豆腐': '豆腐',
  '南豆腐': '豆腐',
  
  // 虾类：各自独立，不相互覆盖（基围虾和大虾互通，虾仁可由两者去壳制作）
  '大虾': '大虾',
  '基围虾': '基围虾',
  '虾仁': '虾仁',

  // 鱼：各自独立，参考 expandUserIngredients 中的组互通
  '龙利鱼': '龙利鱼',
  '巴沙鱼': '巴沙鱼',
  
  '葱': '葱',
  '大葱': '葱',
  '小葱': '葱',
  '香葱': '葱',
  
  '蒜': '蒜',
  '大蒜': '蒜',
  '蒜头': '蒜',
  '蒜瓣': '蒜瓣',
  
  '姜': '姜',
  '生姜': '姜',
  
  '酱油': '酱油',
  '生抽': '生抽',
  '老抽': '老抽',
  
  '糖': '糖',
  '白糖': '白糖',
  '冰糖': '冰糖',
  '红糖': '红糖',
  
  '醋': '醋',
  '白醋': '白醋',
  '香醋': '香醋',
  '米醋': '米醋',
};

/** 单位标准化映射 */
const UNIT_ALIASES: Record<string, string> = {
  '克': 'g',
  'g': 'g',
  'gram': 'g',
  '千克': 'kg',
  'kg': 'kg',
  '毫升': 'ml',
  'ml': 'ml',
  '升': 'L',
  'L': 'L',
  '个': '个',
  '只': '只',
  '头': '头',
  '瓣': '瓣',
  '片': '片',
  '根': '根',
  '把': '把',
  '勺': '勺',
  '汤勺': '勺',
  '茶匙': '茶匙',
  '小勺': '茶匙',
  '大勺': '勺',
  '杯': '杯',
  '碗': '碗',
  '瓶': '瓶',
  '袋': '袋',
  '包': '包',
  '颗': '颗',
  '粒': '粒',
  '块': '块',
  '条': '条',
  '段': '段',
  '节': '节',
  '两': '两',
  '钱': '钱',
};

/** 不可合并的单位（这类值不能做数值运算） */
const NON_ADDABLE_UNITS = ['把', '少许', '适量', '若干', '少量', '一些', '几颗', '几片', '几勺', '几瓣'];

/** 不可相加的模糊用量关键词 */
const FUZZY_AMOUNT_KEYWORDS = [
  '适量', '少许', '若干', '少量', '一些', '几个', '几颗', '几片', 
  '几勺', '几瓣', '少量', '中量', '随意', '按需', '酌量', '看心情'
];

/**
 * 规范化食材名称
 */
export function normalizeIngredientName(name: string): string {
  const trimmed = name.trim();
  return INGREDIENT_ALIASES[trimmed] || trimmed;
}

/**
 * 判断用量是否模糊（不可精确计量）
 */
function isFuzzyAmount(s: string): boolean {
  const lower = s.toLowerCase();
  for (const kw of FUZZY_AMOUNT_KEYWORDS) {
    if (s.includes(kw) || lower.includes(kw)) {
      return true;
    }
  }
  return false;
}

/**
 * 解析用量字符串
 * 例如: "250g" → { number: 250, unit: 'g', addable: true }
 *      "3个" → { number: 3, unit: '个', addable: true }
 *      "适量" → { number: null, unit: '', addable: false, fuzzy: true }
 *      "2-3瓣" → { number: 2.5, unit: '瓣', addable: true } (取中间值)
 */
export function parseAmount(raw: string): ParsedAmount {
  const s = (raw || '').trim();
  
  // 空
  if (!s) {
    return { raw: s, number: null, unit: '', addable: false };
  }
  
  // 检查是否模糊用量
  const fuzzy = isFuzzyAmount(s);
  if (fuzzy) {
    return { raw: s, number: null, unit: '', addable: false };
  }
  
  // 匹配数字 + 单位
  // 支持: "250g", "250 g", "250克", "3个", "2-3瓣", "1/2杯", "半个"
  const patterns = [
    // 数字 + 单位: 250g, 250 g, 250克, 3个
    /^([\d.]+)\s*(g|kg|ml|L|克|千克|毫升|升|个|只|头|瓣|片|根|把|勺|汤勺|茶匙|小勺|大勺|杯|碗|瓶|袋|包|颗|粒|块|条|段|节|两|钱)?$/i,
    // 范围: 2-3, 1.5-2.5
    /^([\d.]+)[\-~至]([\d.]+)\s*(g|kg|ml|L|克|千克|毫升|升|个|只|头|瓣|片|根|把|勺|汤勺|茶匙|杯|碗|瓶|袋|包|颗|粒|块|条|两)?$/i,
    // 分数或文字: 1/2, 半个, 二分之一
    /^(二分之一|1\/2|½)\s*(个|杯|碗|勺|克|g|ml)?$/i,
    // 纯数字（如只有数字）
    /^(\d+\.?\d*)$/i,
  ];
  
  for (const pattern of patterns) {
    const match = s.match(pattern);
    if (match) {
      let number: number | null = null;
      let unit = '';
      
      if (pattern.source.startsWith('^([\\d.]+)\\s')) {
        // 数字 + 单位
        number = parseFloat(match[1]);
        unit = UNIT_ALIASES[match[2] || ''] || match[2] || '';
      } else if (pattern.source.startsWith('^([\\d.]+)[\\-~]')) {
        // 范围: 取最大值（买菜时倾向多买）
        number = parseFloat(match[2]);
        unit = UNIT_ALIASES[match[3] || ''] || match[3] || '';
      } else if (pattern.source.startsWith('^(二分之一')) {
        // 分数
        number = 0.5;
        unit = UNIT_ALIASES[match[2] || ''] || match[2] || '';
      } else if (pattern.source.startsWith('^(\\d+')) {
        // 纯数字
        number = parseFloat(match[1]);
        unit = '';
      }
      
      if (number !== null && !isNaN(number)) {
        const normalizedUnit = unit || '';
        const isAddable = normalizedUnit !== '' && !NON_ADDABLE_UNITS.includes(normalizedUnit);
        return {
          raw: s,
          number: number,
          unit: normalizedUnit,
          addable: isAddable
        };
      }
    }
  }
  
  // 无法解析，视为模糊用量
  return { raw: s, number: null, unit: '', addable: false };
}

/**
 * 合并食材用量
 *
 * 合并规则：
 * 1. 同名食材、同单位 → 精确值相加（如 3个 + 2个 = 5个）
 * 2. 同名食材、不同单位 → 保留多条（如 3个 + 150g = 两条）
 * 3. 有精确值时，模糊值不显示（避免 "3个 + 适量"）
 * 4. 都是模糊值时，只保留一个（如 适量 + 少许 → 只显示"适量"）
 * 5. 调料类（无单位）只保留一个
 */
export function mergeIngredients(ingredients: Array<{ name: string; amount: string }>): MergedIngredient[] {
  // 按规范化名称分组
  const groups = new Map<string, ParsedAmount[]>();

  for (const ing of ingredients) {
    const normalizedName = normalizeIngredientName(ing.name);
    const parsed = parseAmount(ing.amount);

    if (!groups.has(normalizedName)) {
      groups.set(normalizedName, []);
    }
    groups.get(normalizedName)!.push(parsed);
  }

  // 合并每组
  const result: MergedIngredient[] = [];

  groups.forEach((amounts, name) => {
    // 分离精确值和模糊值
    const preciseAmounts: ParsedAmount[] = [];
    const fuzzyAmounts: ParsedAmount[] = [];

    for (const amt of amounts) {
      if (amt.addable && amt.number !== null) {
        preciseAmounts.push(amt);
      } else {
        fuzzyAmounts.push(amt);
      }
    }

    // ========== 精确值合并逻辑 ==========
    const mergedPrecise = new Map<string, ParsedAmount>();
    for (const amt of preciseAmounts) {
      const key = amt.unit || '__no_unit__';
      const existing = mergedPrecise.get(key);
      if (existing) {
        // 同单位数值相加
        existing.number = (existing.number || 0) + (amt.number || 0);
        existing.raw = `${existing.number}${existing.unit}`;
      } else {
        mergedPrecise.set(key, { ...amt });
      }
    }

    // ========== 模糊值去重逻辑 ==========
    // 规则：有精确值时丢弃所有模糊值
    //      都是模糊值时只保留第一个（保留最规范的表述）
    const mergedFuzzy: ParsedAmount[] = [];
    if (preciseAmounts.length > 0) {
      // 有精确值，不需要模糊值
      mergedFuzzy.length = 0;
    } else if (fuzzyAmounts.length > 0) {
      // 都是模糊值，只保留一个最规范的
      // 优先保留精确表述的（如"适量"优于"看心情"）
      const priorityOrder = ['适量', '少许', '若干', '少量', '一些', '几个'];
      let bestFuzzy = fuzzyAmounts[0];
      let bestPriority = priorityOrder.indexOf(bestFuzzy.raw);

      for (let i = 1; i < fuzzyAmounts.length; i++) {
        const currentPriority = priorityOrder.indexOf(fuzzyAmounts[i].raw);
        if (currentPriority !== -1 && currentPriority < bestPriority) {
          bestFuzzy = fuzzyAmounts[i];
          bestPriority = currentPriority;
        }
      }
      mergedFuzzy.push(bestFuzzy);
    }

    // ========== 组合最终结果 ==========
    const finalAmounts = [
      ...Array.from(mergedPrecise.values()),
      ...mergedFuzzy
    ];

    const allUnaddable = finalAmounts.every(a => !a.addable);

    result.push({
      name,
      amounts: finalAmounts,
      allUnaddable
    });
  });

  // 按名称排序
  return result.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

/**
 * 格式化合并后的用量为字符串
 *
 * 显示规则：
 * - 只有一个精确值：直接显示 "5个"
 * - 多个精确值（不同单位）："250g + 500ml"
 * - 只有模糊值：显示 "适量"
 * - 精确值 + 模糊值：只显示精确值（模糊值已在合并时丢弃）
 */
export function formatMergedAmount(merged: MergedIngredient): string {
  if (merged.amounts.length === 0) {
    return '';
  }

  // 分离精确值和模糊值
  const preciseParts: string[] = [];
  let fuzzyPart = '';

  for (const amt of merged.amounts) {
    if (amt.addable && amt.number !== null) {
      // 格式化数字：整数不显示小数
      const numStr = Number.isInteger(amt.number)
        ? String(Math.round(amt.number))
        : amt.number.toFixed(1);
      preciseParts.push(`${numStr}${amt.unit}`);
    } else {
      // 模糊值只保留第一个
      if (!fuzzyPart) {
        fuzzyPart = amt.raw;
      }
    }
  }

  // 规则：有精确值时只显示精确值，无精确值时显示模糊值
  if (preciseParts.length > 0) {
    return preciseParts.join(' + ');
  }
  return fuzzyPart || '适量';
}

/**
 * 批量合并食材，返回合并后的列表
 */
export function batchMergeIngredients(
  recipeEntries: Array<{
    recipeId: string;
    recipeName: string;
    ingredients: Array<{ name: string; amount: string }>;
  }>
): MergedIngredient[] {
  // 收集所有食材
  const allIngredients: Array<{ name: string; amount: string }> = [];
  
  for (const entry of recipeEntries) {
    for (const ing of entry.ingredients) {
      allIngredients.push({
        name: ing.name,
        amount: ing.amount
      });
    }
  }
  
  return mergeIngredients(allIngredients);
}

/**
 * 生成购物清单文本
 */
export function generateShoppingListText(merged: MergedIngredient[]): string {
  const lines: string[] = ['【合并采购清单】', ''];
  
  merged.forEach(item => {
    const formatted = formatMergedAmount(item);
    lines.push(`· ${item.name}　${formatted}`);
  });
  
  return lines.join('\n');
}
