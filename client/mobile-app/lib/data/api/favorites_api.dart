import '../../models/recipe.dart';
import 'api_helpers.dart';
import 'http_client.dart';

class FavoritesApi {
  final _dio = HttpClient.instance;

  Future<List<Recipe>> getLikedRecipes({int page = 1, int pageSize = 20}) {
    return guardApi(() async {
      final response = await _dio.get(
        '/wx/app/favorites',
        queryParameters: {'page': page, 'pageSize': pageSize},
      );
      return responseList(
        response,
      ).map((item) => Recipe.fromJson(mapValue(item))).toList();
    });
  }
}
