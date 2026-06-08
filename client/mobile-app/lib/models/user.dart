class AppUser {
  final String id;
  final String nickname;
  final String avatar;
  final String bio;
  final String phone;
  final String email;
  final String gender;
  final int followers;
  final int following;
  final int works;
  final int collections;
  final bool isFollowing;
  final List<PublicCollection> publicCollections;

  const AppUser({
    required this.id,
    required this.nickname,
    this.avatar = '',
    this.bio = '',
    this.phone = '',
    this.email = '',
    this.gender = 'UNKNOWN',
    this.followers = 0,
    this.following = 0,
    this.works = 0,
    this.collections = 0,
    this.isFollowing = false,
    this.publicCollections = const [],
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: _stringValue(json['id']),
      nickname: _stringValue(json['nickname'] ?? json['name']),
      avatar: _stringValue(json['avatar'] ?? json['avatar_url']),
      bio: _stringValue(json['bio']),
      phone: _stringValue(json['phone']),
      email: _stringValue(json['email']),
      gender: _stringValue(json['gender'], 'UNKNOWN'),
      followers: _intValue(json['followers']),
      following: _intValue(json['following']),
      works: _intValue(json['works']),
      collections: _intValue(json['collections']),
      isFollowing: _boolValue(json['isFollowing'] ?? json['is_following']),
      publicCollections: _listValue(
        json['publicCollections'],
      ).map((item) => PublicCollection.fromJson(mapValue(item))).toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nickname': nickname,
      'avatar': avatar,
      'bio': bio,
      'phone': phone,
      'email': email,
      'gender': gender,
      'followers': followers,
      'following': following,
      'works': works,
      'collections': collections,
      'is_following': isFollowing,
      'public_collections': publicCollections
          .map((item) => item.toJson())
          .toList(),
    };
  }
}

class PublicCollection {
  final String id;
  final String name;
  final String description;
  final String coverImage;
  final int itemCount;

  const PublicCollection({
    required this.id,
    required this.name,
    this.description = '',
    this.coverImage = '',
    this.itemCount = 0,
  });

  factory PublicCollection.fromJson(Map<String, dynamic> json) {
    return PublicCollection(
      id: _stringValue(json['id']),
      name: _stringValue(json['name']),
      description: _stringValue(json['description']),
      coverImage: _stringValue(json['coverImage'] ?? json['cover_image']),
      itemCount: _intValue(json['itemCount'] ?? json['item_count']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'coverImage': coverImage,
      'itemCount': itemCount,
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

List<dynamic> _listValue(dynamic value) {
  if (value is List) return value;
  return const [];
}

Map<String, dynamic> mapValue(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return <String, dynamic>{};
}
