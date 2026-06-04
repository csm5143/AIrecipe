import '../../models/recipe.dart';
import 'api_helpers.dart';
import 'http_client.dart';

class RecipeApi {
  final _dio = HttpClient.instance;

  Future<List<Recipe>> getRecipes({
    int page = 1,
    String? filter,
    String? keyword,
  }) {
    return guardApi(() async {
      final response = await _dio.get(
        '/recipes',
        queryParameters: {
          'page': page,
          if (filter != null && filter.isNotEmpty) 'filter': filter,
          if (keyword != null && keyword.isNotEmpty) 'keyword': keyword,
        },
      );
      return responseList(
        response,
      ).map((item) => Recipe.fromJson(mapValue(item))).toList();
    });
  }

  Future<Recipe> getRecipeById(String id) {
    return guardApi(() async {
      final response = await _dio.get('/recipes/$id');
      return Recipe.fromJson(responseMap(response));
    });
  }

  Future<Recipe> createRecipe(Map<String, dynamic> data) {
    return guardApi(() async {
      final response = await _dio.post('/recipes', data: data);
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

  Future<Recipe> likeRecipe(String id) {
    return guardApi(() async {
      final response = await _dio.post('/recipes/$id/like');
      return Recipe.fromJson(responseMap(response));
    });
  }

  Future<Recipe> unlikeRecipe(String id) {
    return guardApi(() async {
      final response = await _dio.delete('/recipes/$id/like');
      return Recipe.fromJson(responseMap(response));
    });
  }
}
