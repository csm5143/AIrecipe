class AppUser {
  final String id;
  final String nickname;
  final String avatar;
  final String bio;
  final int followers;
  final int following;
  final int works;
  final int collections;

  const AppUser({
    required this.id,
    required this.nickname,
    this.avatar = '',
    this.bio = '',
    this.followers = 0,
    this.following = 0,
    this.works = 0,
    this.collections = 0,
  });
}
