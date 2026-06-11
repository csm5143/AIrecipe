class ChatMessage {
  final String id;
  final bool isUser;
  final String text;
  final List<String> imageUrls;
  final List<ChatRecommendation> recommendations;
  final List<PendingAction> pendingActions;
  final DateTime timestamp;
  final bool isPending;
  final bool isFailed;

  const ChatMessage({
    required this.id,
    required this.isUser,
    required this.text,
    this.imageUrls = const [],
    this.recommendations = const [],
    this.pendingActions = const [],
    required this.timestamp,
    this.isPending = false,
    this.isFailed = false,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    final images = _stringListValue(json['imageUrls'] ?? json['image_urls']);
    return ChatMessage(
      id: _stringValue(json['id']),
      isUser: _boolValue(json['is_user'] ?? json['isUser']),
      text: _stringValue(json['text'] ?? json['content']),
      imageUrls: images,
      recommendations: _recommendationListValue(json['recommendations']),
      pendingActions: _pendingActionListValue(json['pendingActions'] ?? json['pending_actions']),
      timestamp: _dateTimeValue(json['timestamp'] ?? json['created_at']),
      isPending: _boolValue(json['is_pending'] ?? json['isPending']),
      isFailed: _boolValue(json['is_failed'] ?? json['isFailed']),
    );
  }

  ChatMessage copyWith({
    String? id,
    bool? isUser,
    String? text,
    List<String>? imageUrls,
    List<ChatRecommendation>? recommendations,
    List<PendingAction>? pendingActions,
    DateTime? timestamp,
    bool? isPending,
    bool? isFailed,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      isUser: isUser ?? this.isUser,
      text: text ?? this.text,
      imageUrls: imageUrls ?? this.imageUrls,
      recommendations: recommendations ?? this.recommendations,
      pendingActions: pendingActions ?? this.pendingActions,
      timestamp: timestamp ?? this.timestamp,
      isPending: isPending ?? this.isPending,
      isFailed: isFailed ?? this.isFailed,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'is_user': isUser,
      'text': text,
      'imageUrls': imageUrls,
      'recommendations': recommendations.map((item) => item.toJson()).toList(),
      'timestamp': timestamp.toIso8601String(),
      'is_pending': isPending,
      'is_failed': isFailed,
    };
  }

  Map<String, dynamic> toApiJson() {
    return {
      'role': isUser ? 'user' : 'assistant',
      'content': text,
      'imageUrls': imageUrls,
      'recommendations': recommendations.map((item) => item.toJson()).toList(),
    };
  }
}

class ChatRecommendation {
  final String id;
  final String type;
  final String title;
  final String description;
  final String coverImage;
  final String authorName;
  final int cookingTime;
  final String difficulty;
  final String route;

  const ChatRecommendation({
    required this.id,
    required this.type,
    required this.title,
    this.description = '',
    this.coverImage = '',
    this.authorName = '',
    this.cookingTime = 0,
    this.difficulty = '',
    this.route = '',
  });

  factory ChatRecommendation.fromJson(Map<String, dynamic> json) {
    final type = _stringValue(json['type'], 'recipe') == 'post'
        ? 'post'
        : 'recipe';
    final id = _stringValue(json['id']);
    return ChatRecommendation(
      id: id,
      type: type,
      title: _stringValue(json['title']),
      description: _stringValue(json['description']),
      coverImage: _stringValue(json['coverImage'] ?? json['cover_image']),
      authorName: _stringValue(json['authorName'] ?? json['author_name']),
      cookingTime: _intValue(json['cookingTime'] ?? json['cooking_time']),
      difficulty: _stringValue(json['difficulty']),
      route: _stringValue(
        json['route'],
        type == 'post' ? '/post/$id' : '/recipe/$id',
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'title': title,
      'description': description,
      'coverImage': coverImage,
      'authorName': authorName,
      'cookingTime': cookingTime,
      'difficulty': difficulty,
      'route': route,
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

class ChatReply {
  final String sessionId;
  final String userMessageId;
  final String assistantMessageId;
  final String message;
  final List<ChatRecommendation> recommendations;
  final List<PendingAction> pendingActions;
  final ChatToolActions toolActions;
  final String model;
  final int tokensUsed;

  const ChatReply({
    required this.sessionId,
    this.userMessageId = '',
    this.assistantMessageId = '',
    required this.message,
    this.recommendations = const [],
    this.pendingActions = const [],
    this.toolActions = const ChatToolActions(),
    this.model = '',
    this.tokensUsed = 0,
  });

  factory ChatReply.fromJson(Map<String, dynamic> json) {
    return ChatReply(
      sessionId: _stringValue(json['session_id'] ?? json['sessionId']),
      userMessageId: _stringValue(
        json['user_message_id'] ?? json['userMessageId'],
      ),
      assistantMessageId: _stringValue(
        json['assistant_message_id'] ?? json['assistantMessageId'],
      ),
      message: _stringValue(json['message'] ?? json['text'] ?? json['content']),
      recommendations: _recommendationListValue(json['recommendations']),
      pendingActions: _pendingActionListValue(json['pendingActions'] ?? json['pending_actions']),
      toolActions: ChatToolActions.fromJson(_mapValue(json['toolActions'])),
      model: _stringValue(json['model']),
      tokensUsed: _intValue(json['tokens_used'] ?? json['tokensUsed']),
    );
  }
}

class PendingAction {
  final String id;
  final String toolName;
  final String title;
  final String body;

  const PendingAction({
    required this.id,
    required this.toolName,
    required this.title,
    this.body = '',
  });

  factory PendingAction.fromJson(Map<String, dynamic> json) {
    return PendingAction(
      id: _stringValue(json['id']),
      toolName: _stringValue(json['toolName'] ?? json['tool_name']),
      title: _stringValue(json['title']),
      body: _stringValue(json['body']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tool_name': toolName,
      'title': title,
      'body': body,
    };
  }
}

class ChatToolActions {
  final List<ChatReminderAction> reminders;

  const ChatToolActions({this.reminders = const []});

  factory ChatToolActions.fromJson(Map<String, dynamic> json) {
    return ChatToolActions(
      reminders: _reminderActionListValue(json['reminders']),
    );
  }
}

class ChatReminderAction {
  final int id;
  final String title;
  final String body;
  final DateTime triggerAt;
  final List<String> items;
  final int? shoppingListId;
  final int? recipeId;

  const ChatReminderAction({
    required this.id,
    required this.title,
    required this.body,
    required this.triggerAt,
    this.items = const [],
    this.shoppingListId,
    this.recipeId,
  });

  factory ChatReminderAction.fromJson(Map<String, dynamic> json) {
    return ChatReminderAction(
      id: _intValue(json['id']),
      title: _stringValue(json['title'], '买菜提醒'),
      body: _stringValue(json['body'], '该去买菜了，记得查看小菜篮。'),
      triggerAt: _dateTimeValue(json['triggerAt'] ?? json['trigger_at']),
      items: _stringListValue(json['items']),
      shoppingListId: _nullableIntValue(json['shoppingListId'] ?? json['shopping_list_id']),
      recipeId: _nullableIntValue(json['recipeId'] ?? json['recipe_id']),
    );
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

int? _nullableIntValue(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value.toString());
}

bool _boolValue(dynamic value, [bool fallback = false]) {
  if (value is bool) return value;
  if (value is num) return value != 0;
  final normalized = value?.toString().toLowerCase();
  if (normalized == 'true') return true;
  if (normalized == 'false') return false;
  return fallback;
}

List<String> _stringListValue(dynamic value) {
  if (value is List) {
    return value
        .map((item) => item?.toString() ?? '')
        .where((item) => item.isNotEmpty)
        .toList(growable: false);
  }
  return const [];
}

List<ChatRecommendation> _recommendationListValue(dynamic value) {
  if (value is List) {
    return value
        .map(
          (item) => item is Map
              ? ChatRecommendation.fromJson(Map<String, dynamic>.from(item))
              : null,
        )
        .whereType<ChatRecommendation>()
        .toList(growable: false);
  }
  return const [];
}

List<PendingAction> _pendingActionListValue(dynamic value) {
  if (value is List) {
    return value
        .map(
          (item) => item is Map
              ? PendingAction.fromJson(Map<String, dynamic>.from(item))
              : null,
        )
        .whereType<PendingAction>()
        .toList(growable: false);
  }
  return const [];
}

List<ChatReminderAction> _reminderActionListValue(dynamic value) {
  if (value is List) {
    return value
        .map(
          (item) => item is Map
              ? ChatReminderAction.fromJson(Map<String, dynamic>.from(item))
              : null,
        )
        .whereType<ChatReminderAction>()
        .toList(growable: false);
  }
  return const [];
}

Map<String, dynamic> _mapValue(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return const {};
}

DateTime _dateTimeValue(dynamic value) {
  if (value is DateTime) return value;
  return DateTime.tryParse(value?.toString() ?? '') ?? DateTime.now();
}
