import 'package:dio/dio.dart';

import '../../models/chat.dart';
import 'api_helpers.dart';
import 'http_client.dart';

class AiApi {
  final _dio = HttpClient.instance;

  Future<ChatReply> sendMessage({
    required String text,
    String? sessionId,
    List<String> imageUrls = const [],
    CancelToken? cancelToken,
  }) {
    return guardApi(() async {
      final data = <String, dynamic>{'text': text};
      if (sessionId != null) data['sessionId'] = sessionId;
      if (imageUrls.isNotEmpty) data['imageUrls'] = imageUrls;

      final response = await _dio.post(
        '/wx/app/ai-chat',
        data: data,
        cancelToken: cancelToken,
      );
      return ChatReply.fromJson(responseMap(response));
    });
  }

  Future<ChatReply> continueAgent({
    required int sessionId,
    required int messageId,
    required List<Map<String, dynamic>> actions,
  }) {
    return guardApi(() async {
      final response = await _dio.post(
        '/wx/app/ai-chat/continue',
        data: {
          'sessionId': sessionId,
          'messageId': messageId,
          'actions': actions,
        },
      );
      return ChatReply.fromJson(responseMap(response));
    });
  }

  Future<ChatReply> editMessage({
    required String messageId,
    required String text,
  }) {
    return guardApi(() async {
      final response = await _dio.put(
        '/wx/app/ai-chat/messages/$messageId',
        data: {'text': text},
      );
      return ChatReply.fromJson(responseMap(response));
    });
  }

  Future<void> deleteMessage(String messageId) {
    return guardApi(() async {
      await _dio.delete('/wx/app/ai-chat/messages/$messageId');
    });
  }

  Future<void> deleteSession(String sessionId) {
    return guardApi(() async {
      await _dio.delete('/wx/app/ai-chat/sessions/$sessionId');
    });
  }

  Future<List<ChatHistoryItem>> getHistory() {
    return guardApi(() async {
      final response = await _dio.get('/wx/app/ai-chat/sessions');
      return responseList(
        response,
      ).map((item) => ChatHistoryItem.fromJson(mapValue(item))).toList();
    });
  }

  Future<List<ChatMessage>> getSessionMessages(String sessionId) {
    return guardApi(() async {
      final response = await _dio.get(
        '/wx/app/ai-chat/sessions/$sessionId/messages',
      );
      return responseList(
        response,
      ).map((item) => ChatMessage.fromJson(mapValue(item))).toList();
    });
  }
}
