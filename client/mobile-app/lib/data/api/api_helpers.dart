import 'package:dio/dio.dart';
import 'app_exception.dart';

Future<T> guardApi<T>(Future<T> Function() request) async {
  try {
    return await request();
  } on DioException catch (error) {
    throw AppException.fromDioException(error);
  } on AppException {
    rethrow;
  } catch (error) {
    throw AppException('unknown_error', error.toString());
  }
}

dynamic responseData(Response<dynamic> response) {
  final data = response.data;
  if (data is Map && data.containsKey('data')) return data['data'];
  if (data is Map && data.containsKey('result')) return data['result'];
  return data;
}

Map<String, dynamic> responseMap(Response<dynamic> response) {
  final data = responseData(response);
  if (data is Map<String, dynamic>) return data;
  if (data is Map) return Map<String, dynamic>.from(data);
  return <String, dynamic>{};
}

List<dynamic> responseList(Response<dynamic> response) {
  final data = responseData(response);
  if (data is List) return data;
  if (data is Map && data['items'] is List) return data['items'] as List;
  if (data is Map && data['list'] is List) return data['list'] as List;
  return const [];
}

Map<String, dynamic> mapValue(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return <String, dynamic>{};
}
