import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../config/glass_theme.dart';
import '../../providers/recipe_provider.dart';
import '../../models/recipe.dart';

/// 菜谱详情页
class RecipeDetailPage extends ConsumerWidget {
  final String recipeId;

  const RecipeDetailPage({super.key, required this.recipeId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recipe = ref.watch(recipeByIdProvider(recipeId));

    if (recipe == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('菜谱详情')),
        body: const Center(child: Text('菜谱未找到')),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              // 封面图
              SliverToBoxAdapter(
                child: Stack(
                  children: [
                    SizedBox(
                      height: 350,
                      width: double.infinity,
                      child: CachedNetworkImage(
                        imageUrl: recipe.coverImage,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Container(color: AppColors.surfaceSecondary),
                      ),
                    ),
                    // 渐变遮罩
                    Positioned(
                      bottom: 0, left: 0, right: 0,
                      child: Container(
                        height: 80,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Color(0x99000000)],
                          ),
                        ),
                      ),
                    ),
                    // 顶部操作按钮
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 8,
                      left: 16, right: 16,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _CircleGlassButton(
                            icon: Icons.arrow_back_ios_new,
                            onTap: () => Navigator.of(context).canPop() ? context.pop() : context.go('/'),
                          ),
                          _CircleGlassButton(
                            icon: Icons.more_horiz,
                            onTap: () {},
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              // 内容区（带圆角，覆盖在图片上）
              SliverToBoxAdapter(
                child: Container(
                  margin: const EdgeInsets.only(top: 0),
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
                  decoration: const BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 标题
                      Text(recipe.title, style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 28)),
                      const SizedBox(height: 20),
                      // 信息卡片（四列）
                      _InfoRow(recipe: recipe),
                      const SizedBox(height: 28),
                      // 食材清单
                      _IngredientsSection(ingredients: recipe.ingredients),
                      const SizedBox(height: 28),
                      // 烹饪步骤
                      _StepsSection(steps: recipe.steps),
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
            ],
          ),
          // 底部操作栏
          Positioned(
            left: 16, right: 16, bottom: 16,
            child: _BottomActionBar(recipe: recipe),
          ),
        ],
      ),
    );
  }
}

class _CircleGlassButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _CircleGlassButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40, height: 40,
        decoration: GlassTheme.glassDecoration(borderRadius: 20),
        child: Icon(icon, size: 20, color: AppColors.textPrimary),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final Recipe recipe;

  const _InfoRow({required this.recipe});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24, offset: Offset(0, 4))],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _InfoItem(icon: Icons.schedule, label: '耗时', value: '${recipe.cookTime}分钟'),
          _InfoItem(icon: Icons.local_fire_department, label: '难度', value: _cnDifficulty(recipe.difficulty)),
          _InfoItem(icon: Icons.kitchen, label: '食材', value: '${recipe.ingredientCount}种'),
          _InfoItem(icon: Icons.bolt, label: '热量', value: '${recipe.calories}卡'),
        ].mapIndexed((i, child) {
          return Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (i > 0) const SizedBox(
                height: 40,
                child: VerticalDivider(color: AppColors.divider, width: 1),
              ),
              child,
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _InfoItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoItem({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 20, color: AppColors.textSecondary),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary, letterSpacing: 0.5)),
        const SizedBox(height: 2),
        Text(value, style: Theme.of(context).textTheme.labelMedium),
      ],
    );
  }
}

class _IngredientsSection extends StatelessWidget {
  final List<IngredientItem> ingredients;

  const _IngredientsSection({required this.ingredients});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('所需食材', style: Theme.of(context).textTheme.headlineMedium),
            Text('2人份', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary)),
          ],
        ),
        const SizedBox(height: 12),
        ...ingredients.map((item) => Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: AppColors.divider)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(item.name, style: Theme.of(context).textTheme.bodyMedium),
              Row(
                children: [
                  Text('${item.amount}${item.unit}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    width: 32, height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.add, size: 18, color: AppColors.textPrimary),
                  ),
                ],
              ),
            ],
          ),
        )),
      ],
    );
  }
}

class _StepsSection extends StatelessWidget {
  final List<CookingStep> steps;

  const _StepsSection({required this.steps});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('烹饪步骤', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 20),
        ...steps.map((step) => Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 28, height: 28,
                decoration: const BoxDecoration(
                  color: AppColors.textPrimary, shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text('${step.stepNumber}',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.surface),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(step.title, style: Theme.of(context).textTheme.labelMedium?.copyWith(fontSize: 15)),
                    const SizedBox(height: 4),
                    Text(step.description, style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary, height: 1.6,
                    )),
                  ],
                ),
              ),
            ],
          ),
        )),
      ],
    );
  }
}

class _BottomActionBar extends StatefulWidget {
  final Recipe recipe;
  const _BottomActionBar({required this.recipe});
  @override
  State<_BottomActionBar> createState() => _BottomActionBarState();
}

class _BottomActionBarState extends State<_BottomActionBar> {
  bool _liked = false, _bookmarked = false;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: GlassTheme.glassDecoration(borderRadius: GlassTheme.navRadius, bgColor: const Color(0xD9FFFFFF)),
      child: Row(children: [
        GestureDetector(
          onTap: () => setState(() => _liked = !_liked),
          child: Container(
            width: 48, height: 48,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
              child: Icon(
                _liked ? Icons.favorite : Icons.favorite_border,
                key: ValueKey(_liked),
                color: _liked ? AppColors.accent : AppColors.textSecondary,
                size: 24,
              ),
            ),
          ),
        ),
        GestureDetector(
          onTap: () => setState(() => _bookmarked = !_bookmarked),
          child: Container(
            width: 48, height: 48,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
              child: Icon(
                _bookmarked ? Icons.bookmark : Icons.bookmark_border,
                key: ValueKey(_bookmarked),
                color: _bookmarked ? AppColors.textPrimary : AppColors.textSecondary,
                size: 24,
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: SizedBox(
            height: 44,
            child: FilledButton(
              onPressed: () {},
              style: FilledButton.styleFrom(backgroundColor: AppColors.textPrimary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
              child: const Text('加入菜篮', style: TextStyle(fontSize: 15)),
            ),
          ),
        ),
      ]),
    );
  }
}

String _cnDifficulty(String d) { switch (d) { case 'Easy': return '简单'; case 'Medium': return '中等'; case 'Hard': return '困难'; default: return d; } }

extension _IndexedMap<T> on Iterable<T> {
  Iterable<E> mapIndexed<E>(E Function(int index, T item) f) {
    var i = 0;
    return map((item) => f(i++, item));
  }
}
