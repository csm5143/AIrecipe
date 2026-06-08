import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/api/app_exception.dart';
import '../data/api/auth_storage.dart';
import '../models/user.dart';
import 'api_providers.dart';

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>(
  (ref) {
    return AuthController(ref)..restoreSession();
  },
);

class AuthState {
  final bool isInitialized;
  final bool isLoading;
  final AppUser? user;
  final AppException? error;

  const AuthState({
    this.isInitialized = false,
    this.isLoading = false,
    this.user,
    this.error,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    bool? isInitialized,
    bool? isLoading,
    AppUser? user,
    bool clearUser = false,
    AppException? error,
    bool clearError = false,
  }) {
    return AuthState(
      isInitialized: isInitialized ?? this.isInitialized,
      isLoading: isLoading ?? this.isLoading,
      user: clearUser ? null : user ?? this.user,
      error: clearError ? null : error ?? this.error,
    );
  }
}

class AuthController extends StateNotifier<AuthState> {
  final Ref _ref;

  AuthController(this._ref) : super(const AuthState());

  Future<void> restoreSession() async {
    final token = await AuthStorage.getToken();
    if (token.isEmpty) {
      state = state.copyWith(isInitialized: true, clearUser: true);
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _ref.read(authApiProvider).currentUser();
      state = AuthState(isInitialized: true, user: user);
    } catch (error) {
      await AuthStorage.clearSession();
      state = AuthState(isInitialized: true, error: _toAppException(error));
    }
  }

  ({String? phone, String? email}) _splitAccount(String account) {
    final normalized = account.trim();
    if (normalized.contains('@')) {
      return (phone: null, email: normalized.toLowerCase());
    }
    return (phone: normalized, email: null);
  }

  Future<void> sendVerificationCode(String account, String type) async {
    final target = _splitAccount(account);
    await _ref
        .read(authApiProvider)
        .sendVerificationCode(
          phone: target.phone,
          email: target.email,
          type: type,
        );
  }

  Future<void> login(String account, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final target = _splitAccount(account);
      final session = await _ref
          .read(authApiProvider)
          .accountLogin(
            phone: target.phone,
            email: target.email,
            password: password,
          );
      state = AuthState(isInitialized: true, user: session.user);
    } catch (error) {
      state = state.copyWith(
        isInitialized: true,
        isLoading: false,
        error: _toAppException(error),
      );
      rethrow;
    }
  }

  Future<void> register(
    String account,
    String password,
    String nickname,
    String verifyCode,
  ) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final target = _splitAccount(account);
      final session = await _ref
          .read(authApiProvider)
          .accountRegister(
            phone: target.phone,
            email: target.email,
            password: password,
            nickname: nickname,
            verifyCode: verifyCode,
          );
      state = AuthState(isInitialized: true, user: session.user);
    } catch (error) {
      state = state.copyWith(
        isInitialized: true,
        isLoading: false,
        error: _toAppException(error),
      );
      rethrow;
    }
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _ref.read(userApiProvider).updateProfile(data);
      state = state.copyWith(isLoading: false, user: user);
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _toAppException(error));
      rethrow;
    }
  }

  Future<void> changePassword(String oldPassword, String newPassword) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _ref
          .read(authApiProvider)
          .changePassword(oldPassword: oldPassword, newPassword: newPassword);
      state = state.copyWith(isLoading: false);
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _toAppException(error));
      rethrow;
    }
  }

  Future<void> resetPassword(
    String account,
    String verifyCode,
    String newPassword,
  ) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final target = _splitAccount(account);
      await _ref
          .read(authApiProvider)
          .resetPassword(
            phone: target.phone,
            email: target.email,
            verifyCode: verifyCode,
            newPassword: newPassword,
          );
      state = state.copyWith(isLoading: false);
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _toAppException(error));
      rethrow;
    }
  }

  Future<void> bindPhone(String phone) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _ref.read(authApiProvider).bindPhone(phone);
      final user = await _ref.read(authApiProvider).currentUser();
      state = state.copyWith(isLoading: false, user: user);
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _toAppException(error));
      rethrow;
    }
  }

  Future<void> bindEmail(String email, String verifyCode) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _ref
          .read(authApiProvider)
          .bindEmail(email: email, verifyCode: verifyCode);
      final user = await _ref.read(authApiProvider).currentUser();
      state = state.copyWith(isLoading: false, user: user);
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _toAppException(error));
      rethrow;
    }
  }

  Future<void> logout() async {
    await _ref.read(authApiProvider).logout();
    state = const AuthState(isInitialized: true);
  }
}

AppException _toAppException(Object error) {
  if (error is AppException) return error;
  return AppException('unknown_error', error.toString());
}
