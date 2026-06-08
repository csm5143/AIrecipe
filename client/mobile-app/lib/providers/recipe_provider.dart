import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/recipe.dart';
import 'api_providers.dart';

final recipeListProvider =
    StateNotifierProvider<RecipeListNotifier, List<Recipe>>((ref) {
      return RecipeListNotifier(ref)..load();
    });

final recipeByIdProvider = FutureProvider.family<Recipe, String>((
  ref,
  id,
) async {
  final cached = ref.watch(recipeListProvider).where((r) => r.id == id);
  final api = ref.read(recipeApiProvider);
  final recipe = cached.isNotEmpty ? cached.first : await api.getRecipeById(id);
  try {
    await api.recordBrowseHistory(id);
  } catch (_) {
    // Browsing can still work for anonymous or expired sessions.
  }
  return recipe;
});

final recipeSearchProvider = FutureProvider.family<List<Recipe>, String>((
  ref,
  keyword,
) async {
  return ref.read(recipeApiProvider).getRecipes(keyword: keyword);
});

final myRecipeListProvider = FutureProvider<List<Recipe>>((ref) {
  return ref.read(recipeApiProvider).getMyRecipes();
});

final browseHistoryProvider = FutureProvider<List<Recipe>>((ref) {
  return ref.read(recipeApiProvider).getBrowseHistory();
});

final likedRecipesProvider = FutureProvider<List<Recipe>>((ref) {
  return ref.read(favoritesApiProvider).getLikedRecipes();
});

class RecipeListNotifier extends StateNotifier<List<Recipe>> {
  final Ref _ref;
  String? _currentCategory;

  RecipeListNotifier(this._ref) : super(const []);

  Future<void> load({String? keyword, String? category}) async {
    if (keyword == null) {
      _currentCategory = category;
    }
    final recipes = await _ref
        .read(recipeApiProvider)
        .getRecipes(keyword: keyword, category: category);
    state = recipes;
  }

  Future<void> refresh() => load(category: _currentCategory);

  Future<void> filterByCategory(String? category) => load(category: category);
}
