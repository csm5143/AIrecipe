class NotificationItem {
  final String id;
  final String fromUserName;
  final String fromUserAvatar;
  final String action; // "liked your", "commented:", "suggested", etc.
  final String targetName; // recipe name or post name
  final String? targetImage; // thumbnail
  final String timeAgo;
  final bool isUnread;
  final NotificationType type;

  const NotificationItem({
    required this.id,
    required this.fromUserName,
    this.fromUserAvatar = '',
    this.action = '',
    this.targetName = '',
    this.targetImage,
    this.timeAgo = '',
    this.isUnread = false,
    this.type = NotificationType.like,
  });
}

enum NotificationType {
  like,       // 点赞
  comment,    // 评论
  follow,     // 关注
  system,     // 系统通知
  ai,         // AI 建议
  achievement,// 成就
}
