// 食谱类型
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE' | 'DELETED';

export interface Nutrition {
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  sodium?: number;
}

export interface RecipeIngredient {
  id?: number;
  name: string;
  amount: string;
  unit?: string;
  isOptional?: boolean;
}

export interface RecipeStep {
  order: number;
  content: string;
  image?: string;
  duration?: number;
}

export interface Recipe {
  id: number;
  title: string;
  coverImage?: string;
  description?: string;
  difficulty: Difficulty;
  cookingTime?: number;
  servings?: number;
  calories?: number;
  tags?: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tips?: string;
  nutrition?: Nutrition;
  cuisine?: string;
  category?: string;
  isAiGenerated: boolean;
  viewCount: number;
  collectCount: number;
  shareCount: number;
  status: ContentStatus;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 食材类型
export interface Ingredient {
  id: number;
  name: string;
  alias?: string;
  coverImage?: string;
  category?: string;
  unit?: string;
  calories?: number;
  nutrition?: Record<string, number>;
  tags?: string[];
  status: ContentStatus;
  createdAt: string;
}

// 收藏类型
export interface Collection {
  id: number;
  userId: number;
  name: string;
  description?: string;
  coverImage?: string;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}
