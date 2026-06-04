import 'api_helpers.dart';
import 'http_client.dart';

class ContentApi {
  final _dio = HttpClient.instance;

  Future<List<Map<String, dynamic>>> getBanners() {
    return guardApi(() async {
      final response = await _dio.get('/content/banners');
      return responseList(response).map(mapValue).toList();
    });
  }

  Future<List<Map<String, dynamic>>> getAnnouncements() {
    return guardApi(() async {
      final response = await _dio.get('/content/announcements');
      return responseList(response).map(mapValue).toList();
    });
  }
}
