// 统一的类型定义文件

export interface Recipe {
  id: string;
  name: string;
  /** 别名列表，搜索时也匹配这些名称 */
  aliases?: string[];
  coverImage: string;
  description: string;
  ingredients: string[];
  mealTimes: string[];
  dishTypes: string[];
  timeCost: number | null;
  difficulty: 'easy' | 'normal' | 'hard';
  /** 真实烹饪步骤（优于从 description 拆分） */
  steps?: string[];
  /** 食材用量 key:食材名, value:用量（如 "250g"、"2勺"） */
  usage?: Record<string, string>;
  /** 营养信息（用于健身版菜品） */
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  /** 健身餐专属标记 */
  fitnessMeal?: boolean;
  fitnessCategory?: string;
  goal?: string;
  /** 儿童餐专属标记 */
  childrenMeal?: boolean;
  ageBand?: string;
  macros?: { protein: number; carb: number; fat: number };
}

export interface IngredientDetail {
  name: string;
  amount: string;
}

export interface RecipeDetail extends Omit<Recipe, 'ingredients'> {
  ingredients: IngredientDetail[];
  steps: string[];
  calories?: string | null;
}

/** 健身餐中的一份食材项 */
export interface FitnessMealItem {
  name: string;
  amount?: string;
}

/** 单个健身餐组合 */
export interface FitnessMeal {
  id: string;
  /** 餐名，如"元气早餐A" */
  name: string;
  /** 餐品描述/亮点 */
  description: string;
  /** 所属目标：lose(减脂) / keep(维持) / gain(增肌) */
  goal: 'lose' | 'keep' | 'gain';
  /** 用餐时段：breakfast / lunch / dinner */
  mealTime: 'breakfast' | 'lunch' | 'dinner';
  /** 食材清单（含可选用量） */
  items: FitnessMealItem[];
  /** 总热量估算（千卡） */
  calories: number;
  /** 蛋白质/碳水/脂肪估算（克） */
  macros: { protein: number; carb: number; fat: number };
  /** 封面图（留空，用户自行 AI 生成） */
  coverImage: string;
  /** 烹饪难度 */
  difficulty: 'easy' | 'normal' | 'hard';
  /** 做法简述 */
  steps: string[];
}

/** 儿童餐：按年龄段推荐（与 FitnessMeal 结构一致，用 ageBand 替代 goal） */
export interface ChildMeal {
  id: string;
  name: string;
  description: string;
  /** 定制页存 toddler/preschool/school；recipes.json 可为 1-2y / 3-6y / 7-12y */
  ageBand: 'toddler' | 'preschool' | 'school' | '1-2y' | '3-6y' | '7-12y';
  /** 旧格式用餐时段 */
  mealTime?: 'breakfast' | 'lunch' | 'dinner';
  /** 新格式用餐时段数组 */
  mealTimes?: string[];
  /** 旧格式食材清单 */
  items?: FitnessMealItem[];
  /** 新格式食材数组 */
  ingredients?: string[];
  /** 新格式食材用量 */
  usage?: Record<string, string>;
  /** 步骤 */
  steps?: string[];
  calories: number;
  macros: { protein: number; carb: number; fat: number };
  coverImage: string;
  difficulty: 'easy' | 'normal' | 'hard';
}

/** 健身餐单品类型 */
export type FitnessDishCategory = 'protein' | 'carb' | 'vegetable' | 'extra';

/** 健身餐单品 */
export interface FitnessDish {
  id: string;
  name: string;
  description: string;
  /** 所属目标：lose(减脂) / keep(维持) / gain(增肌) / all(通用) */
  goal: 'lose' | 'keep' | 'gain' | 'all';
  /** 用法用量（新格式为对象 {食材名: 用量}，旧格式为字符串） */
  usage: string | Record<string, string>;
  /** 列表/卡片展示用（由页面在加载时从 usage 生成，勿直接绑定 usage 对象到 WXML） */
  usageDisplay?: string;
  /** 卡片底部营养特点短句（无具体数值，由健身餐页生成） */
  macroHint?: string;
  /** 简要步骤 */
  steps: string[];
  /** 热量（大卡） */
  calories: number;
  /** 主要营养素数值 */
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  /** 烹饪难度 */
  difficulty: 'easy' | 'normal' | 'hard';
  /** 分类：proteins / carbs / vegetables / soups / salads / cold_dishes / stir_fry */
  fitnessCategory?: string;
  /** 云封面图 */
  coverImage?: string;
  /** 标记为健身餐菜品（来自 recipes.json 转换时使用） */
  fitnessMeal?: boolean;
  /** 用餐时段 */
  mealTimes?: string[];
  /** 食材列表 */
  ingredients?: string[];
  /** 菜品类型标签 */
  dishTypes?: string[];
  /** 耗时（分钟） */
  timeCost?: number;
  /** 营养信息 */
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
}

