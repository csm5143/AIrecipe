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
}
