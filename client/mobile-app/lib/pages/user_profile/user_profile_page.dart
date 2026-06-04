import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../providers/recipe_provider.dart';
import '../../widgets/capsule_toast.dart';

/// 用户主页
class UserProfilePage extends ConsumerWidget {
  final String userId;
  const UserProfilePage({super.key, required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recipes = ref.watch(recipeListProvider);
    if (recipes.isEmpty) return const SizedBox.shrink();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () =>
              Navigator.of(context).canPop() ? context.pop() : context.go('/'),
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_horiz),
            color: AppColors.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            onSelected: (value) => showCapsuleToast(context, value),
            itemBuilder: (context) => const [
              PopupMenuItem(value: '已复制主页链接', child: Text('分享主页')),
              PopupMenuItem(value: '已收到举报入口', child: Text('举报用户')),
              PopupMenuItem(value: '已加入黑名单', child: Text('拉黑用户')),
            ],
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 20),
            const CircleAvatar(
              radius: 64,
              backgroundColor: AppColors.surfaceSecondary,
              child: Icon(
                Icons.person,
                size: 64,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              '小食家',
              style: Theme.of(
                context,
              ).textTheme.displayLarge?.copyWith(fontSize: 28),
            ),
            const SizedBox(height: 8),
            Text(
              '探索美食的无限可能。AI 食谱创作者，记录每一次完美的味蕾邂逅。',
              textAlign: TextAlign.center,
              maxLines: 3,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 16),
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0x0A000000)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _StatColumn(value: '12.4k', label: '关注者'),
                  _StatColumn(value: '256', label: '关注'),
                  _StatColumn(value: '89', label: '作品'),
                  _StatColumn(value: '4k', label: '收藏'),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Row(
              children: [
                SizedBox(width: 16),
                _ContentTab(text: '作品', isActive: true),
                SizedBox(width: 32),
                _ContentTab(text: '帖子', isActive: false),
                SizedBox(width: 32),
                _ContentTab(text: '收藏', isActive: false),
              ],
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.78,
                ),
                itemCount: recipes.length,
                itemBuilder: (context, index) {
                  final recipe = recipes[index];
                  return GestureDetector(
                    onTap: () => context.push('/recipe/${recipe.id}'),
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: const [
                          BoxShadow(color: Color(0x0A000000), blurRadius: 24),
                        ],
                        border: Border.all(color: const Color(0x0A000000)),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: recipe.coverImage.isNotEmpty
                                ? CachedNetworkImage(
                                    imageUrl: recipe.coverImage,
                                    fit: BoxFit.cover,
                                    width: double.infinity,
                                    errorWidget: (_, _, _) => Container(
                                      color: AppColors.surfaceSecondary,
                                    ),
                                  )
                                : Container(color: AppColors.surfaceSecondary),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  recipe.title,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.schedule,
                                          size: 14,
                                          color: AppColors.textSecondary,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          '${recipe.cookTime}m',
                                          style: Theme.of(context)
                                              .textTheme
                                              .labelSmall
                                              ?.copyWith(
                                                color: AppColors.textSecondary,
                                              ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(width: 12),
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.star,
                                          size: 14,
                                          color: AppColors.textSecondary,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          '${recipe.rating}',
                                          style: Theme.of(context)
                                              .textTheme
                                              .labelSmall
                                              ?.copyWith(
                                                color: AppColors.textSecondary,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }
}

class _StatColumn extends StatelessWidget {
  final String value, label;
  const _StatColumn({required this.value, required this.label});
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

class _ContentTab extends StatelessWidget {
  final String text;
  final bool isActive;
  const _ContentTab({required this.text, required this.isActive});
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          text,
          style: TextStyle(
            fontSize: 15,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
            color: isActive ? AppColors.textPrimary : AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          height: 2,
          width: 24,
          color: isActive ? AppColors.textPrimary : Colors.transparent,
        ),
      ],
    );
  }
}
