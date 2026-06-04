import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../widgets/capsule_toast.dart';

class DraftsPage extends StatelessWidget {
  const DraftsPage({super.key});

  @override
  Widget build(BuildContext context) {
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
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        children: [
          _DraftCard(
            title: 'Crispy Pork Belly with Apple Slaw',
            time: '2小时前',
            hasImage: true,
            action: '继续编辑',
          ),
          _DraftCard(
            title: 'Review: The Midnight Diner Experience',
            time: '昨天 23:45',
            hasImage: false,
            action: '编辑',
          ),
          _DraftCard(
            title: 'Sourdough Starter Day 5 Notes',
            time: '2023年10月12日',
            hasImage: true,
            action: '编辑',
          ),
        ],
      ),
    );
  }
}

class _DraftCard extends StatelessWidget {
  final String title, time, action;
  final bool hasImage;
  const _DraftCard({
    required this.title,
    required this.time,
    required this.hasImage,
    required this.action,
  });
  @override
  Widget build(BuildContext c) {
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
            child: hasImage
                ? const Icon(Icons.image, color: AppColors.textPlaceholder)
                : const Icon(
                    Icons.edit_document,
                    size: 36,
                    color: AppColors.textPlaceholder,
                  ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(
                      Icons.schedule,
                      size: 14,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      time,
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
          const SizedBox(width: 8),
          FilledButton(
            onPressed: () =>
                showCapsuleToast(c, '已打开草稿编辑', icon: Icons.edit_document),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.textPrimary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
            child: Text(action, style: const TextStyle(fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
