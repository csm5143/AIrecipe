import 'package:dio/dio.dart';
import '../../config/constants.dart';
import '../../config/routes.dart';
import 'app_exception.dart';
import 'auth_storage.dart';

class HttpClient {
  HttpClient._();

  static const tokenKey = AuthStorage.tokenKey;
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
          final token = await AuthStorage.getToken();
          if (token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            await AuthStorage.clearSession();
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