/** 一顿健身餐的组成：蛋白质 + 碳水 + 蔬菜 + 可选加料 */
export interface FitnessDishSet {
  proteins: FitnessDish[];
  carbs: FitnessDish[];
  vegetables: FitnessDish[];
  extras?: FitnessDish[];
  /** 总热量 */
  totalCalories: number;
  /** 总蛋白质 */
  totalProtein: number;
}

/** 展示用的一顿健身餐 */
export interface FitnessMealDisplay {
  mealTime: 'breakfast' | 'lunch' | 'dinner';
  mealTimeLabel: string;
  dishes: FitnessDish[];
  totalCalories: number;
  totalProtein: number;
  goalBadge: string;
}

// ==================== 收藏夹相关类型 ====================

/**
 * 收藏夹（Collection）
 * 用户可自定义的收藏夹，用于分类管理收藏的菜品
 */
export interface Collection {
  id: string;                    // 收藏夹唯一标识（业务ID）
  userId: string;                // 所属用户ID（openid 或 anonymousId）
  name: string;                  // 收藏夹名称
  coverImage?: string;           // 封面图URL（可选）
  description?: string;          // 简介（可选）
  recipeCount: number;           // 菜品数量（缓存字段）
  isDefault: boolean;            // 是否为默认收藏夹
  sortOrder: number;             // 排序权重（小的在前）
  createdAt: number;             // 创建时间戳
  updatedAt: number;             // 更新时间戳
  // 本地扩展字段（仅本地使用，不存储到云端）
  recipeIds?: string[];          // 本地缓存的菜品ID列表
  synced?: boolean;              // 是否已同步到云端
}

/**
 * 收藏记录（Favorite）
 * 记录某个菜谱属于哪个收藏夹
 */
export interface Favorite {
  _id?: string;                  // 云数据库文档ID（云端字段）
  id?: string;                   // 业务唯一ID（本地生成）
  userId: string;                // 用户ID
  recipeId: string;              // 菜谱ID
  collectionId: string;          // 收藏夹ID
  createdAt: number;             // 收藏时间
  // 本地扩展字段
  synced?: boolean;              // 是否已同步到云端
}

/**
 * 收藏夹创建/编辑参数
 */
export interface CollectionCreateParams {
  name: string;
  coverImage?: string;
  description?: string;
  isDefault?: boolean;
}

/**
 * 收藏夹更新参数
 */
export interface CollectionUpdateParams {
  name?: string;
  coverImage?: string;
  description?: string;
  sortOrder?: number;
}

/**
 * 本地收藏夹数据结构（Storage存储格式）
 */
export interface LocalCollectionsData {
  collections: Collection[];
  activeCollectionId: string;      // 当前选中的收藏夹（用于快速收藏）
  version: number;                 // 数据版本号，用于迁移和冲突处理
  lastSyncTime: number;            // 最后同步时间
}

/**
 * 收藏操作上下文
 */
export interface FavoriteContext {
  recipeId: string;
  recipeName?: string;
  recipeCover?: string;
  currentCollectionId?: string;    // 当前应该进入的收藏夹（从详情页进入时）
}

/**
 * 收藏夹选择器选项
 */
export interface CollectionOption {
  id: string;
  name: string;
  coverImage?: string;
  recipeCount: number;
  isDefault?: boolean;
}

/**
 * 收藏操作结果
 */
export interface FavoriteResult {
  success: boolean;
  added?: boolean;                 // true=添加，false=移除
  collectionId?: string;
  collectionName?: string;
  message?: string;
}
