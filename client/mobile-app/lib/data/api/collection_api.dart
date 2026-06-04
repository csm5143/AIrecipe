import 'api_helpers.dart';
import 'http_client.dart';

class CollectionApi {
  final _dio = HttpClient.instance;

  Future<List<Map<String, dynamic>>> getCollections() {
    return guardApi(() async {
      final response = await _dio.get('/collections');
      return responseList(response).map(mapValue).toList();
    });
  }

  Future<Map<String, dynamic>> createCollection(String name) {
    return guardApi(() async {
      final response = await _dio.post('/collections', data: {'name': name});
      return responseMap(response);
    });
  }

  Future<Map<String, dynamic>> updateCollection(
    String id,
    Map<String, dynamic> data,
  ) {
    return guardApi(() async {
      final response = await _dio.put('/collections/$id', data: data);
      return responseMap(response);
    });
  }

  Future<void> deleteCollection(String id) {
    return guardApi(() async {
      await _dio.delete('/collections/$id');
    });
  }
}
