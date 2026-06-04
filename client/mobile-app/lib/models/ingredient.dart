class Ingredient {
  final String id;
  final String name;
  final String imageUrl;
  final String category; // 冰箱 / 储藏室 / 生鲜 / 调味
  final bool isLow; // 库存不足标记

  const Ingredient({
    required this.id,
    required this.name,
    this.imageUrl = '',
    this.category = '',
    this.isLow = false,
  });

  factory Ingredient.fromJson(Map<String, dynamic> json) {
    return Ingredient(
      id: _stringValue(json['id']),
      name: _stringValue(json['name']),
      imageUrl: _stringValue(json['image_url'] ?? json['imageUrl']),
      category: _stringValue(json['category']),
      isLow: _boolValue(json['is_low'] ?? json['isLow']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'image_url': imageUrl,
      'category': category,
      'is_low': isLow,
    };
  }
}

String _stringValue(dynamic value, [String fallback = '']) {
  return value?.toString() ?? fallback;
}

bool _boolValue(dynamic value, [bool fallback = false]) {
  if (value is bool) return value;
  if (value is num) return value != 0;
  final normalized = value?.toString().toLowerCase();
  if (normalized == 'true') return true;
  if (normalized == 'false') return false;
  return fallback;
}
