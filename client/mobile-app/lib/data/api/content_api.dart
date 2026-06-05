import '../../models/home_content.dart';
import 'api_helpers.dart';
import 'http_client.dart';

class ContentApi {
  final _dio = HttpClient.instance;

  Future<List<Map<String, dynamic>>> getBanners() {
    return guardApi(() async {
      final response = await _dio.get('/app/content/banners');
      return responseList(response).map(mapValue).toList();
    });
  }

  Future<HomeContent> getHomeData() {
    return guardApi(() async {
      final response = await _dio.get('/app/content/home');
      return HomeContent.fromJson(responseMap(response));
    });
  }

  Future<List<Map<String, dynamic>>> getAnnouncements() {
    return getNotices();
  }

  Future<List<Map<String, dynamic>>> getNotices() {
    return guardApi(() async {
      final response = await _dio.get('/app/content/notices');
      return responseList(response).map(mapValue).toList();
    });
  }
}
