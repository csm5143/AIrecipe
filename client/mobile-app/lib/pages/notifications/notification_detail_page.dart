import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../models/notification_item.dart';
import '../../providers/collection_provider.dart';

final notificationByIdProvider = Provider.family<NotificationItem?, String>((
  ref,
  id,
) {
  final notifications = ref.watch(notificationListProvider).valueOrNull;
  if (notifications == null) return null;
  for (final item in notifications) {
    if (item.id == id) return item;
  }
  return null;
});

class NotificationDetailPage extends ConsumerWidget {
  final String notificationId;

  const NotificationDetailPage({super.key, required this.notificationId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notification = ref.watch(notificationByIdProvider(notificationId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.glassSurface,
        title: const Text('通知详情'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.of(context).canPop()
              ? context.pop()
              : context.go('/notifications'),
        ),
      ),
      body: notification == null
          ? const _MissingNotification()
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
              children: [
                Text(
                  notification.title.isNotEmpty
                      ? notification.title
                      : notification.fromUserName,
                  style: Theme.of(
                    context,
                  ).textTheme.headlineLarge?.copyWith(fontSize: 24),
                ),
                const SizedBox(height: 8),
                Text(
                  notification.timeAgo,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [
                      BoxShadow(color: Color(0x0A000000), blurRadius: 24),
                    ],
                  ),
                  child: Text(
                    notification.content.isNotEmpty
                        ? notification.content
                        : notification.action,
                    style: Theme.of(
                      context,
                    ).textTheme.bodyLarge?.copyWith(height: 1.6),
                  ),
                ),
                const SizedBox(height: 24),
                if (_recipeId(notification) != null)
                  FilledButton.icon(
                    onPressed: () =>
                        context.push('/recipe/${_recipeId(notification)}'),
                    icon: const Icon(Icons.restaurant_menu),
                    label: const Text('查看菜谱'),
                  )
                else if (_followerId(notification) != null)
                  FilledButton.icon(
                    onPressed: () =>
                        context.push('/user/${_followerId(notification)}'),
                    icon: const Icon(Icons.person_outline),
                    label: const Text('查看用户'),
                  ),
              ],
            ),
    );
  }
}

class _MissingNotification extends StatelessWidget {
  const _MissingNotification();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          '未找到这条通知，请返回通知列表刷新后再试。',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.textSecondary),
        ),
      ),
    );
  }
}

String? _recipeId(NotificationItem notification) {
  final value = notification.data['recipeId'] ?? notification.targetId;
  final text = value?.toString() ?? '';
  return text.isEmpty ? null : text;
}

String? _followerId(NotificationItem notification) {
  final value = notification.data['followerId'];
  final text = value?.toString() ?? '';
  return text.isEmpty ? null : text;
}
