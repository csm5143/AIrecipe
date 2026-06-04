class ChatMessage {
  final String id;
  final bool isUser;
  final String text;
  final DateTime timestamp;

  const ChatMessage({
    required this.id,
    required this.isUser,
    required this.text,
    required this.timestamp,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: _stringValue(json['id']),
      isUser: _boolValue(json['is_user'] ?? json['isUser']),
      text: _stringValue(json['text'] ?? json['content']),
      timestamp: _dateTimeValue(json['timestamp'] ?? json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'is_user': isUser,
      'text': text,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

class ChatHistoryItem {
  final String id;
  final String title;
  final String preview;
  final String timeAgo;
  final int recipeCount;
  final String tag;

  const ChatHistoryItem({
    required this.id,
    required this.title,
    this.preview = '',
    this.timeAgo = '',
    this.recipeCount = 0,
    this.tag = '',
  });

  factory ChatHistoryItem.fromJson(Map<String, dynamic> json) {
    return ChatHistoryItem(
      id: _stringValue(json['id']),
      title: _stringValue(json['title']),
      preview: _stringValue(json['preview']),
      timeAgo: _stringValue(json['time_ago'] ?? json['timeAgo']),
      recipeCount: _intValue(json['recipe_count'] ?? json['recipeCount']),
      tag: _stringValue(json['tag']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'preview': preview,
      'time_ago': timeAgo,
      'recipe_count': recipeCount,
      'tag': tag,
    };
  }
}

String _stringValue(dynamic value, [String fallback = '']) {
  return value?.toString() ?? fallback;
}

int _intValue(dynamic value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

bool _boolValue(dynamic value, [bool fallback = false]) {
  if (value is bool) return value;
  if (value is num) return value != 0;
  final normalized = value?.toString().toLowerCase();
  if (normalized == 'true') return true;
  if (normalized == 'false') return false;
  return fallback;
}

DateTime _dateTimeValue(dynamic value) {
  if (value is DateTime) return value;
  return DateTime.tryParse(value?.toString() ?? '') ?? DateTime.now();
}
