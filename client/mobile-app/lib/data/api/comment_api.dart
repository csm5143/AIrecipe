import '../../models/comment.dart';
import 'api_helpers.dart';
import 'http_client.dart';

class CommentApi {
  final _dio = HttpClient.instance;

  Future<CommentPageResult> getRecipeComments(
    String recipeId, {
    int page = 1,
    int pageSize = 20,
  }) {
    return guardApi(() async {
      final response = await _dio.get(
        '/wx/app/recipes/$recipeId/comments',
        queryParameters: {'page': page, 'pageSize': pageSize},
      );
      final data = responseMap(response);
      final items =
          (data['items'] is List ? data['items'] : data['list'])
              as List<dynamic>?;
      return CommentPageResult(
        items: (items ?? const [])
            .map((item) => RecipeComment.fromJson(mapValue(item)))
            .toList(),
        total: _intValue(data['total']),
        page: _intValue(data['page'], page),
        pageSize: _intValue(data['pageSize'], pageSize),
      );
    });
  }

  Future<RecipeComment> createComment(String recipeId, String content) {
    return guardApi(() async {
      final response = await _dio.post(
        '/wx/app/recipes/$recipeId/comments',
        data: {'content': content},
      );
      return RecipeComment.fromJson(responseMap(response));
    });
  }

  Future<CommentPageResult> getCommentReplies(
    String commentId, {
    int page = 1,
    int pageSize = 20,
  }) {
    return guardApi(() async {
      final response = await _dio.get(
        '/wx/app/comments/$commentId/replies',
        queryParameters: {'page': page, 'pageSize': pageSize},
      );
      final data = responseMap(response);
      final items =
          (data['items'] is List ? data['items'] : data['list'])
              as List<dynamic>?;
      return CommentPageResult(
        items: (items ?? const [])
            .map((item) => RecipeComment.fromJson(mapValue(item)))
            .toList(),
        total: _intValue(data['total']),
        page: _intValue(data['page'], page),
        pageSize: _intValue(data['pageSize'], pageSize),
      );
    });
  }

  Future<RecipeComment> replyComment(String commentId, String content) {
    return guardApi(() async {
      final response = await _dio.post(
        '/wx/app/comments/$commentId/reply',
        data: {'content': content},
      );
      return RecipeComment.fromJson(responseMap(response));
    });
  }

  Future<void> deleteComment(String commentId) {
    return guardApi(() async {
      await _dio.delete('/wx/app/comments/$commentId');
    });
  }

  Future<({bool liked, int likeCount})> toggleLike(String commentId) {
    return guardApi(() async {
      final response = await _dio.post('/wx/app/comments/$commentId/like');
      final data = responseMap(response);
      return (
        liked: data['liked'] == true,
        likeCount: _intValue(data['likeCount']),
      );
    });
  }
}

int _intValue(dynamic value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}
