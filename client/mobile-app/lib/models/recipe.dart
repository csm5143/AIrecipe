class Recipe {
  final String id;
  final String title;
  final String description;
  final String coverImage;
  final String authorName;
  final String authorAvatar;
  final int cookTime; // 分钟
  final String difficulty; // 简单 / 中等 / 困难
  final int ingredientCount;
  final int calories; // 千卡
  final int servings;
  final double rating;
  final int likes;
  final String status;
  final DateTime? updatedAt;
  final List<IngredientItem> ingredients;
  final List<CookingStep> steps;

  const Recipe({
    required this.id,
    required this.title,
    this.description = '',
    required this.coverImage,
    this.authorName = '',
    this.authorAvatar = '',
    this.cookTime = 15,
    this.difficulty = '中等',
    this.ingredientCount = 5,
    this.calories = 300,
    this.servings = 2,
    this.rating = 4.5,
    this.likes = 0,
    this.status = '',
    this.updatedAt,
    this.ingredients = const [],
    this.steps = const [],
  });

  factory Recipe.fromJson(Map<String, dynamic> json) {
    final ingredientsJson = _listValue(json['ingredients']);
    final stepsJson = _listValue(json['steps'] ?? json['cooking_steps']);
    final usage = json['usage'] is Map
        ? Map<String, dynamic>.from(json['usage'] as Map)
        : const <String, dynamic>{};

    return Recipe(
      id: _stringValue(json['id']),
      title: _stringValue(json['title'] ?? json['name']),
      description: _stringValue(json['description']),
      coverImage: _stringValue(json['cover_image'] ?? json['coverImage']),
      authorName: _stringValue(json['author_name'] ?? json['authorName']),
      authorAvatar: _stringValue(json['author_avatar'] ?? json['authorAvatar']),
      cookTime: _intValue(
        json['cook_time'] ?? json['cookTime'] ?? json['timeCost'],
      ),
      difficulty: _normalizeDifficulty(
        _stringValue(json['difficulty'], '中等'),
      ),
      ingredientCount: _intValue(
        json['ingredient_count'] ?? json['ingredientCount'],
        ingredientsJson.length,
      ),
      calories: _intValue(json['calories'], 300),
      servings: _intValue(json['servings'], 2),
      rating: _doubleValue(json['rating'], 4.5),
      likes: _intValue(json['likes'] ?? json['collectCount']),
      status: _stringValue(json['status']),
      updatedAt: _dateValue(json['updatedAt'] ?? json['updated_at']),
      ingredients: ingredientsJson
          .map((item) => IngredientItem.fromValue(item, usage))
          .toList(),
      steps: stepsJson
          .asMap()
          .entries
          .map((entry) => CookingStep.fromValue(entry.value, entry.key + 1))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'cover_image': coverImage,
      'author_name': authorName,
      'author_avatar': authorAvatar,
      'cook_time': cookTime,
      'difficulty': difficulty,
      'ingredient_count': ingredientCount,
      'calories': calories,
      'servings': servings,
      'rating': rating,
      'likes': likes,
      'status': status,
      'updated_at': updatedAt?.toIso8601String(),
      'ingredients': ingredients.map((item) => item.toJson()).toList(),
      'steps': steps.map((step) => step.toJson()).toList(),
    };
  }
}

class IngredientItem {
  final String name;
  final String amount;
  final String unit;

  const IngredientItem({
    required this.name,
    required this.amount,
    this.unit = '',
  });

  factory IngredientItem.fromJson(Map<String, dynamic> json) {
    return IngredientItem(
      name: _stringValue(json['name']),
      amount: _stringValue(json['amount']),
      unit: _stringValue(json['unit']),
    );
  }

  factory IngredientItem.fromValue(dynamic value, Map<String, dynamic> usage) {
    if (value is Map) {
      return IngredientItem.fromJson(Map<String, dynamic>.from(value));
    }

    final name = _stringValue(value);
    return IngredientItem(name: name, amount: _stringValue(usage[name]));
  }

  Map<String, dynamic> toJson() {
    return {'name': name, 'amount': amount, 'unit': unit};
  }
}

class CookingStep {
  final int stepNumber;
  final String title;
  final String description;
  final String? imageUrl;

  const CookingStep({
    required this.stepNumber,
    required this.title,
    required this.description,
    this.imageUrl,
  });

  factory CookingStep.fromJson(Map<String, dynamic> json) {
    return CookingStep(
      stepNumber: _intValue(json['step_number'] ?? json['stepNumber'], 1),
      title: _stringValue(json['title']),
      description: _stringValue(json['description']),
      imageUrl: json['image_url']?.toString() ?? json['imageUrl']?.toString(),
    );
  }

  factory CookingStep.fromValue(dynamic value, int index) {
    if (value is Map) {
      return CookingStep.fromJson(Map<String, dynamic>.from(value));
    }

    return CookingStep(
      stepNumber: index,
      title: '步骤 $index',
      description: _stringValue(value),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'step_number': stepNumber,
      'title': title,
      'description': description,
      'image_url': imageUrl,
    };
  }
}

String _stringValue(dynamic value, [String fallback = '']) {
  return value?.toString() ?? fallback;
}

int _intValue(dynamic value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

double _doubleValue(dynamic value, [double fallback = 0]) {
  if (value is double) return value;
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? fallback;
}

DateTime? _dateValue(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is num) return DateTime.fromMillisecondsSinceEpoch(value.toInt());
  return DateTime.tryParse(value.toString());
}

List<dynamic> _listValue(dynamic value) {
  if (value is List) return value;
  return const [];
}

String _normalizeDifficulty(String value) {
  switch (value.toLowerCase()) {
    case 'easy':
    case '简单':
      return '简单';
    case 'hard':
    case '困难':
      return '困难';
    case 'normal':
    case 'medium':
    case '中等':
      return '中等';
    default:
      return value;
  }
}
