class Recipe {
  final String id;
  final String title;
  final String description;
  final String coverImage;
  final String authorName;
  final String authorAvatar;
  final int cookTime; // 分钟
  final String difficulty; // Easy / Medium / Hard
  final int ingredientCount;
  final int calories; // 千卡
  final int servings;
  final double rating;
  final int likes;
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
    this.difficulty = 'Easy',
    this.ingredientCount = 5,
    this.calories = 300,
    this.servings = 2,
    this.rating = 4.5,
    this.likes = 0,
    this.ingredients = const [],
    this.steps = const [],
  });

  factory Recipe.fromJson(Map<String, dynamic> json) {
    final ingredientsJson = _listValue(json['ingredients']);
    final stepsJson = _listValue(json['steps'] ?? json['cooking_steps']);

    return Recipe(
      id: _stringValue(json['id']),
      title: _stringValue(json['title']),
      description: _stringValue(json['description']),
      coverImage: _stringValue(json['cover_image'] ?? json['coverImage']),
      authorName: _stringValue(json['author_name'] ?? json['authorName']),
      authorAvatar: _stringValue(json['author_avatar'] ?? json['authorAvatar']),
      cookTime: _intValue(json['cook_time'] ?? json['cookTime']),
      difficulty: _stringValue(json['difficulty'], 'Easy'),
      ingredientCount: _intValue(
        json['ingredient_count'] ?? json['ingredientCount'],
        ingredientsJson.length,
      ),
      calories: _intValue(json['calories'], 300),
      servings: _intValue(json['servings'], 2),
      rating: _doubleValue(json['rating'], 4.5),
      likes: _intValue(json['likes']),
      ingredients: ingredientsJson
          .whereType<Map>()
          .map(
            (item) => IngredientItem.fromJson(Map<String, dynamic>.from(item)),
          )
          .toList(),
      steps: stepsJson
          .whereType<Map>()
          .map((item) => CookingStep.fromJson(Map<String, dynamic>.from(item)))
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

List<dynamic> _listValue(dynamic value) {
  if (value is List) return value;
  return const [];
}
