export interface AppRecipe {
  id: number;
  name: string;
  coverImage: string;
  description: string;
  ingredients: string[];
  usage: Record<string, string>;
  steps: Array<{ stepNumber: number; description: string; imageUrl: string }>;
  difficulty: 'easy' | 'normal' | 'hard';
  timeCost: number | null;
  calories: number | null;
  nutrition: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  } | null;
  cuisine: string | null;
  category: string | null;
  mealTimes: string[];
  dishTypes: string[];
  fitnessMeal: boolean;
  fitnessCategory: string | null;
  goal: string | null;
  childrenMeal: boolean;
  ageBand: string | null;
  tags: string[];
  isFeatured: boolean;
  viewCount: number;
  collectCount: number;
}

function safeJsonParse(v: string): any[] {
  try { const parsed = JSON.parse(v); return Array.isArray(parsed) ? parsed : []; }
  catch { return []; }
}

export function mapDifficulty(difficulty: string): 'easy' | 'normal' | 'hard' {
  switch (difficulty?.toUpperCase()) {
    case 'EASY':
      return 'easy';
    case 'HARD':
      return 'hard';
    default:
      return 'normal';
  }
}

export function mapRecipeToAppFormat(recipe: any): AppRecipe {
  const rawIngredients: any[] = Array.isArray(recipe.ingredients) ? recipe.ingredients
    : (typeof recipe.ingredients === 'string' ? safeJsonParse(recipe.ingredients) : []);
  const rawSteps: any[] = Array.isArray(recipe.steps) ? recipe.steps
    : (typeof recipe.steps === 'string' ? safeJsonParse(recipe.steps) : []);
  const rawUsage: Record<string, string> = {};

  rawIngredients.forEach((ing: any) => {
    if (typeof ing === 'string') {
      rawUsage[ing] = '';
    } else if (ing.name) {
      const amount = ing.amount || '';
      const unit = ing.unit && ing.unit !== '适量' ? ing.unit : '';
      rawUsage[ing.name] = amount ? (unit ? `${amount}${unit}` : amount) : (unit || '适量');
    }
  });

  const ingredientsList = rawIngredients.map((ing: any) =>
    typeof ing === 'string' ? ing : ing.name || ''
  ).filter(Boolean);

  const mealTimeSet = new Set<string>();
  const dishTypeSet = new Set<string>();
  const tagsSet = new Set<string>();

  if (recipe.tags && Array.isArray(recipe.tags)) {
    recipe.tags.forEach((tag: string) => {
      if (['breakfast', 'lunch', 'dinner', 'late_night'].includes(tag)) {
        mealTimeSet.add(tag);
      } else {
        dishTypeSet.add(tag);
        tagsSet.add(tag);
      }
    });
  }

  const isFitness = tagsSet.has('diet') || recipe.fitnessMeal;
  const isChildren = tagsSet.has('children') || recipe.childrenMeal;

  return {
    id: recipe.id,
    name: recipe.title || recipe.name,
    coverImage: recipe.coverImage || '',
    description: recipe.description || '',
    ingredients: ingredientsList,
    usage: rawUsage,
    steps: rawSteps.map((s: any, index: number) => ({
      stepNumber: (s.order || s.step_number || s.step || index + 1),
      description: typeof s === 'string' ? s : (s.description || s.step || s.content || ''),
      imageUrl: s?.image || s?.image_url || s?.imageUrl || '',
    })).filter((s: any) => s.description),
    difficulty: mapDifficulty(recipe.difficulty),
    timeCost: recipe.cookingTime || recipe.timeCost || null,
    calories: recipe.calories || null,
    nutrition: recipe.nutrition || null,
    cuisine: recipe.cuisine || null,
    category: recipe.category || null,
    mealTimes: Array.from(mealTimeSet),
    dishTypes: Array.from(dishTypeSet),
    fitnessMeal: isFitness,
    fitnessCategory: recipe.fitnessCategory || null,
    goal: recipe.goal || null,
    childrenMeal: isChildren,
    ageBand: recipe.ageBand || null,
    tags: Array.from(tagsSet),
    isFeatured: recipe.isFeatured || false,
    viewCount: recipe.viewCount || 0,
    collectCount: recipe.collectCount || 0,
  };
}
