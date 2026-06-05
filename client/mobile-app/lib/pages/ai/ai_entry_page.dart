import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../config/glass_theme.dart';
import '../../providers/ai_provider.dart';

class AiEntryPage extends ConsumerWidget {
  const AiEntryPage({super.key});

  static const _quickNeeds = [
    _QuickNeed(Icons.kitchen_outlined, '冰箱配菜'),
    _QuickNeed(Icons.local_fire_department_outlined, '低卡晚餐'),
    _QuickNeed(Icons.child_care_outlined, '儿童餐'),
    _QuickNeed(Icons.timer_outlined, '15分钟快手'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatHistoryAsync = ref.watch(chatHistoryProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _TopBar(onBack: () => context.go('/')),
              const SizedBox(height: 20),
              _AssistantHeader(onStart: () => context.push('/ai/chat')),
              const SizedBox(height: 18),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: _quickNeeds
                    .map(
                      (item) => _QuickNeedChip(
                        item: item,
                        onTap: () =>
                            context.push('/ai/chat', extra: item.label),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '最近对话',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  Text(
                    chatHistoryAsync.maybeWhen(
                      data: (items) => '${items.length} 条',
                      orElse: () => '',
                    ),
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Expanded(
                child: chatHistoryAsync.when(
                  data: (chatHistory) => chatHistory.isEmpty
                      ? const _EmptyHistory()
                      : RefreshIndicator(
                          onRefresh: () =>
                              ref.refresh(chatHistoryProvider.future),
                          child: ListView.separated(
                            itemCount: chatHistory.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final item = chatHistory[index];
                              return _ChatHistoryCard(
                                item: item,
                                onTap: () =>
                                    context.push('/ai/chat?session=${item.id}'),
                              );
                            },
                          ),
                        ),
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (error, _) => _HistoryError(
                    onRetry: () => ref.invalidate(chatHistoryProvider),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              _StartChatButton(onTap: () => context.push('/ai/chat')),
            ],
          ),
        ),
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  final VoidCallback onBack;

  const _TopBar({required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        GestureDetector(
          onTap: onBack,
          child: Container(
            width: 40,
            height: 40,
            decoration: GlassTheme.glassDecoration(borderRadius: 20),
            child: const Icon(Icons.arrow_back_ios_new, size: 18),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            '小厨子',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineMedium,
          ),
        ),
        const SizedBox(width: 52),
      ],
    );
  }
}

class _AssistantHeader extends StatelessWidget {
  final VoidCallback onStart;

  const _AssistantHeader({required this.onStart});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: GlassTheme.glassDecoration(
        borderRadius: 24,
        bgColor: const Color(0xEFFFFFFF),
      ),
      child: Row(
        children: [
          Container(
            width: 68,
            height: 68,
            decoration: BoxDecoration(
              color: AppColors.textPrimary,
              borderRadius: BorderRadius.circular(22),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x22000000),
                  blurRadius: 22,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: const Icon(
              Icons.restaurant_menu,
              color: AppColors.surface,
              size: 32,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '小厨子',
                  style: Theme.of(
                    context,
                  ).textTheme.headlineLarge?.copyWith(fontSize: 26),
                ),
                const SizedBox(height: 6),
                Text(
                  '告诉我食材、口味和人数，我帮你生成今天的做饭方案。',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: onStart,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.surfaceSecondary,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(Icons.chat_bubble_outline, size: 21),
            ),
          ),
        ],
      ),
    );
  }
}

class _StartChatButton extends StatelessWidget {
  final VoidCallback onTap;

  const _StartChatButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 60,
        decoration: BoxDecoration(
          color: AppColors.textPrimary,
          borderRadius: BorderRadius.circular(22),
          boxShadow: const [
            BoxShadow(
              color: Color(0x26000000),
              blurRadius: 28,
              offset: Offset(0, 12),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.auto_awesome, color: AppColors.surface, size: 22),
                SizedBox(width: 10),
                Text(
                  '开始对话',
                  style: TextStyle(
                    color: AppColors.surface,
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(width: 10),
                Icon(Icons.arrow_forward, color: AppColors.surface, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyHistory extends StatelessWidget {
  const _EmptyHistory();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: AppColors.surfaceSecondary,
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(Icons.chat_bubble_outline, size: 24),
          ),
          const SizedBox(height: 12),
          Text('还没有对话', style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: 6),
          Text(
            '发起一次聊天后，会在这里显示历史会话。',
            style: Theme.of(
              context,
            ).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _HistoryError extends StatelessWidget {
  final VoidCallback onRetry;

  const _HistoryError({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: TextButton.icon(
        onPressed: onRetry,
        icon: const Icon(Icons.refresh),
        label: const Text('重新加载'),
      ),
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
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x0A000000)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x08000000),
              blurRadius: 20,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: AppColors.surfaceSecondary,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(_iconForTag(item.tag), size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(
                            context,
                          ).textTheme.labelMedium?.copyWith(fontSize: 15),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        item.timeAgo,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.preview,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textSecondary,
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.chevron_right,
              size: 20,
              color: AppColors.textSecondary,
            ),
          ],
        ),
      ),
    );
  }

  IconData _iconForTag(String tag) {
    switch (tag) {
      case 'kitchen':
        return Icons.kitchen_outlined;
      case 'restaurant':
        return Icons.restaurant_outlined;
      default:
        return Icons.chat_bubble_outline;
    }
  }
}

class _QuickNeed {
  final IconData icon;
  final String label;

  const _QuickNeed(this.icon, this.label);
}

class _QuickNeedChip extends StatelessWidget {
  final _QuickNeed item;
  final VoidCallback onTap;

  const _QuickNeedChip({required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x0A000000)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(item.icon, size: 17, color: AppColors.textSecondary),
            const SizedBox(width: 6),
            Text(item.label, style: Theme.of(context).textTheme.labelMedium),
          ],
        ),
      ),
    );
  }
}
