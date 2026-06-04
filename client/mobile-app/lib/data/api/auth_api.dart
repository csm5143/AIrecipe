import 'package:shared_preferences/shared_preferences.dart';
import 'api_helpers.dart';
import 'http_client.dart';

class AuthApi {
  final _dio = HttpClient.instance;

  Future<AuthToken> login(String phone, String password) {
    return guardApi(() async {
      final response = await _dio.post(
        '/auth/login',
        data: {'phone': phone, 'password': password},
      );
      final token = AuthToken.fromJson(responseMap(response));
      await _saveToken(token);
      return token;
    });
  }

  Future<AuthToken> register(String phone, String password, String code) {
    return guardApi(() async {
      final response = await _dio.post(
        '/auth/register',
        data: {'phone': phone, 'password': password, 'code': code},
      );
      final token = AuthToken.fromJson(responseMap(response));
      await _saveToken(token);
      return token;
    });
  }

  Future<AuthToken> refresh() {
    return guardApi(() async {
      final response = await _dio.post('/auth/refresh');
      final token = AuthToken.fromJson(responseMap(response));
      await _saveToken(token);
      return token;
    });
  }

  Future<void> logout() {
    return guardApi(() async {
      await _dio.post('/auth/logout');
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(HttpClient.tokenKey);
    });
  }

  Future<void> _saveToken(AuthToken token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(HttpClient.tokenKey, token.accessToken);
  }
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
