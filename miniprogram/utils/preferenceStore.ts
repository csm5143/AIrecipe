/**
 * 用户偏好设置存储
 * 管理饮食忌口、饮食模式、口味偏好、食材偏好等设置
 */

const PREFERENCE_KEY = 'userPreference';

/**
 * 饮食忌口选项
 */
export const DIETARY_RESTRICTIONS = [
  { value: 'no_spicy', label: '不吃辣', icon: '🌶️' },
  { value: 'no_coriander', label: '不吃香菜', icon: '🌿' },
  { value: 'no_allium', label: '不吃葱蒜', icon: '🧅' },
  { value: 'seafood_allergy', label: '海鲜过敏', icon: '🦐' },
  { value: 'lactose_intolerance', label: '乳糖不耐', icon: '🥛' },
  { value: 'vegetarian', label: '素食主义', icon: '🥬' },
  { value: 'vegan', label: '纯素主义', icon: '🌱' },
  { value: 'gluten_free', label: '无麸质', icon: '🌾' },
  { value: 'nut_allergy', label: '坚果过敏', icon: '🥜' },
  { value: 'halal', label: '清真饮食', icon: '☪️' },
];

/**
 * 饮食模式选项
 */
export const DIETARY_MODES = [
  { value: 'fat_loss', label: '减脂餐', icon: '💪', desc: '低脂低卡' },
  { value: 'muscle_gain', label: '增肌餐', icon: '🏋️', desc: '高蛋白' },
  { value: 'light', label: '清淡饮食', icon: '🥗', desc: '少油少盐' },
  { value: 'home_cooking', label: '家常菜', icon: '🏠', desc: '简单易做' },
  { value: 'quick_meal', label: '快餐速食', icon: '⚡', desc: '省时省力' },
  { value: 'healthy', label: '健康养生', icon: '🍵', desc: '营养均衡' },
  { value: 'high_protein', label: '高蛋白', icon: '🥩', desc: '健身必备' },
  { value: 'low_carb', label: '低碳水', icon: '🍚', desc: '控制碳水' },
];

/**
 * 口味偏好选项
 */
export const TASTE_PREFERENCES = [
  { value: 'spicy_heavy', label: '重辣', icon: '🔥', intensity: 3 },
  { value: 'spicy_mild', label: '微辣', icon: '🌶️', intensity: 2 },
  { value: 'sweet_sour', label: '酸甜', icon: '🍬', intensity: 1 },
  { value: 'savory', label: '咸鲜', icon: '🧂', intensity: 1 },
  { value: 'light', label: '清淡', icon: '💧', intensity: 0 },
  { value: 'rich', label: '浓郁', icon: '🫕', intensity: 2 },
  { value: 'sour', label: '酸爽', icon: '🍋', intensity: 2 },
  { value: 'bitter', label: '苦味', icon: '☕', intensity: 1 },
];

/**
 * 食材偏好选项
 */
export const INGREDIENT_PREFERENCES = [
  { value: 'vegetarian', label: '素食为主', icon: '🥬', desc: '不含肉类' },
  { value: 'meat_lover', label: '肉食主义', icon: '🥩', desc: '无肉不欢' },
  { value: 'no_offal', label: '无内脏', icon: '❌', desc: '不吃动物内脏' },
  { value: 'no_dessert', label: '无甜食', icon: '🍰', desc: '少糖少甜' },
  { value: 'seafood_love', label: '海鲜爱好者', icon: '🦐', desc: '爱吃海鲜' },
  { value: 'chicken_lover', label: '鸡肉控', icon: '🍗', desc: '鸡肉爱好者' },
  { value: 'pork_lover', label: '猪肉控', icon: '🥓', desc: '猪肉爱好者' },
  { value: 'beef_lover', label: '牛肉控', icon: '🥩', desc: '牛肉爱好者' },
  { value: 'egg_lover', label: '蛋奶党', icon: '🥚', desc: '爱吃蛋奶' },
  { value: 'tofu_lover', label: '豆制品控', icon: '🫘', desc: '爱吃豆腐豆制品' },
  { value: 'seafood_no', label: '不吃海鲜', icon: '🚫', desc: '海鲜过敏或不喜' },
  { value: 'poultry_no', label: '不吃禽类', icon: '🦃', desc: '不吃鸡鸭鹅' },
];

