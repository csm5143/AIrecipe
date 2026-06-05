import 'api_helpers.dart';
import 'http_client.dart';

class CollectionApi {
  final _dio = HttpClient.instance;

  Future<List<Map<String, dynamic>>> getCollections() {
    return guardApi(() async {
      final response = await _dio.get('/wx/app/my-collections');
      return responseList(response).map(mapValue).toList();
    });
  }

  Future<Map<String, dynamic>> createCollection(String name) {
    return guardApi(() async {
      final response = await _dio.post(
        '/wx/app/collections',
        data: {'name': name},
      );
      return responseMap(response);
    });
  }

  Future<void> addRecipeToDefaultCollection(String recipeId) {
    return guardApi(() async {
      var collections = await getCollections();
      Map<String, dynamic> collection;

      if (collections.isEmpty) {
        collection = await createCollection('默认收藏');
      } else {
        collection = collections.first;
      }

      final collectionId = (collection['id'] ?? '').toString();
      if (collectionId.isEmpty) return;

      await _dio.post(
        '/wx/app/collections/$collectionId/items',
        data: {'recipeId': recipeId},
      );
    });
  }

  Future<Map<String, dynamic>> updateCollection(
    String id,
    Map<String, dynamic> data,
  ) {
    return guardApi(() async {
      final response = await _dio.put('/wx/app/collections/$id', data: data);
      return responseMap(response);
    });
  }

  Future<void> deleteCollection(String id) {
    return guardApi(() async {
      await _dio.delete('/wx/app/collections/$id');
    });
  }

  Future<List<Map<String, dynamic>>> getShoppingLists() {
    return guardApi(() async {
      final response = await _dio.get('/wx/app/shopping-lists');
      return responseList(response).map(mapValue).toList();
    });
  }

  Future<Map<String, dynamic>> saveShoppingList({
    required String name,
    required String recipeId,
    required List<Map<String, dynamic>> items,
  }) {
    return guardApi(() async {
      final response = await _dio.post(
        '/wx/app/shopping-lists',
        data: {'name': name, 'recipeId': recipeId, 'items': items},
      );
      return responseMap(response);
    });
  }

  Future<void> deleteShoppingList(String id) {
    return guardApi(() async {
      await _dio.delete('/wx/app/shopping-lists/$id');
    });
  }
}
