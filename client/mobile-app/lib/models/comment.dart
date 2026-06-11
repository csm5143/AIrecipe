class CommentUser {
  final String id;
  final String nickname;
  final String avatar;

  const CommentUser({
    required this.id,
    required this.nickname,
    this.avatar = '',
  });

  factory CommentUser.fromJson(Map<String, dynamic> json) {
    return CommentUser(
      id: _stringValue(json['id']),
      nickname: _stringValue(json['nickname'], '用户'),
      avatar: _stringValue(json['avatar']),
    );
  }
}

class RecipeComment {
  final String id;
  final String content;
  final DateTime createdAt;
  final CommentUser user;
  final int likeCount;
  final bool isLiked;
  final List<RecipeComment> replies;
  final int replyCount;

  const RecipeComment({
    required this.id,
    required this.content,
    required this.createdAt,
    required this.user,
    this.likeCount = 0,
    this.isLiked = false,
    this.replies = const [],
    this.replyCount = 0,
  });

  factory RecipeComment.fromJson(Map<String, dynamic> json) {
    return RecipeComment(
      id: _stringValue(json['id']),
      content: _stringValue(json['content']),
      createdAt: _dateValue(json['createdAt']) ?? DateTime.now(),
      user: CommentUser.fromJson(_mapValue(json['user'])),
      likeCount: _intValue(json['likeCount']),
      isLiked: json['isLiked'] == true,
      replies: _listValue(
        json['replies'],
      ).map((item) => RecipeComment.fromJson(_mapValue(item))).toList(),
      replyCount: _intValue(json['replyCount']),
    );
  }

  RecipeComment copyWith({
    int? likeCount,
    bool? isLiked,
    List<RecipeComment>? replies,
    int? replyCount,
  }) {
    return RecipeComment(
      id: id,
      content: content,
      createdAt: createdAt,
      user: user,
      likeCount: likeCount ?? this.likeCount,
      isLiked: isLiked ?? this.isLiked,
      replies: replies ?? this.replies,
      replyCount: replyCount ?? this.replyCount,
    );
  }
}

class CommentPageResult {
  final List<RecipeComment> items;
  final int total;
  final int page;
  final int pageSize;

  const CommentPageResult({
    required this.items,
    required this.total,
    required this.page,
    required this.pageSize,
  });

  bool get hasMore => page * pageSize < total;
}

String _stringValue(dynamic value, [String fallback = '']) {
  return value?.toString() ?? fallback;
}

int _intValue(dynamic value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

DateTime? _dateValue(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is num) return DateTime.fromMillisecondsSinceEpoch(value.toInt());
  return DateTime.tryParse(value.toString());
}

Map<String, dynamic> _mapValue(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return <String, dynamic>{};
}

List<dynamic> _listValue(dynamic value) {
  if (value is List) return value;
  return const [];
}
