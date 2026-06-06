import 'api_helpers.dart';
import 'http_client.dart';

class NotificationApi {
  final _dio = HttpClient.instance;

  /// 获取通知列表
  Future<Map<String, dynamic>> getNotifications({int page = 1, int pageSize = 20}) {
    return guardApi(() async {
      final response = await _dio.get('/wx/app/notifications', queryParameters: {
        'page': page,
        'pageSize': pageSize,
      });
      return responseMap(response);
    });
  }

  /// 未读计数
  Future<int> getUnreadCount() {
    return guardApi(() async {
      final response = await _dio.get('/wx/app/notifications/unread-count');
      final data = responseMap(response);
      return (data['count'] as int?) ?? 0;
    });
  }

  /// 全部已读
  Future<void> markAllRead() {
    return guardApi(() async {
      await _dio.put('/wx/app/notifications/read-all');
    });
  }

  /// 标记单条已读
  Future<void> markRead(String id) {
    return guardApi(() async {
      await _dio.put('/wx/app/notifications/$id/read');
    });
  }

  /// 删除通知
  Future<void> deleteNotification(String id) {
    return guardApi(() async {
      await _dio.delete('/wx/app/notifications/$id');
    });
  }
}
