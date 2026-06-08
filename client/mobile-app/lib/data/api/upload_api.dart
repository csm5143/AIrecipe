import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';

import 'api_helpers.dart';
import 'http_client.dart';

class UploadApi {
  final _dio = HttpClient.instance;

  Future<FormData> _imageFormData(XFile file, {String? folder}) async {
    final bytes = await file.readAsBytes();
    final fileName = file.name.isNotEmpty ? file.name : 'image.jpg';
    final fields = <String, dynamic>{
      'file': MultipartFile.fromBytes(bytes, filename: fileName),
    };
    if (folder != null) fields['folder'] = folder;
    return FormData.fromMap(fields);
  }

  Future<String> uploadImage(XFile file, {String folder = 'tmp'}) {
    return guardApi(() async {
      final formData = await _imageFormData(file, folder: folder);
      final response = await _dio.post('/upload/scan', data: formData);
      final body = responseMap(response);
      return (body['url'] ?? body['path'] ?? '').toString();
    });
  }

  Future<String> uploadUserRecipeImage(XFile file) {
    return guardApi(() async {
      final formData = await _imageFormData(file);
      final response = await _dio.post(
        '/upload/user-recipe-image',
        data: formData,
      );
      final body = responseMap(response);
      return (body['url'] ?? body['path'] ?? '').toString();
    });
  }

  Future<String> uploadAvatar(XFile file) {
    return guardApi(() async {
      final formData = await _imageFormData(file);
      final response = await _dio.post('/upload/wx-avatar', data: formData);
      final body = responseMap(response);
      return (body['url'] ?? body['path'] ?? '').toString();
    });
  }

  Future<String> uploadChatImage(XFile file) {
    return guardApi(() async {
      final formData = await _imageFormData(file);
      final response = await _dio.post('/upload/chat-image', data: formData);
      final body = responseMap(response);
      return (body['url'] ?? body['path'] ?? '').toString();
    });
  }
}
