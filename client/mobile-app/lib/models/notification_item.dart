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

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: _stringValue(json['id']),
      fromUserName: _stringValue(
        json['from_user_name'] ?? json['fromUserName'],
      ),
      fromUserAvatar: _stringValue(
        json['from_user_avatar'] ?? json['fromUserAvatar'],
      ),
      action: _stringValue(json['action']),
      targetName: _stringValue(json['target_name'] ?? json['targetName']),
      targetImage:
          json['target_image']?.toString() ?? json['targetImage']?.toString(),
      timeAgo: _stringValue(json['time_ago'] ?? json['timeAgo']),
      isUnread: _boolValue(json['is_unread'] ?? json['isUnread']),
      type: notificationTypeFromJson(json['type']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'from_user_name': fromUserName,
      'from_user_avatar': fromUserAvatar,
      'action': action,
      'target_name': targetName,
      'target_image': targetImage,
      'time_ago': timeAgo,
      'is_unread': isUnread,
      'type': type.toJson(),
    };
  }
}

enum NotificationType {
  like, // 点赞
  comment, // 评论
  follow, // 关注
  system, // 系统通知
  ai, // AI 建议
  achievement, // 成就
}

NotificationType notificationTypeFromJson(dynamic value) {
  final normalized = value?.toString().toLowerCase();
  return NotificationType.values.firstWhere(
    (type) => type.name == normalized,
    orElse: () => NotificationType.like,
  );
}

extension NotificationTypeJson on NotificationType {
  String toJson() => name;
}

String _stringValue(dynamic value, [String fallback = '']) {
  return value?.toString() ?? fallback;
}

bool _boolValue(dynamic value, [bool fallback = false]) {
  if (value is bool) return value;
  if (value is num) return value != 0;
  final normalized = value?.toString().toLowerCase();
  if (normalized == 'true') return true;
  if (normalized == 'false') return false;
  return fallback;
}
