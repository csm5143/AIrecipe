class Post {
  final String id;
  final String content;
  final String imageUrl;
  final List<String> imageUrls;
  final String authorName;
  final String authorAvatar;
  final int likes;
  final int comments;
  final int favorites;
  final String timeAgo;

  const Post({
    required this.id,
    required this.content,
    required this.imageUrl,
    this.imageUrls = const [],
    required this.authorName,
    this.authorAvatar = '',
    this.likes = 0,
    this.comments = 0,
    this.favorites = 0,
    this.timeAgo = '',
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    final title = _stringValue(json['title']);
    final description = _stringValue(json['description']);
    final content = _stringValue(
      json['content'],
      description.isNotEmpty ? description : title,
    );
    final images = _stringListValue(json['imageUrls']);
    final imageUrl = _stringValue(
      json['image_url'] ?? json['imageUrl'] ?? json['coverImage'],
    );

    return Post(
      id: _stringValue(json['id']),
      content: content,
      imageUrl: imageUrl,
      imageUrls: images.isNotEmpty
          ? images
          : imageUrl.isNotEmpty
          ? [imageUrl]
          : const [],
      authorName: _stringValue(json['author_name'] ?? json['authorName']),
      authorAvatar: _stringValue(json['author_avatar'] ?? json['authorAvatar']),
      likes: _intValue(json['likes'] ?? json['favoriteCount']),
      comments: _intValue(json['comments'] ?? json['commentCount']),
      favorites: _intValue(json['favorites'] ?? json['collectCount']),
      timeAgo: _stringValue(
        json['time_ago'] ?? json['timeAgo'],
        _relativeTime(
          _dateValue(
            json['publishedAt'] ?? json['createdAt'] ?? json['updatedAt'],
          ),
        ),
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'image_url': imageUrl,
      'imageUrls': imageUrls,
      'author_name': authorName,
      'author_avatar': authorAvatar,
      'likes': likes,
      'comments': comments,
      'favorites': favorites,
      'time_ago': timeAgo,
    };
  }
}

List<String> _stringListValue(dynamic value) {
  if (value is! List) return const [];
  return value
      .map((item) => item?.toString().trim() ?? '')
      .where((item) => item.isNotEmpty)
      .toList();
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

String _relativeTime(DateTime? value) {
  if (value == null) return '';
  final diff = DateTime.now().difference(value.toLocal());
  if (diff.inMinutes < 1) return '刚刚';
  if (diff.inHours < 1) return '${diff.inMinutes}分钟前';
  if (diff.inDays < 1) return '${diff.inHours}小时前';
  if (diff.inDays < 7) return '${diff.inDays}天前';
  return '${value.month}/${value.day}';
}
