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
}
