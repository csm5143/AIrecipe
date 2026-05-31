import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../config/glass_theme.dart';
import '../../providers/ai_provider.dart';

/// AI 入口页：背景虚化 + 对话历史卡片 + "开始对话" 按钮
class AiEntryPage extends ConsumerWidget {
  const AiEntryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatHistory = ref.watch(chatHistoryProvider);

    return Stack(
      children: [
        // 虚化背景层（模拟首页内容透过）
        Positioned.fill(
          child: ImageFiltered(
            imageFilter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
            child: Container(
              color: AppColors.background,
              child: Center(
                child: Icon(Icons.restaurant, size: 200, color: AppColors.textPrimary.withAlpha(20)),
              ),
            ),
          ),
        ),
        // 暗色遮罩
        Positioned.fill(
          child: Container(color: Colors.black.withAlpha(40)),
        ),
        // 内容
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 顶栏
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    GestureDetector(
                      onTap: () => context.go('/'),
                      child: Container(
                        width: 40, height: 40,
                        decoration: GlassTheme.glassDecoration(borderRadius: 20),
                        child: const Icon(Icons.arrow_back_ios_new, size: 18, color: AppColors.textPrimary),
                      ),
                    ),
                    Text('吃了么 · AI Recipe',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.textPrimary),
                    ),
                    const SizedBox(width: 40),
                  ],
                ),
                const SizedBox(height: 40),
                // 对话历史卡片列表
                Expanded(
                  child: ListView.separated(
                    itemCount: chatHistory.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final item = chatHistory[index];
                      return _ChatHistoryCard(
                        item: item,
                        onTap: () => context.push('/ai/chat'),
                      );
                    },
                  ),
                ),
                // "开始对话" 按钮
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: GestureDetector(
                    onTap: () => context.push('/ai/chat'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: GlassTheme.glassDecoration(borderRadius: GlassTheme.navRadius),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(GlassTheme.navRadius),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.auto_awesome, color: AppColors.textPrimary, size: 24),
                              SizedBox(width: 12),
                              Text('开始对话',
                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ChatHistoryCard extends StatelessWidget {
  final ChatHistoryItem item;
  final VoidCallback onTap;

  const _ChatHistoryCard({required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: GlassTheme.glassDecoration(borderRadius: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(item.title, style: Theme.of(context).textTheme.headlineMedium),
                Text(item.timeAgo, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary)),
              ],
            ),
            const SizedBox(height: 8),
            Text(item.preview, maxLines: 2, overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            ),
            if (item.recipeCount > 0) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.restaurant, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text('已生成 ${item.recipeCount} 个食谱',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
