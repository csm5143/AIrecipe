import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../providers/collection_provider.dart';
import '../../models/notification_item.dart';

/// 通知列表页
class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationListProvider);
    final today = notifications.where((n) => n.timeAgo.contains('m') || n.timeAgo.contains('h')).toList();
    final thisWeek = notifications.where((n) => n.timeAgo == 'Tue' || n.timeAgo == 'Mon').toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background.withAlpha(200),
        title: const Text('通知'),
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, size: 20), onPressed: () => Navigator.of(context).canPop() ? context.pop() : context.go('/')),
        actions: [TextButton(onPressed: () {}, child: Text('全部已读', style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.accentBlue)))],
      ),
      body: ListView(padding: const EdgeInsets.symmetric(horizontal: 16), children: [
        if (today.isNotEmpty) ...[_SectionTitle(title: '今天'), ...today.map((n) => _NotifTile(notification: n))],
        if (thisWeek.isNotEmpty) ...[const SizedBox(height: 24), _SectionTitle(title: '本周'), ...thisWeek.map((n) => _NotifTile(notification: n))],
        const SizedBox(height: 100),
      ]),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});
  @override
  Widget build(BuildContext context) {
    return Padding(padding: const EdgeInsets.only(bottom: 12, left: 8), child: Text(title, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.textSecondary)));
  }
}

class _NotifTile extends StatelessWidget {
  final NotificationItem notification;
  const _NotifTile({required this.notification});
  @override
  Widget build(BuildContext context) {
    final actText = notification.type == NotificationType.ai ? '推荐了新食谱' : notification.type == NotificationType.like ? '赞了' : notification.type == NotificationType.comment ? '评论了' : notification.type == NotificationType.achievement ? '达成成就' : notification.action;
    return Container(
      margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 24)]),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(width: 48, height: 48, decoration: BoxDecoration(color: AppColors.surfaceSecondary, borderRadius: BorderRadius.circular(24), border: Border.all(color: const Color(0x0A000000))), clipBehavior: Clip.antiAlias,
          child: notification.type == NotificationType.ai ? const Icon(Icons.smart_toy, size: 24, color: AppColors.textPrimary)
              : notification.type == NotificationType.achievement ? const Icon(Icons.workspace_premium, size: 24, color: AppColors.textPrimary)
              : notification.fromUserAvatar.isNotEmpty ? CachedNetworkImage(imageUrl: notification.fromUserAvatar, fit: BoxFit.cover, errorWidget: (_, __, ___) => const Icon(Icons.person, size: 24))
              : const Icon(Icons.person, size: 24)),
        const SizedBox(width: 16),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          RichText(text: TextSpan(style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.4), children: [
            TextSpan(text: notification.fromUserName, style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
            TextSpan(text: ' $actText ', style: const TextStyle(color: AppColors.textPrimary)),
            if (notification.targetName.isNotEmpty) TextSpan(text: '"${notification.targetName}"', style: const TextStyle(fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
          ])),
          const SizedBox(height: 4),
          Text(notification.timeAgo, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary)),
        ])),
        const SizedBox(width: 8),
        Column(children: [
          if (notification.isUnread) Container(width: 10, height: 10, decoration: const BoxDecoration(color: AppColors.accentBlue, shape: BoxShape.circle)),
          if (notification.targetImage != null) ...[const SizedBox(height: 12), ClipRRect(borderRadius: BorderRadius.circular(8), child: SizedBox(width: 40, height: 40, child: CachedNetworkImage(imageUrl: notification.targetImage!, fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(color: AppColors.surfaceSecondary))))],
        ]),
      ]),
    );
  }
}
