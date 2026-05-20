import { mapRecipeToAppFormat } from '../recipeMapper';
import { stableQueryKey } from '../appQuery';

describe('mapRecipeToAppFormat', () => {
  it('maps recipe title, ingredients, steps, tags, and difficulty for miniprogram', () => {
    const recipe = {
      id: 12,
      title: '番茄炒蛋',
      coverImage: 'cover.png',
      description: '家常菜',
      ingredients: [{ name: '番茄', amount: '2个' }, { name: '鸡蛋', amount: '3个' }],
      steps: [{ content: '切番茄' }, { content: '炒鸡蛋' }],
      difficulty: 'EASY',
      cookingTime: 15,
      calories: 220,
      nutrition: { protein: 12 },
      cuisine: '家常',
      category: '热菜',
      tags: ['lunch', 'stir_fry', 'children'],
      isFeatured: true,
      viewCount: 3,
      collectCount: 4,
    };

    const result = mapRecipeToAppFormat(recipe as any);

    expect(result).toMatchObject({
      id: 12,
      name: '番茄炒蛋',
      ingredients: ['番茄', '鸡蛋'],
      usage: { 番茄: '2个', 鸡蛋: '3个' },
      steps: ['切番茄', '炒鸡蛋'],
      difficulty: 'easy',
      timeCost: 15,
      mealTimes: ['lunch'],
      dishTypes: ['stir_fry', 'children'],
      childrenMeal: true,
      isFeatured: true,
      viewCount: 3,
      collectCount: 4,
    });
  });
});

describe('stableQueryKey', () => {
  it('sorts query params so equivalent requests share cache keys', () => {
    expect(stableQueryKey({ pageSize: 20, page: 1 })).toBe(stableQueryKey({ page: 1, pageSize: 20 }));
  });
});
