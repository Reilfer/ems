import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../models/user_model.dart';

class AuthRepository {
  final ApiClient _api = ApiClient();

  Future<LoginResponse> login(String email, String password) async {
    final response = await _api.post(
      ApiConstants.login,
      data: {'email': email, 'password': password},
    );
    return LoginResponse.fromJson(response.data);
  }

  Future<User> getProfile() async {
    final response = await _api.get(ApiConstants.me);
    return User.fromJson(response.data);
  }

  Future<void> logout() async {
    await _api.post(ApiConstants.logout);
  }

  Future<LoginResponse> refreshToken(String refreshToken) async {
    final response = await _api.post(
      ApiConstants.refreshToken,
      data: {'refreshToken': refreshToken},
    );
    return LoginResponse.fromJson(response.data);
  }
}
