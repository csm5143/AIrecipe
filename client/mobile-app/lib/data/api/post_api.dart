import '../../models/post.dart';
import 'api_helpers.dart';
import 'http_client.dart';

class PostApi {
  final _dio = HttpClient.instance;

  Future<List<Post>> getPosts({int page = 1}) {
    return guardApi(() async {
      final response = await _dio.get(
        '/user-recipes/community',
        queryParameters: {'page': page, 'pageSize': 20},
      );
      return responseList(
        response,
      ).map((item) => Post.fromJson(mapValue(item))).toList();
    });
  }

  Future<Post> getPostById(String id) {
    return guardApi(() async {
      final response = await _dio.get('/user-recipes/$id');
      return Post.fromJson(responseMap(response));
    });
  }

  Future<Post> createPost(Map<String, dynamic> data) {
    return guardApi(() async {
      final content = (data['content'] ?? '').toString().trim();
      final title = (data['title'] ?? content).toString().trim();
      final imageUrls = data['imageUrls'] is List
          ? List<String>.from(data['imageUrls'] as List)
          : const <String>[];

      final response = await _dio.post(
        '/user-recipes',
        data: {
          'title': title.isEmpty ? '我的美食动态' : title,
          'description': content,
          'coverImage':
              data['imageUrl'] ??
              data['coverImage'] ??
              (imageUrls.isNotEmpty ? imageUrls.first : ''),
          'imageUrls': imageUrls,
          'status': data['status'] ?? 'pending',
          'ingredients': data['ingredients'] ?? const [],
          'steps': data['steps'] ?? const [],
        },
      );
      final body = responseMap(response);
      final id = (body['recipeId'] ?? body['id'] ?? '').toString();
      return getPostById(id);
    });
  }

  Future<void> deletePost(String id) {
    return guardApi(() async {
      await _dio.delete('/user-recipes/$id');
    });
  }

  Future<Post> likePost(String id) {
    return guardApi(() async {
      await _dio.post('/user-recipes/$id/like');
      return getPostById(id);
    });
  }
}
