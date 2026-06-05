import '../../models/chat.dart';
import 'api_helpers.dart';
import 'http_client.dart';

class AiApi {
  final _dio = HttpClient.instance;

  Future<ChatReply> sendMessage({required String text, String? sessionId}) {
    return guardApi(() async {
      final data = <String, dynamic>{'text': text};
      if (sessionId != null) data['sessionId'] = sessionId;

      final response = await _dio.post('/wx/app/ai-chat', data: data);
      return ChatReply.fromJson(responseMap(response));
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
