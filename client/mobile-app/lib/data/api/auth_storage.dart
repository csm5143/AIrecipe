import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class AuthStorage {
  AuthStorage._();

  static const tokenKey = 'auth_token';
  static const refreshTokenKey = 'refresh_token';
  static const userIdKey = 'auth_user_id';
  static const _searchHistoryKey = 'search_history';

  static Future<String> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(tokenKey) ?? '';
  }

  static Future<void> saveSession({
    required String token,
    String refreshToken = '',
    String userId = '',
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(tokenKey, token);
    if (refreshToken.isNotEmpty) {
      await prefs.setString(refreshTokenKey, refreshToken);
    }
    if (userId.isNotEmpty) {
      await prefs.setString(userIdKey, userId);
    }
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(tokenKey);
    await prefs.remove(refreshTokenKey);
    await prefs.remove(userIdKey);
  }

  /// 搜索历史（最多存 10 条，最新在前）
  static Future<List<String>> getSearchHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_searchHistoryKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      return (json.decode(raw) as List).cast<String>();
    } catch (_) {
      return [];
    }
  }

  static Future<void> addSearchHistory(String keyword) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getSearchHistory();
    list.remove(keyword); // 去重
    list.insert(0, keyword); // 最新在前
    if (list.length > 10) list.removeLast();
    await prefs.setString(_searchHistoryKey, json.encode(list));
  }

  static Future<void> clearSearchHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_searchHistoryKey);
  }
}
