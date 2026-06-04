import '../../models/post.dart';
import 'api_helpers.dart';
import 'http_client.dart';

class PostApi {
  final _dio = HttpClient.instance;

  Future<List<Post>> getPosts({int page = 1}) {
    return guardApi(() async {
      final response = await _dio.get(
        '/posts',
        queryParameters: {'page': page},
      );
      return responseList(
        response,
      ).map((item) => Post.fromJson(mapValue(item))).toList();
    });
  }

  Future<Post> getPostById(String id) {
    return guardApi(() async {
      final response = await _dio.get('/posts/$id');
      return Post.fromJson(responseMap(response));
    });
  }

  Future<Post> createPost(Map<String, dynamic> data) {
    return guardApi(() async {
      final response = await _dio.post('/posts', data: data);
      return Post.fromJson(responseMap(response));
    });
  }

  Future<void> deletePost(String id) {
    return guardApi(() async {
      await _dio.delete('/posts/$id');
    });
  }

  Future<Post> likePost(String id) {
    return guardApi(() async {
      final response = await _dio.post('/posts/$id/like');
      return Post.fromJson(responseMap(response));
    });
  }
}
