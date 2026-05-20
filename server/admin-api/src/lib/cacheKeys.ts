export const cacheKeys = {
  appRecipesList: (queryKey: string) => `app:recipes:list:${queryKey}`,
  appRecipeDetail: (id: number) => `app:recipes:detail:${id}`,
  appRecipesCategories: () => 'app:recipes:categories',
  appRecipesByIngredients: (queryKey: string) => `app:recipes:by-ingredients:${queryKey}`,
  appIngredientsList: (queryKey: string) => `app:ingredients:list:${queryKey}`,
};

export const cachePatterns = {
  appRecipes: 'app:recipes:*',
  appIngredients: 'app:ingredients:*',
};
