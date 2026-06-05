import '../../models/user.dart';
import 'api_helpers.dart';
import 'http_client.dart';

class UserApi {
  final _dio = HttpClient.instance;

  Future<AppUser> getUserProfile(String id) {
    return guardApi(() async {
      final response = await _dio.get(
        id == 'me' ? '/wx/userinfo' : '/users/$id',
      );
      return AppUser.fromJson(responseMap(response));
    });
  }

  Future<AppUser> getCurrentProfile() {
    return guardApi(() async {
      final response = await _dio.get('/wx/userinfo');
      return AppUser.fromJson(responseMap(response));
    });
  }

  Future<AppUser> updateProfile(Map<String, dynamic> data) {
    return guardApi(() async {
      await _dio.put('/wx/userinfo', data: data);
      final profile = await _dio.get('/wx/userinfo');
      return AppUser.fromJson(responseMap(profile));
    });
  }

  Future<void> followUser(String id) {
    return guardApi(() async {
      await _dio.post('/users/$id/follow');
    });
  }

  Future<void> unfollowUser(String id) {
    return guardApi(() async {
      await _dio.delete('/users/$id/follow');
    });
  }
}
