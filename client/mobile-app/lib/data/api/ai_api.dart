import 'dart:convert';
import 'package:dio/dio.dart';
import '../../models/chat.dart';
import 'api_helpers.dart';
import 'app_exception.dart';
import 'http_client.dart';

class AiApi {
  final _dio = HttpClient.instance;

  Stream<String> sendMessage(String text) async* {
    try {
      final response = await _dio.post<ResponseBody>(
        '/ai/chat',
        data: {'text': text},
        options: Options(responseType: ResponseType.stream),
      );

      final stream = response.data?.stream;
      if (stream == null) return;

      var buffer = '';
      await for (final chunk in stream) {
        buffer += utf8.decode(chunk, allowMalformed: true);
        final lines = buffer.split('\n');
        buffer = lines.removeLast();

        for (final line in lines) {
          final payload = _parseSseLine(line);
          if (payload == null) continue;
          if (payload == '[DONE]') return;
          yield payload;
        }
      }

      if (buffer.isNotEmpty) {
        final payload = _parseSseLine(buffer);
        if (payload != null && payload != '[DONE]') {
          yield payload;
        }
      }
    } on DioException catch (error) {
      throw AppException.fromDioException(error);
    } on AppException {
      rethrow;
    } catch (error) {
      throw AppException('ai_stream_error', error.toString());
    }
  }

  Future<List<ChatHistoryItem>> getHistory() {
    return guardApi(() async {
      final response = await _dio.get('/ai/history');
      return responseList(
        response,
      ).map((item) => ChatHistoryItem.fromJson(mapValue(item))).toList();
    });
  }

  Future<void> clearHistory() {
    return guardApi(() async {
      await _dio.delete('/ai/history');
    });
  }
}

String? _parseSseLine(String line) {
  final trimmed = line.trim();
  if (trimmed.isEmpty || trimmed.startsWith(':')) return null;
  if (!trimmed.startsWith('data:')) return null;

  final payload = trimmed.substring(5).trim();
  return payload.isEmpty ? null : payload;
}
