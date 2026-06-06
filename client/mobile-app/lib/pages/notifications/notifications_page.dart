import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../models/notification_item.dart';
import '../../providers/api_providers.dart';
import '../../providers/collection_provider.dart';
import '../../widgets/capsule_toast.dart';

class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  final Set<String> _deletedIds = {};

  @override
  Widget build(BuildContext context) {
    final notificationsAsync = ref.watch(notificationListProvider);
    final visibleNotifications =
        notificationsAsync.valueOrNull
            ?.where((item) => !_deletedIds.contains(item.id))
            .toList() ??
        const <NotificationItem>[];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background.withAlpha(200),
        title: const Text('通知'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () =>
              Navigator.of(context).canPop() ? context.pop() : context.go('/'),
        ),
        actions: [
          TextButton(
            onPressed: visibleNotifications.isEmpty
                ? null
                : () async {
                    try {
                      await ref.read(notificationApiProvider).markAllRead();
                      ref.invalidate(notificationListProvider);
                      ref.invalidate(unreadNotificationCountProvider);
                      if (mounted) {
                        showCapsuleToast(context, '已将通知标记为已读');
                      }
                    } catch (_) {
                      if (mounted) {
                        showCapsuleToast(context, '操作失败', icon: Icons.error_outline);
                      }
                    }
                  },
            child: Text(
              '全部已读',
              style: Theme.of(
                context,
              ).textTheme.labelMedium?.copyWith(color: AppColors.accentBlue),
            ),
          ),
        ],
      ),
      body: notificationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => _NotificationMessage(
          icon: Icons.wifi_off_outlined,
          message: error.toString(),
          actionLabel: '重试',
          onAction: () => ref.invalidate(notificationListProvider),
        ),
        data: (notifications) {
          final visible = notifications
              .where((item) => !_deletedIds.contains(item.id))
              .toList();

          return RefreshIndicator(
            onRefresh: () => ref.refresh(notificationListProvider.future),
            child: visible.isEmpty
                ? const _NotificationMessage(
                    icon: Icons.notifications_none_outlined,
                    message: '暂无通知',
                  )
                : ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      const _SectionTitle(title: '最新通知'),
                      ...visible.map(_buildTile),
                      const SizedBox(height: 100),
                    ],
                  ),
          );
        },
      ),
    );
  }

  Widget _buildTile(NotificationItem notification) {
    return _NotificationTile(
      notification: notification,
      isUnread: notification.isUnread,
      onDelete: () async {
        try {
          await ref.read(notificationApiProvider).deleteNotification(notification.id);
          ref.invalidate(notificationListProvider);
          ref.invalidate(unreadNotificationCountProvider);
          if (mounted) {
            showCapsuleToast(context, '已删除', icon: Icons.delete_outline);
          }
        } catch (_) {
          setState(() => _deletedIds.add(notification.id));
          if (mounted) {
            showCapsuleToast(context, '已删除这条通知', icon: Icons.delete_outline);
          }
        }
      },
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 12, left: 8),
      child: Text(
        title,
        style: Theme.of(
          context,
        ).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary),
      ),
    );
  }
}

class _NotificationTile extends ConsumerWidget {
  final NotificationItem notification;
  final bool isUnread;
  final VoidCallback onDelete;

