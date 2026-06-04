import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../config/constants.dart';
import '../../config/routes.dart';
import 'app_exception.dart';

class HttpClient {
  HttpClient._();

  static const tokenKey = 'auth_token';
  static Dio? _instance;

  static Dio get instance {
    return _instance ??= _createDio();
  }

  static Dio _createDio() {
    final dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.apiBaseDev,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString(tokenKey);
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            final prefs = await SharedPreferences.getInstance();
            await prefs.remove(tokenKey);
            goRouter.go('/login');
          }

          handler.reject(
            error.copyWith(error: AppException.fromDioException(error)),
          );
        },
      ),
    );

    return dio;
  }
}