/**
 * 菜系偏好选项
 */
export const CUISINE_PREFERENCES = [
  { value: 'sichuan', label: '川菜', icon: '🔥', desc: '麻辣鲜香' },
  { value: 'cantonese', label: '粤菜', icon: '🥮', desc: '清淡鲜美' },
  { value: 'shandong', label: '鲁菜', icon: '🥬', desc: '咸鲜纯正' },
  { value: 'jiangsu', label: '苏菜', icon: '🍵', desc: '清淡平和' },
  { value: 'zhejiang', label: '浙菜', icon: '🍜', desc: '清鲜嫩滑' },
  { value: 'fujian', label: '闽菜', icon: '🦑', desc: '鲜香美味' },
  { value: 'hunan', label: '湘菜', icon: '🌶️', desc: '香辣酸辣' },
  { value: 'anhui', label: '徽菜', icon: '🍲', desc: '鲜嫩醇香' },
  { value: 'japanese', label: '日料', icon: '🍣', desc: '精致清淡' },
  { value: 'korean', label: '韩餐', icon: '🥘', desc: '辣爽可口' },
  { value: 'western', label: '西餐', icon: '🥩', desc: '风味独特' },
  { value: 'fast_food', label: '快餐', icon: '🍔', desc: '方便快捷' },
];

/**
 * 偏好设置接口
 */
export interface UserPreferences {
  // 饮食忌口
  restrictions: string[];
  // 饮食模式（可多选）
  dietModes: string[];
  // 口味偏好（可多选）
  tastePreferences: string[];
  // 食材偏好（可多选）
  ingredientPreferences: string[];
  // 菜系偏好（可多选）
  cuisinePreferences: string[];
  // 更新时间
  updatedAt: number;
}

/**
 * 获取默认偏好设置
 */
export function getDefaultPreferences(): UserPreferences {
  return {
    restrictions: [],
    dietModes: [],
    tastePreferences: [],
    ingredientPreferences: [],
    cuisinePreferences: [],
    updatedAt: Date.now()
  };
}

/**
 * 获取用户偏好设置
 */
export function getPreferences(): UserPreferences {
  try {
    const raw = wx.getStorageSync(PREFERENCE_KEY);
    if (raw) {
      const prefs = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return {
        ...getDefaultPreferences(),
        ...prefs
      };
    }
  } catch (e) {
    console.error('[Preference] 读取偏好设置失败', e);
  }
  return getDefaultPreferences();
}

/**
 * 保存用户偏好设置
 */
