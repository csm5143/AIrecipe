import 'api_helpers.dart';
import 'http_client.dart';

class FeedbackApi {
  final _dio = HttpClient.instance;

  Future<void> submitFeedback({
    required String type,
    required String content,
    String contact = '',
  }) {
    return guardApi(() async {
      await _dio.post(
        '/wx/app/feedback',
        data: {'type': type, 'content': content, 'contact': contact},
      );
    });
  }
}
