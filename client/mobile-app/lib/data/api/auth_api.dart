import '../../models/user.dart';
import 'api_helpers.dart';
import 'auth_storage.dart';
import 'http_client.dart';

class AuthApi {
  final _dio = HttpClient.instance;

  Future<AuthSession> login(String phone, String password) {
    return guardApi(() async {
      final response = await _dio.post(
        '/wx/phone-login',
        data: {'phone': phone, 'password': password},
      );
      return _saveSession(responseMap(response));
    });
  }

  Future<AuthSession> register(String phone, String password, String nickname) {
    return guardApi(() async {
      final response = await _dio.post(
        '/wx/phone-register',
        data: {'phone': phone, 'password': password, 'nickname': nickname},
      );
      return _saveSession(responseMap(response));
    });
  }

  Future<AppUser> currentUser() {
    return guardApi(() async {
      final response = await _dio.get('/wx/userinfo');
      return AppUser.fromJson(responseMap(response));
    });
  }

  Future<void> logout() {
    return guardApi(() async {
      await AuthStorage.clearSession();
    });
  }

  Future<AuthSession> _saveSession(Map<String, dynamic> json) async {
    final token = AuthToken.fromJson(json);
    final user = AppUser.fromJson(json);
    await AuthStorage.saveSession(
      token: token.accessToken,
      refreshToken: token.refreshToken,
      userId: user.id,
    );
    return AuthSession(token: token, user: user);
  }
}

class AuthSession {
  final AuthToken token;
  final AppUser user;

  const AuthSession({required this.token, required this.user});
}

class AuthToken {
  final String accessToken;
  final String refreshToken;
  final DateTime? expiresAt;

  const AuthToken({
    required this.accessToken,
    this.refreshToken = '',
    this.expiresAt,
  });

  factory AuthToken.fromJson(Map<String, dynamic> json) {
    final expiresAt = json['expires_at'] ?? json['expiresAt'];
    return AuthToken(
      accessToken: (json['access_token'] ?? json['token'] ?? '').toString(),
      refreshToken: (json['refresh_token'] ?? json['refreshToken'] ?? '')
          .toString(),
      expiresAt: expiresAt == null
          ? null
          : DateTime.tryParse(expiresAt.toString()),
    );
  }
}