  const _NotificationTile({
    required this.notification,
    required this.isUnread,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Dismissible(
      key: ValueKey(notification.id),
      direction: DismissDirection.endToStart,
      background: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppColors.error,
          borderRadius: BorderRadius.circular(16),
        ),
        alignment: Alignment.centerRight,
        child: const Icon(Icons.delete_outline, color: Colors.white),
      ),
      onDismissed: (_) => onDelete(),
      child: GestureDetector(
        onTap: () {
          if (notification.isUnread) {
            ref.read(notificationApiProvider).markRead(notification.id);
            ref.invalidate(notificationListProvider);
            ref.invalidate(unreadNotificationCountProvider);
          }
          _openNotificationTarget(context, notification);
        },
        child: Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(color: Color(0x0A000000), blurRadius: 24),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _NotificationAvatar(notification: notification),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: TextSpan(
                        style: Theme.of(
                          context,
                        ).textTheme.bodyMedium?.copyWith(height: 1.4),
                        children: [
                          TextSpan(
                            text: notification.fromUserName,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          TextSpan(
                            text: ' ${_actionText(notification)}',
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                            ),
                          ),
                          if (notification.targetName.isNotEmpty)
                            TextSpan(
                              text: ' "${notification.targetName}"',
                              style: const TextStyle(
                                fontWeight: FontWeight.w500,
                                color: AppColors.textPrimary,
                              ),
                            ),
                        ],
                      ),
                    ),
                    if (notification.timeAgo.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        notification.timeAgo,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                children: [
                  if (isUnread)
                    Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: AppColors.accentBlue,
                        shape: BoxShape.circle,
                      ),
                    ),
                  if (notification.targetImage != null) ...[
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: SizedBox(
                        width: 40,
                        height: 40,
                        child: CachedNetworkImage(
                          imageUrl: notification.targetImage!,
                          fit: BoxFit.cover,
                          errorWidget: (_, _, _) =>
                              Container(color: AppColors.surfaceSecondary),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotificationAvatar extends StatelessWidget {
  final NotificationItem notification;

  const _NotificationAvatar({required this.notification});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: AppColors.surfaceSecondary,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0x0A000000)),
      ),
      clipBehavior: Clip.antiAlias,
      child: _avatarChild(),
    );
  }

  Widget _avatarChild() {
    if (notification.type == NotificationType.ai) {
      return const Icon(
        Icons.smart_toy,
        size: 24,
        color: AppColors.textPrimary,
      );
    }
    if (notification.type == NotificationType.achievement) {
      return const Icon(
        Icons.workspace_premium,
        size: 24,
        color: AppColors.textPrimary,
      );
    }
    if (notification.type == NotificationType.system) {
      return const Icon(
        Icons.campaign_outlined,
        size: 24,
        color: AppColors.textPrimary,
      );
    }
    if (notification.fromUserAvatar.isNotEmpty) {
      return CachedNetworkImage(
        imageUrl: notification.fromUserAvatar,
        fit: BoxFit.cover,
        errorWidget: (_, _, _) => const Icon(Icons.person, size: 24),
      );
    }
    return const Icon(Icons.person, size: 24);
  }
}

class _NotificationMessage extends StatelessWidget {
  final IconData icon;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _NotificationMessage({
    required this.icon,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.24),
        Icon(icon, size: 42, color: AppColors.textSecondary),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.textSecondary),
          ),
        ),
        if (actionLabel != null && onAction != null) ...[
          const SizedBox(height: 12),
          Center(
            child: TextButton(onPressed: onAction, child: Text(actionLabel!)),
          ),
        ],
      ],
    );
  }
}

String _actionText(NotificationItem notification) {
  if (notification.action.isNotEmpty) return notification.action;
  return switch (notification.type) {
    NotificationType.ai => '有新的智能推荐',
    NotificationType.achievement => '达成了新成就',
    NotificationType.follow => '关注了你',
    NotificationType.like => '赞了你的内容',
    NotificationType.comment => '评论了你的内容',
    NotificationType.system => '有一条新公告',
  };
}

void _openNotificationTarget(
  BuildContext context,
  NotificationItem notification,
) {
  // 优先深度链接到具体内容
  final targetId = notification.targetId;
  if (targetId != null && targetId.isNotEmpty) {
    switch (notification.type) {
      case NotificationType.like:
        context.go('/recipe/$targetId');
        return;
      case NotificationType.follow:
        context.go('/user/$targetId');
        return;
      default:
        context.go('/recipe/$targetId');
        return;
    }
  }

  switch (notification.type) {
    case NotificationType.ai:
      context.go('/ai/chat');
      return;
    case NotificationType.follow:
    case NotificationType.achievement:
    case NotificationType.system:
      context.go('/mine');
      return;
    case NotificationType.like:
      context.go('/my-collections');
      return;
    case NotificationType.comment:
      context.go('/collection');
      return;
  }
}
