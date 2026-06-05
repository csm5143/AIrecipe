class NotificationItem {
  final String id;
  final String fromUserName;
  final String fromUserAvatar;
  final String action;
  final String targetName;
  final String? targetImage;
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
    this.type = NotificationType.system,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    final publishedAt = _dateTimeValue(
      json['publishedAt'] ?? json['published_at'],
    );
    final title = _stringValue(json['title']);
    final content = _stringValue(json['content']);
    final type = notificationTypeFromJson(json['type']);

    return NotificationItem(
      id: _stringValue(json['id']),
      fromUserName: _stringValue(
        json['from_user_name'] ?? json['fromUserName'],
        title.isEmpty ? '系统通知' : title,
      ),
      fromUserAvatar: _stringValue(
        json['from_user_avatar'] ?? json['fromUserAvatar'],
      ),
      action: _stringValue(
        json['action'],
        content.isEmpty ? _defaultAction(type) : content,
      ),
      targetName: _stringValue(json['target_name'] ?? json['targetName']),
      targetImage:
          json['target_image']?.toString() ?? json['targetImage']?.toString(),
      timeAgo: _stringValue(
        json['time_ago'] ?? json['timeAgo'],
        _relativeTime(publishedAt),
      ),
      isUnread: _boolValue(json['is_unread'] ?? json['isUnread']),
      type: type,
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

enum NotificationType { like, comment, follow, system, ai, achievement }

NotificationType notificationTypeFromJson(dynamic value) {
  final normalized = value?.toString().toLowerCase();
  if (normalized == 'activity' || normalized == 'update') {
    return NotificationType.system;
  }

  return NotificationType.values.firstWhere(
    (type) => type.name == normalized,
    orElse: () => NotificationType.system,
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

DateTime? _dateTimeValue(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  return DateTime.tryParse(value.toString());
}

String _relativeTime(DateTime? value) {
  if (value == null) return '';
  final diff = DateTime.now().difference(value.toLocal());
  if (diff.inMinutes < 1) return '刚刚';
  if (diff.inHours < 1) return '${diff.inMinutes}分钟前';
  if (diff.inDays < 1) return '${diff.inHours}小时前';
  if (diff.inDays < 7) return '${diff.inDays}天前';
  return '${value.month}/${value.day}';
}

String _defaultAction(NotificationType type) {
  return switch (type) {
    NotificationType.ai => '有新的智能推荐',
    NotificationType.achievement => '达成了新成就',
    NotificationType.follow => '关注了你',
    NotificationType.like => '赞了你的内容',
    NotificationType.comment => '评论了你的内容',
    NotificationType.system => '有一条新公告',
  };
}
