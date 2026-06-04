import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../config/theme.dart';
import '../models/recipe.dart';

/// 瀑布流菜谱卡片
class RecipeCard extends StatelessWidget {
  final Recipe recipe;
  final VoidCallback? onTap;

  const RecipeCard({super.key, required this.recipe, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A000000),
              blurRadius: 24,
              offset: Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // 封面图
            AspectRatio(
              aspectRatio: 3 / 4,
              child: CachedNetworkImage(
                imageUrl: recipe.coverImage,
                fit: BoxFit.cover,
                placeholder: (_, _) => Shimmer.fromColors(
                  baseColor: AppColors.surfaceSecondary,
                  highlightColor: AppColors.background,
                  child: Container(color: AppColors.surfaceSecondary),
                ),
                errorWidget: (_, _, _) => Container(
                  color: AppColors.surfaceSecondary,
                  child: const Icon(
                    Icons.broken_image,
                    color: AppColors.textPlaceholder,
                  ),
                ),
              ),
            ),
            // 内容区
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    recipe.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _MetaChip(
                        icon: Icons.schedule,
                        text: '${recipe.cookTime}m',
                      ),
                      const SizedBox(width: 12),
                      _MetaChip(
                        icon: Icons.local_fire_department,
                        text: recipe.difficulty,
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
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String text;

  const _MetaChip({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(
          text,
          style: Theme.of(
            context,
          ).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary),
        ),
      ],
    );
  }
}
