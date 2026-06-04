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

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: _stringValue(json['id']),
      nickname: _stringValue(json['nickname'] ?? json['name']),
      avatar: _stringValue(json['avatar'] ?? json['avatar_url']),
      bio: _stringValue(json['bio']),
      followers: _intValue(json['followers']),
      following: _intValue(json['following']),
      works: _intValue(json['works']),
      collections: _intValue(json['collections']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nickname': nickname,
      'avatar': avatar,
      'bio': bio,
      'followers': followers,
      'following': following,
      'works': works,
      'collections': collections,
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
