import 'recipe.dart';

class HomeContent {
  final List<HomeBanner> banners;
  final List<Recipe> latestRecipes;
  final List<HomeCategory> categories;

  const HomeContent({
    this.banners = const [],
    this.latestRecipes = const [],
    this.categories = const [],
  });

  factory HomeContent.fromJson(Map<String, dynamic> json) {
    return HomeContent(
      banners: _listValue(
        json['banners'],
      ).map((item) => HomeBanner.fromJson(_mapValue(item))).toList(),
      latestRecipes: _listValue(
        json['latestRecipes'] ?? json['latest_recipes'],
      ).map((item) => Recipe.fromJson(_mapValue(item))).toList(),
      categories: _listValue(
        json['categories'],
      ).map((item) => HomeCategory.fromJson(_mapValue(item))).toList(),
    );
  }
}

class HomeBanner {
  final String id;
  final String title;
  final String imageUrl;
  final String linkType;
  final String linkValue;

  const HomeBanner({
    required this.id,
    required this.title,
    this.imageUrl = '',
    this.linkType = '',
    this.linkValue = '',
  });

  factory HomeBanner.fromJson(Map<String, dynamic> json) {
    return HomeBanner(
      id: _stringValue(json['id']),
      title: _stringValue(json['title']),
      imageUrl: _stringValue(json['imageUrl'] ?? json['image_url']),
      linkType: _stringValue(json['linkType'] ?? json['link_type']),
      linkValue: _stringValue(json['linkValue'] ?? json['link_value']),
    );
  }
}

class HomeCategory {
  final String id;
  final String name;
  final int count;

  const HomeCategory({required this.id, required this.name, this.count = 0});

  factory HomeCategory.fromJson(Map<String, dynamic> json) {
    return HomeCategory(
      id: _stringValue(json['id']),
      name: _stringValue(json['name']),
      count: _intValue(json['count']),
    );
  }
}

Map<String, dynamic> _mapValue(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return <String, dynamic>{};
}

List<dynamic> _listValue(dynamic value) {
  if (value is List) return value;
  return const [];
}

String _stringValue(dynamic value, [String fallback = '']) {
  return value?.toString() ?? fallback;
}

int _intValue(dynamic value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}
