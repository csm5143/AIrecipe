import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/api/index.dart';

final authApiProvider = Provider<AuthApi>((ref) => AuthApi());

final recipeApiProvider = Provider<RecipeApi>((ref) => RecipeApi());

final postApiProvider = Provider<PostApi>((ref) => PostApi());

final aiApiProvider = Provider<AiApi>((ref) => AiApi());

final collectionApiProvider = Provider<CollectionApi>((ref) => CollectionApi());

final ingredientApiProvider = Provider<IngredientApi>((ref) => IngredientApi());

final contentApiProvider = Provider<ContentApi>((ref) => ContentApi());

final userApiProvider = Provider<UserApi>((ref) => UserApi());

final feedbackApiProvider = Provider<FeedbackApi>((ref) => FeedbackApi());

final favoritesApiProvider = Provider<FavoritesApi>((ref) => FavoritesApi());

final uploadApiProvider = Provider<UploadApi>((ref) => UploadApi());

final notificationApiProvider = Provider<NotificationApi>(
  (ref) => NotificationApi(),
);
