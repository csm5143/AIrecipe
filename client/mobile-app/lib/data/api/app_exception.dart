import 'package:dio/dio.dart';

class AppException implements Exception {
  final String code;
  final String message;

  const AppException(this.code, this.message);

  factory AppException.fromDioException(DioException error) {
    final innerError = error.error;
    if (innerError is AppException) return innerError;

    final responseData = error.response?.data;
    final serverMessage = _serverMessage(responseData);
    if (serverMessage.isNotEmpty) {
      return AppException(
        error.response?.statusCode?.toString() ?? 'server_error',
        serverMessage,
      );
    }

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
        return const AppException('connection_timeout', '连接服务器超时');
      case DioExceptionType.sendTimeout:
        return const AppException('send_timeout', '请求发送超时');
      case DioExceptionType.receiveTimeout:
        return const AppException('receive_timeout', '服务器响应超时');
      case DioExceptionType.badCertificate:
        return const AppException('bad_certificate', '服务器证书校验失败');
      case DioExceptionType.badResponse:
        return AppException(
          error.response?.statusCode?.toString() ?? 'bad_response',
          _statusMessage(error.response?.statusCode),
        );
      case DioExceptionType.cancel:
        return const AppException('request_cancelled', '请求已取消');
      case DioExceptionType.connectionError:
        return const AppException('connection_error', '网络连接不可用');
      case DioExceptionType.unknown:
        return const AppException('network_error', '网络请求失败，请稍后再试');
    }
  }

  @override
  String toString() => 'AppException($code, $message)';
}

String _serverMessage(dynamic data) {
  if (data is Map) {
    return (data['message'] ?? data['error'] ?? data['msg'])?.toString() ?? '';
  }
  return '';
}

String _statusMessage(int? statusCode) {
  switch (statusCode) {
    case 400:
      return '请求参数有误';
    case 401:
      return '登录状态已失效，请重新登录';
    case 403:
      return '没有权限执行该操作';
    case 404:
      return '请求的内容不存在';
    case 500:
      return '服务器开小差了，请稍后再试';
    default:
      return '请求失败，请稍后再试';
  }
}
