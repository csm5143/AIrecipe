import '../../models/post.dart';
import '../../models/recipe.dart';
import 'api_helpers.dart';
import 'http_client.dart';

class FeedPage {
  final List<Object> items;
  final int total;
  final int page;
  final int pageSize;

  const FeedPage({
    required this.items,
    required this.total,
    required this.page,
    required this.pageSize,
  });

  bool get hasMore => page * pageSize < total;
}

class FeedApi {
  final _dio = HttpClient.instance;

  Future<FeedPage> getFollowingFeed({int page = 1, int pageSize = 20}) {
    return guardApi(() async {
      final response = await _dio.get(
        '/wx/app/following-feed',
        queryParameters: {'page': page, 'pageSize': pageSize},
      );
      return _pageFromResponse(response.data);
    });
  }

  Future<FeedPage> getHotRecipes({int page = 1, int pageSize = 20}) {
    return guardApi(() async {
      final response = await _dio.get(
        '/app/recipes',
        queryParameters: {
          'isHot': 1,
          'sort': 'viewCount',
          'page': page,
          'pageSize': pageSize,
        },
      );
      final data = responseData(response);
      final items = responseList(
        response,
      ).map((item) => Recipe.fromJson(mapValue(item))).toList();
      return FeedPage(
        items: items,
        total: _intValue(data is Map ? data['total'] : null, items.length),
        page: _intValue(data is Map ? data['page'] : null, page),
        pageSize: _intValue(data is Map ? data['pageSize'] : null, pageSize),
      );
    });
  }

  Future<FeedPage> getCategoryRecipes(
    String category, {
    int page = 1,
    int pageSize = 20,
  }) {
    return guardApi(() async {
      final response = await _dio.get(
        '/app/recipes',
        queryParameters: {
          'category': category,
          'page': page,
          'pageSize': pageSize,
        },
      );
      final data = responseData(response);
      final items = responseList(
        response,
      ).map((item) => Recipe.fromJson(mapValue(item))).toList();
      return FeedPage(
        items: items,
        total: _intValue(data is Map ? data['total'] : null, items.length),
        page: _intValue(data is Map ? data['page'] : null, page),
        pageSize: _intValue(data is Map ? data['pageSize'] : null, pageSize),
      );
    });
  }

  Future<FeedPage> getLocalFeed({
    String? location,
    int page = 1,
    int pageSize = 20,
  }) {
    return guardApi(() async {
      final response = await _dio.get(
        '/app/recipes',
        queryParameters: {
          if (location != null && location.isNotEmpty) 'location': location,
          'page': page,
          'pageSize': pageSize,
        },
      );
      final data = responseData(response);
      final items = responseList(
        response,
      ).map((item) => Recipe.fromJson(mapValue(item))).toList();
      return FeedPage(
        items: items,
        total: _intValue(data is Map ? data['total'] : null, items.length),
        page: _intValue(data is Map ? data['page'] : null, page),
        pageSize: _intValue(data is Map ? data['pageSize'] : null, pageSize),
      );
    });
  }

  FeedPage _pageFromResponse(dynamic raw) {
    final data = raw is Map && raw.containsKey('data') ? raw['data'] : raw;
    final map = mapValue(data);
    final rawItems = map['items'] is List
        ? map['items'] as List
        : map['list'] is List
        ? map['list'] as List
        : const <dynamic>[];

    return FeedPage(
      items: rawItems.map(_feedItemFromJson).whereType<Object>().toList(),
      total: _intValue(map['total'], rawItems.length),
      page: _intValue(map['page'], 1),
      pageSize: _intValue(map['pageSize'], 20),
    );
  }

  Object? _feedItemFromJson(dynamic value) {
    final map = mapValue(value);
    final type = (map['type'] ?? '').toString();
    if (type == 'post') return Post.fromJson(map);
    return Recipe.fromJson(map);
  }
}

int _intValue(dynamic value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}
