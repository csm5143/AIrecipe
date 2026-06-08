import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../models/recipe.dart';
import '../../providers/api_providers.dart';
import '../../providers/recipe_provider.dart';
import '../../widgets/capsule_toast.dart';

class HistoryPage extends ConsumerWidget {
  const HistoryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(browseHistoryProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.of(context).canPop()
              ? context.pop()
              : context.go('/mine'),
        ),
        title: const Text('浏览历史'),
        actions: [
          TextButton(
            onPressed: historyAsync.valueOrNull?.isEmpty == false
                ? () => _confirmClear(context, ref)
                : null,
            child: const Text('清空'),
          ),
        ],
      ),
      body: historyAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => _HistoryMessage(
          icon: Icons.cloud_off,
          title: '加载失败',
          message: error.toString(),
        ),
        data: (recipes) {
          if (recipes.isEmpty) {
            return const _HistoryMessage(
              icon: Icons.history,
              title: '暂无浏览记录',
              message: '你浏览过的菜谱会同步显示在这里。',
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(browseHistoryProvider.future),
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
              itemCount: recipes.length,
              itemBuilder: (context, index) => _HistoryCard(
                recipe: recipes[index],
                onTap: () => context.push('/recipe/${recipes[index].id}'),
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _confirmClear(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('清空浏览历史'),
        content: const Text('确认清空全部浏览记录吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('清空'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;
    try {
      await ref.read(collectionApiProvider).clearBrowseHistory();
      ref.invalidate(browseHistoryProvider);
      if (context.mounted) {
        showCapsuleToast(context, '浏览历史已清空', icon: Icons.delete_outline);
      }
    } catch (error) {
      if (context.mounted) {
        showCapsuleToast(context, error.toString(), icon: Icons.error_outline);
      }
    }
  }
}

class _HistoryCard extends StatelessWidget {
  final Recipe recipe;
  final VoidCallback onTap;

  const _HistoryCard({required this.recipe, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          boxShadow: const [
            BoxShadow(color: Color(0x0A000000), blurRadius: 24),
          ],
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: SizedBox(
                width: 72,
                height: 72,
                child: CachedNetworkImage(
                  imageUrl: recipe.coverImage,
                  fit: BoxFit.cover,
                  errorWidget: (_, _, _) => Container(
                    color: AppColors.surfaceSecondary,
                    child: const Icon(
                      Icons.restaurant,
                      color: AppColors.textPlaceholder,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    recipe.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(
                        Icons.schedule,
                        size: 14,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _timeText(recipe.updatedAt),
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }

  String _timeText(DateTime? value) {
    if (value == null) return '最近浏览';
    return '${value.year}/${value.month}/${value.day}';
  }
}

class _HistoryMessage extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;

  const _HistoryMessage({
    required this.icon,
    required this.title,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 42, color: AppColors.textPlaceholder),
            const SizedBox(height: 12),
            Text(title, style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
