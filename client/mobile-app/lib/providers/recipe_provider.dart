import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/mock_data.dart';
import '../models/recipe.dart';

final recipeListProvider = Provider<List<Recipe>>((ref) => mockRecipes);

final recipeByIdProvider = Provider.family<Recipe?, String>((ref, id) {
  return mockRecipes.where((r) => r.id == id).firstOrNull;
});
