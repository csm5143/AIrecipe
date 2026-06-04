import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../config/theme.dart';
import '../models/post.dart';

/// 瀑布流帖子卡片
class PostCard extends StatelessWidget {
  final Post post;
  final VoidCallback? onTap;

  const PostCard({super.key, required this.post, this.onTap});

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
            // 图片
            AspectRatio(
              aspectRatio: 1,
              child: CachedNetworkImage(
                imageUrl: post.imageUrl,
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
            // 内容
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    post.content,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(
                      context,
                    ).textTheme.bodyLarge?.copyWith(height: 1.4),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      // 头像
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          width: 24,
                          height: 24,
                          color: AppColors.surfaceSecondary,
                          child: post.authorAvatar.isNotEmpty
                              ? CachedNetworkImage(
                                  imageUrl: post.authorAvatar,
                                  fit: BoxFit.cover,
                                  errorWidget: (_, _, _) =>
                                      const Icon(Icons.person, size: 16),
                                )
                              : const Icon(Icons.person, size: 16),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          post.authorName,
                          style: Theme.of(context).textTheme.labelMedium
                              ?.copyWith(color: AppColors.textSecondary),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Icon(
                        Icons.favorite_border,
                        size: 20,
                        color: AppColors.textSecondary,
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
