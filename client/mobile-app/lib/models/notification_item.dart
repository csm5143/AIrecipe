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
  final String? targetId; // recipeId 或 followerId，用于深度链接

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
    this.targetId,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    // 后端返回 createdAt 为 epoch 毫秒
    final createdAt = _dateFromEpoch(json['createdAt']);
    final title = _stringValue(json['title']);
    final content = _stringValue(json['content']);
    final type = notificationTypeFromJson(json['type']);
    // data 字段包含结构化元数据
    final extraData = json['data'] is Map
        ? json['data'] as Map<String, dynamic>
        : <String, dynamic>{};

    return NotificationItem(
      id: _stringValue(json['id']),
      fromUserName: _stringValue(
        extraData['followerName'] ?? extraData['likerName'] ?? json['fromUserName'],
        title,
      ),
      fromUserAvatar: _stringValue(json['fromUserAvatar']),
      action: content.isNotEmpty ? content : _defaultAction(type),
      targetName: _stringValue(
        extraData['recipeTitle'] ?? json['targetName'],
      ),
      targetImage: json['targetImage']?.toString(),
      timeAgo: _relativeTime(createdAt),
      isUnread: json['isRead'] == false,
      type: type,
      targetId: _stringValue(
        extraData['recipeId'] ?? extraData['followerId'],
        json['targetId']?.toString() ?? '',
      ),
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
  final raw = value?.toString().toUpperCase() ?? '';
  // 后端 NotificationType 枚举 → Flutter 枚举映射
  switch (raw) {
    case 'RECIPE_APPROVED':
    case 'RECIPE_REJECTED':
    case 'RECIPE_LIKED':
      return NotificationType.like;
    case 'NEW_FOLLOWER':
      return NotificationType.follow;
    case 'COMMENT':
      return NotificationType.comment;
    case 'SYSTEM':
    case 'ANNOUNCEMENT':
      return NotificationType.system;
    default:
      break;
  }
  // 兼容前端旧值
  final normalized = raw.toLowerCase();
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

DateTime? _dateFromEpoch(dynamic value) {
  if (value == null) return null;
  if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
  final ms = int.tryParse(value.toString());
  if (ms != null) return DateTime.fromMillisecondsSinceEpoch(ms);
  return null;
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
