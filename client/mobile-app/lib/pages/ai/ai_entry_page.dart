import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../config/glass_theme.dart';
import '../../data/api/app_exception.dart';
import '../../providers/ai_provider.dart';
import '../../providers/api_providers.dart';

class AiEntryPage extends ConsumerWidget {
  const AiEntryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatHistoryAsync = ref.watch(chatHistoryProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _TopBar(onBack: () => context.go('/')),
              const SizedBox(height: 20),
              _AssistantHeader(onStart: () => context.push('/ai/chat')),
              const SizedBox(height: 24),
              Text(
                '最近对话',
                style: Theme.of(context).textTheme.headlineMedium,
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
                                const SizedBox(height: 8),
                            itemBuilder: (context, index) {
                              final item = chatHistory[index];
                              return _ChatHistoryCard(
                                item: item,
                                onTap: () =>
                                    context.push('/ai/chat?session=${item.id}'),
                                onDelete: () => _deleteSession(
                                  ref,
                                  context,
                                  item.id,
                                ),
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
              const SizedBox(height: 12),
              _StartChatButton(onTap: () => context.push('/ai/chat')),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _deleteSession(
    WidgetRef ref,
    BuildContext context,
    String sessionId,
  ) async {
    try {
      await ref.read(aiApiProvider).deleteSession(sessionId);
      ref.invalidate(chatHistoryProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e is AppException ? e.message : '删除失败')),
        );
      }
    }
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
    return GestureDetector(
      onTap: onStart,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: GlassTheme.glassDecoration(
          borderRadius: 24,
          bgColor: const Color(0xEFFFFFFF),
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.textPrimary,
                borderRadius: BorderRadius.circular(18),
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
                size: 26,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '小厨子',
                    style: Theme.of(
                      context,
                    ).textTheme.headlineLarge?.copyWith(fontSize: 22),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '告诉我食材、口味和人数，我帮你生成今天的做饭方案。',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
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
  final VoidCallback onDelete;

  const _ChatHistoryCard({
    required this.item,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key('session-${item.id}'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppColors.error.withOpacity(0.12),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.delete_outline, color: AppColors.error, size: 22),
      ),
      confirmDismiss: (_) async {
        return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('删除对话'),
            content: const Text('删除后对话记录将无法恢复'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('取消'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('删除', style: TextStyle(color: AppColors.error)),
              ),
            ],
          ),
        );
      },
      onDismissed: (_) => onDelete(),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x0A000000)),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.surfaceSecondary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.chat_bubble_outline, size: 19, color: AppColors.textSecondary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(fontSize: 15),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.timeAgo,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

