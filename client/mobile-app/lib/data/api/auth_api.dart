import '../../models/user.dart';
import 'api_helpers.dart';
import 'auth_storage.dart';
import 'http_client.dart';

class AuthApi {
  final _dio = HttpClient.instance;

  Future<void> sendVerificationCode({
    String? phone,
    String? email,
    required String type,
  }) {
    return guardApi(() async {
      await _dio.post(
        '/wx/send-code',
        data: {'phone': phone, 'email': email, 'type': type},
      );
    });
  }

  Future<AuthSession> accountLogin({
    String? phone,
    String? email,
    required String password,
  }) {
    return guardApi(() async {
      final response = await _dio.post(
        '/wx/account-login',
        data: {'phone': phone, 'email': email, 'password': password},
      );
      return _saveSession(responseMap(response));
    });
  }

  Future<AuthSession> accountRegister({
    String? phone,
    String? email,
    required String password,
    required String nickname,
    required String verifyCode,
  }) {
    return guardApi(() async {
      final response = await _dio.post(
        '/wx/account-register',
        data: {
          'phone': phone,
          'email': email,
          'password': password,
          'nickname': nickname,
          'verifyCode': verifyCode,
        },
      );
      return _saveSession(responseMap(response));
    });
  }

  Future<void> resetPassword({
    String? phone,
    String? email,
    required String verifyCode,
    required String newPassword,
  }) {
    return guardApi(() async {
      await _dio.post(
        '/wx/reset-password',
        data: {
          'phone': phone,
          'email': email,
          'verifyCode': verifyCode,
          'newPassword': newPassword,
        },
      );
    });
  }

  Future<void> bindEmail({required String email, required String verifyCode}) {
    return guardApi(() async {
      await _dio.post(
        '/wx/bind-email',
        data: {'email': email, 'verifyCode': verifyCode},
      );
    });
  }

  Future<AuthSession> login(String phone, String password) {
    return accountLogin(phone: phone, password: password);
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

  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) {
    return guardApi(() async {
      await _dio.put(
        '/wx/change-password',
        data: {'oldPassword': oldPassword, 'newPassword': newPassword},
      );
    });
  }

  Future<void> bindPhone(String phone) {
    return guardApi(() async {
      await _dio.post('/wx/bind-phone', data: {'phone': phone});
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
