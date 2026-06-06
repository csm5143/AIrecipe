import 'package:dio/dio.dart';
import 'api_helpers.dart';
import 'http_client.dart';

class UploadApi {
  final _dio = HttpClient.instance;

  /// 上传图片（通用），返回 URL
  Future<String> uploadImage(String filePath, {String folder = 'tmp'}) {
    return guardApi(() async {
      final formData = FormData.fromMap({
        'folder': folder,
        'file': await MultipartFile.fromFile(filePath),
      });
      final response = await _dio.post('/upload/scan', data: formData);
      final body = responseMap(response);
      return (body['url'] ?? body['path'] ?? '').toString();
    });
  }

  /// 上传头像（需登录态），返回 URL
  Future<String> uploadAvatar(String filePath) {
    return guardApi(() async {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath),
      });
      final response = await _dio.post('/upload/wx-avatar', data: formData);
      final body = responseMap(response);
      return (body['url'] ?? body['path'] ?? '').toString();
    });
  }
}
