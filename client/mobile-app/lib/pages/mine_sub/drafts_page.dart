import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../models/recipe.dart';
import '../../providers/recipe_provider.dart';

class DraftsPage extends ConsumerWidget {
  const DraftsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recipesAsync = ref.watch(myRecipeListProvider);

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
        title: const Text('草稿箱'),
      ),
      body: recipesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => _DraftMessage(
          icon: Icons.cloud_off,
          title: '加载失败',
          message: error.toString(),
        ),
        data: (recipes) {
          if (recipes.isEmpty) {
            return const _DraftMessage(
              icon: Icons.edit_document,
              title: '还没有草稿',
              message: '上传或保存过的用户菜谱会出现在这里。',
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(myRecipeListProvider.future),
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
              itemCount: recipes.length,
              itemBuilder: (context, index) => _DraftCard(
                recipe: recipes[index],
                onTap: () =>
                    context.push('/publish/recipe', extra: recipes[index]),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _DraftCard extends StatelessWidget {
  final Recipe recipe;
  final VoidCallback onTap;

  const _DraftCard({required this.recipe, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)],
      ),
      child: Row(
        children: [
          Container(
            width: 84,
            height: 84,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: AppColors.surfaceSecondary,
            ),
            clipBehavior: Clip.antiAlias,
            child: recipe.coverImage.isEmpty
                ? const Icon(
                    Icons.edit_document,
                    size: 36,
                    color: AppColors.textPlaceholder,
                  )
                : Image.network(recipe.coverImage, fit: BoxFit.cover),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  recipe.title.isEmpty ? '未命名菜谱' : recipe.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _MetaChip(icon: Icons.schedule, label: _timeText(recipe)),
                    _MetaChip(
                      icon: Icons.fact_check_outlined,
                      label: _statusText(recipe.status),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          FilledButton(
            onPressed: onTap,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.textPrimary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
            child: const Text('继续编辑', style: TextStyle(fontSize: 13)),
          ),
        ],
      ),
    );
  }

  String _timeText(Recipe recipe) {
    final date = recipe.updatedAt;
    if (date == null) return '最近编辑';
    return '${date.year}/${date.month}/${date.day}';
  }

  String _statusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return '待审核';
      case 'published':
        return '已发布';
      case 'rejected':
        return '需修改';
      case 'draft':
        return '草稿';
      default:
        return status.isEmpty ? '草稿' : status;
    }
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _MetaChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

class _DraftMessage extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;

  const _DraftMessage({
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
