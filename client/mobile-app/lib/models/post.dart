class Post {
  final String id;
  final String content;
  final String imageUrl;
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
    required this.authorName,
    this.authorAvatar = '',
    this.likes = 0,
    this.comments = 0,
    this.favorites = 0,
    this.timeAgo = '',
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: _stringValue(json['id']),
      content: _stringValue(json['content']),
      imageUrl: _stringValue(json['image_url'] ?? json['imageUrl']),
      authorName: _stringValue(json['author_name'] ?? json['authorName']),
      authorAvatar: _stringValue(json['author_avatar'] ?? json['authorAvatar']),
      likes: _intValue(json['likes']),
      comments: _intValue(json['comments']),
      favorites: _intValue(json['favorites']),
      timeAgo: _stringValue(json['time_ago'] ?? json['timeAgo']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'image_url': imageUrl,
      'author_name': authorName,
      'author_avatar': authorAvatar,
      'likes': likes,
      'comments': comments,
      'favorites': favorites,
      'time_ago': timeAgo,
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
