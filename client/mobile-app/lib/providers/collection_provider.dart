import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/mock_data.dart';
import '../models/ingredient.dart';
import '../models/recipe.dart';
import '../models/post.dart';
import '../models/notification_item.dart';

final ingredientListProvider = Provider<List<Ingredient>>((ref) => mockIngredients);

final savedRecipesProvider = Provider<List<Recipe>>((ref) => mockSavedRecipes);

final savedPostsProvider = Provider<List<Post>>((ref) => mockSavedPosts);

final notificationListProvider = Provider<List<NotificationItem>>((ref) => mockNotifications);
