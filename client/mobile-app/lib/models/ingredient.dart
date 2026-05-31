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
}