export function savePreferences(prefs: Partial<UserPreferences>): void {
  try {
    const current = getPreferences();
    const updated = {
      ...current,
      ...prefs,
      updatedAt: Date.now()
    };
    wx.setStorageSync(PREFERENCE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('[Preference] 保存偏好设置失败', e);
  }
}

/**
 * 更新饮食忌口
 */
export function setRestrictions(restrictions: string[]): void {
  savePreferences({ restrictions });
}

/**
 * 更新饮食模式
 */
export function setDietModes(dietModes: string[]): void {
  savePreferences({ dietModes });
}

/**
 * 更新口味偏好
 */
export function setTastePreferences(tastePreferences: string[]): void {
  savePreferences({ tastePreferences });
}

/**
 * 更新食材偏好
 */
export function setIngredientPreferences(ingredientPreferences: string[]): void {
  savePreferences({ ingredientPreferences });
}

/**
 * 更新菜系偏好
 */
export function setCuisinePreferences(cuisinePreferences: string[]): void {
  savePreferences({ cuisinePreferences });
}

/**
 * 切换单个忌口
 */
export function toggleRestriction(value: string): void {
  const prefs = getPreferences();
  const idx = prefs.restrictions.indexOf(value);
  if (idx > -1) {
    prefs.restrictions.splice(idx, 1);
  } else {
    prefs.restrictions.push(value);
  }
  savePreferences({ restrictions: prefs.restrictions });
}

/**
 * 切换单个饮食模式
 */
export function toggleDietMode(value: string): void {
  const prefs = getPreferences();
  const idx = prefs.dietModes.indexOf(value);
  if (idx > -1) {
    prefs.dietModes.splice(idx, 1);
  } else {
    prefs.dietModes.push(value);
  }
  savePreferences({ dietModes: prefs.dietModes });
}

/**
 * 切换单个口味偏好
 */
export function toggleTastePreference(value: string): void {
  const prefs = getPreferences();
  const idx = prefs.tastePreferences.indexOf(value);
  if (idx > -1) {
    prefs.tastePreferences.splice(idx, 1);
  } else {
    prefs.tastePreferences.push(value);
  }
  savePreferences({ tastePreferences: prefs.tastePreferences });
}

/**
 * 切换单个食材偏好
 */
export function toggleIngredientPreference(value: string): void {
  const prefs = getPreferences();
  const idx = prefs.ingredientPreferences.indexOf(value);
  if (idx > -1) {
    prefs.ingredientPreferences.splice(idx, 1);
  } else {
    prefs.ingredientPreferences.push(value);
  }
  savePreferences({ ingredientPreferences: prefs.ingredientPreferences });
}

/**
 * 切换单个菜系偏好
 */
export function toggleCuisinePreference(value: string): void {
  const prefs = getPreferences();
  const idx = prefs.cuisinePreferences.indexOf(value);
  if (idx > -1) {
    prefs.cuisinePreferences.splice(idx, 1);
  } else {
    prefs.cuisinePreferences.push(value);
  }
  savePreferences({ cuisinePreferences: prefs.cuisinePreferences });
}

/**
 * 检查是否有任何偏好设置
 */
export function hasAnyPreferences(): boolean {
  const prefs = getPreferences();
  return (
    prefs.restrictions.length > 0 ||
    prefs.dietModes.length > 0 ||
    prefs.tastePreferences.length > 0 ||
    prefs.ingredientPreferences.length > 0 ||
    prefs.cuisinePreferences.length > 0
  );
}

/**
 * 获取偏好设置统计
 */
export function getPreferenceStats(): {
  restrictions: number;
  dietModes: number;
  tastePreferences: number;
  ingredientPreferences: number;
  cuisinePreferences: number;
  total: number;
} {
  const prefs = getPreferences();
  const stats = {
    restrictions: prefs.restrictions.length,
    dietModes: prefs.dietModes.length,
    tastePreferences: prefs.tastePreferences.length,
    ingredientPreferences: prefs.ingredientPreferences.length,
    cuisinePreferences: prefs.cuisinePreferences.length,
    total: 0
  };
  stats.total = stats.restrictions + stats.dietModes + stats.tastePreferences + 
                stats.ingredientPreferences + stats.cuisinePreferences;
  return stats;
}

/**
 * 获取忌口标签列表（用于菜谱筛选）
 */
export function getRestrictionLabels(): string[] {
  const prefs = getPreferences();
  return prefs.restrictions.map(v => {
    const item = DIETARY_RESTRICTIONS.find(r => r.value === v);
    return item ? item.label : v;
  });
}

/**
 * 重置所有偏好设置
 */
export function resetPreferences(): void {
  try {
    wx.removeStorageSync(PREFERENCE_KEY);
  } catch (e) {
    console.error('[Preference] 重置偏好设置失败', e);
  }
}
