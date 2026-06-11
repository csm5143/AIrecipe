import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';

import 'api_helpers.dart';
import 'http_client.dart';

class UploadApi {
  final _dio = HttpClient.instance;

  Future<FormData> _imageFormData(
    XFile file, {
    String? folder,
    Map<String, dynamic>? fields,
  }) async {
    final bytes = await file.readAsBytes();
    final fileName = file.name.isNotEmpty ? file.name : 'image.jpg';
    final formFields = <String, dynamic>{
      'file': MultipartFile.fromBytes(bytes, filename: fileName),
    };
    if (folder != null) formFields['folder'] = folder;
    if (fields != null) {
      fields.forEach((key, value) {
        if (value != null && value.toString().trim().isNotEmpty) {
          formFields[key] = value.toString();
        }
      });
    }
    return FormData.fromMap(formFields);
  }

  Future<String> uploadImage(XFile file, {String folder = 'tmp'}) {
    return guardApi(() async {
      final formData = await _imageFormData(file, folder: folder);
      final response = await _dio.post('/upload/scan', data: formData);
      final body = responseMap(response);
      return (body['url'] ?? body['path'] ?? '').toString();
    });
  }

  Future<String> uploadUserRecipeImage(
    XFile file, {
    String purpose = 'image',
    String? title,
    int? stepIndex,
  }) {
    return guardApi(() async {
      final formData = await _imageFormData(
        file,
        fields: {
          'purpose': purpose,
          'title': title,
          'stepIndex': stepIndex,
        },
      );
      final response = await _dio.post(
        '/upload/user-recipe-image',
        data: formData,
      );
      final body = responseMap(response);
      return (body['url'] ?? body['path'] ?? '').toString();
    });
  }

  Future<String> uploadPostImage(
    XFile file, {
    String? title,
    int? imageIndex,
  }) {
    return guardApi(() async {
      final formData = await _imageFormData(
        file,
        fields: {
          'title': title,
          'imageIndex': imageIndex,
        },
      );
      final response = await _dio.post('/upload/post-image', data: formData);
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
