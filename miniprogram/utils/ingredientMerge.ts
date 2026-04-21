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

/** 不可合并的单位 */
const NON_ADDABLE_UNITS = ['把', '少许', '适量', '若干', '少量', '一些', '几颗', '几片', '几勺', '几瓣'];

/**
 * 规范化食材名称
 */
export function normalizeIngredientName(name: string): string {
  const trimmed = name.trim();
  return INGREDIENT_ALIASES[trimmed] || trimmed;
}

/**
 * 解析用量字符串
 * 例如: "250g" → { number: 250, unit: 'g', addable: true }
 *      "3个" → { number: 3, unit: '个', addable: true }
 *      "适量" → { number: null, unit: '', addable: false }
 *      "2-3瓣" → { number: 2.5, unit: '瓣', addable: true } (取中间值)
 */
export function parseAmount(raw: string): ParsedAmount {
  const s = (raw || '').trim();
  
  // 空或纯文字描述
  if (!s) {
    return { raw: s, number: null, unit: '', addable: false };
  }
  
  // 检查是否不可相加
  const lower = s.toLowerCase();
  const unaddableKeywords = ['适量', '少许', '若干', '少量', '一些', '几个', '几颗', '几片', '几勺', '几瓣', '少量', '中量'];
  for (const kw of unaddableKeywords) {
    if (s.includes(kw) || lower.includes(kw)) {
      return { raw: s, number: null, unit: '', addable: false };
    }
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
  
  // 无法解析
  return { raw: s, number: null, unit: '', addable: false };
}

/**
 * 合并食材用量
 * 
 * 合并规则：
 * 1. 同名食材、同单位 → 数值相加
 * 2. 同名食材、不同单位 → 保留多条
 * 3. 无法解析的用量（"适量"）→ 单独保留
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
    const mergedAmounts: ParsedAmount[] = [];
    const seenUnits = new Map<string, ParsedAmount>();
    
    for (const amt of amounts) {
      if (!amt.addable) {
        // 不可相加的用量，保留原始值
        mergedAmounts.push(amt);
      } else {
        // 可相加的用量，按单位分组累加
        const key = amt.unit || '__no_unit__';
        const existing = seenUnits.get(key);
        if (existing && existing.addable) {
          // 累加数值
          existing.number = (existing.number || 0) + (amt.number || 0);
          // 合并 raw 描述
          if (existing.raw !== amt.raw) {
            existing.raw = `${existing.number}${existing.unit}`;
          }
        } else {
          // 新增
          seenUnits.set(key, { ...amt });
          mergedAmounts.push(seenUnits.get(key)!);
        }
      }
    }
    
    // 清理重复的不可相加项
    const unaddableSeen = new Set<string>();
    const finalAmounts = mergedAmounts.filter(amt => {
      if (!amt.addable) {
        if (unaddableSeen.has(amt.raw)) {
          return false;
        }
        unaddableSeen.add(amt.raw);
      }
      return true;
    });
    
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
 * 例如: "5个" 或 "250g + 适量"
 */
export function formatMergedAmount(merged: MergedIngredient): string {
  if (merged.amounts.length === 0) {
    return '';
  }
  
  const parts = merged.amounts.map(amt => {
    if (amt.addable && amt.number !== null) {
      // 格式化数字：整数不显示小数
      const numStr = Number.isInteger(amt.number) 
        ? String(Math.round(amt.number)) 
        : amt.number.toFixed(1);
      return `${numStr}${amt.unit}`;
    }
    return amt.raw;
  });
  
  return parts.join(' + ');
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
