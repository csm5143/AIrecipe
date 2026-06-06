import '../../models/recipe.dart';
import 'api_helpers.dart';
import 'http_client.dart';

class RecipeApi {
  final _dio = HttpClient.instance;

  Future<List<Recipe>> getRecipes({
    int page = 1,
    String? filter,
    String? keyword,
    String? category,
    String? authorId,
  }) {
    return guardApi(() async {
      final response = await _dio.get(
        '/app/recipes',
        queryParameters: {
          'page': page,
          'pageSize': 20,
          if (filter != null && filter.isNotEmpty) 'filter': filter,
          if (keyword != null && keyword.isNotEmpty) 'keyword': keyword,
          if (category != null && category.isNotEmpty) 'category': category,
          if (authorId != null && authorId.isNotEmpty) 'authorId': authorId,
        },
      );
      return responseList(
        response,
      ).map((item) => Recipe.fromJson(mapValue(item))).toList();
    });
  }

  Future<Recipe> getRecipeById(String id) {
    return guardApi(() async {
      final response = await _dio.get('/app/recipes/$id');
      return Recipe.fromJson(responseMap(response));
    });
  }

  Future<List<Recipe>> getBrowseHistory() {
    return guardApi(() async {
      final response = await _dio.get('/wx/app/browse-history');
      return responseList(response).map((item) {
        final row = mapValue(item);
        final recipe = mapValue(row['recipe']);
        return Recipe.fromJson({...recipe, 'updatedAt': row['viewedAt']});
      }).toList();
    });
  }

  Future<void> recordBrowseHistory(String recipeId) {
    return guardApi(() async {
      await _dio.post(
        '/wx/app/browse-history',
        data: {'recipeId': recipeId, 'source': 'app'},
      );
    });
  }

  Future<Recipe> createRecipe(Map<String, dynamic> data) {
    return guardApi(() async {
      final response = await _dio.post('/recipes', data: data);
      return Recipe.fromJson(responseMap(response));
    });
  }

  Future<List<Recipe>> getMyRecipes() {
    return guardApi(() async {
      final response = await _dio.get('/user-recipes/my');
      return responseList(
        response,
      ).map((item) => Recipe.fromJson(mapValue(item))).toList();
    });
  }

  Future<String> submitUserRecipe(Map<String, dynamic> data) {
    return guardApi(() async {
      final response = await _dio.post('/user-recipes', data: data);
      final body = responseMap(response);
      return (body['recipeId'] ?? body['id'] ?? '').toString();
    });
  }

  Future<Recipe> updateUserRecipe(String id, Map<String, dynamic> data) {
    return guardApi(() async {
      final response = await _dio.put('/user-recipes/$id', data: data);
      return Recipe.fromJson(responseMap(response));
    });
  }

  Future<Recipe> updateRecipe(String id, Map<String, dynamic> data) {
    return guardApi(() async {
      final response = await _dio.put('/recipes/$id', data: data);
      return Recipe.fromJson(responseMap(response));
    });
  }

  Future<void> deleteRecipe(String id) {
    return guardApi(() async {
      await _dio.delete('/recipes/$id');
    });
  }

  /// 点赞/取消点赞（toggle）
  Future<Map<String, dynamic>> toggleLike(String id) {
    return guardApi(() async {
      final response = await _dio.post('/user-recipes/$id/like');
      return responseMap(response);
    });
  }
}
