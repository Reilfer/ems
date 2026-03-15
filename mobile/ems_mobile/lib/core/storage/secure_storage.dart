import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: AppConstants.accessTokenKey, value: accessToken),
      _storage.write(key: AppConstants.refreshTokenKey, value: refreshToken),
    ]);
  }

  static Future<String?> getAccessToken() {
    return _storage.read(key: AppConstants.accessTokenKey);
  }

  static Future<String?> getRefreshToken() {
    return _storage.read(key: AppConstants.refreshTokenKey);
  }

  static Future<void> saveUserData(String json) {
    return _storage.write(key: AppConstants.userDataKey, value: json);
  }

  static Future<String?> getUserData() {
    return _storage.read(key: AppConstants.userDataKey);
  }

  static Future<void> clearAll() {
    return _storage.deleteAll();
  }

  static Future<void> clearAuthTokens() async {
    await Future.wait([
      _storage.delete(key: AppConstants.accessTokenKey),
      _storage.delete(key: AppConstants.refreshTokenKey),
      _storage.delete(key: AppConstants.userDataKey),
    ]);
  }

  static const _savedEmailKey = 'saved_email';
  static const _savedPasswordKey = 'saved_password';
  static const _rememberMeKey = 'remember_me';
  static const _biometricLoginKey = 'biometric_login_enabled';

  static Future<void> saveCredentials(String email, String password) async {
    await Future.wait([
      _storage.write(key: _savedEmailKey, value: email),
      _storage.write(key: _savedPasswordKey, value: password),
      _storage.write(key: _rememberMeKey, value: 'true'),
    ]);
  }

  static Future<void> clearCredentials() async {
    await Future.wait([
      _storage.delete(key: _savedEmailKey),
      _storage.delete(key: _savedPasswordKey),
      _storage.write(key: _rememberMeKey, value: 'false'),
    ]);
  }

  static Future<String?> getSavedEmail() {
    return _storage.read(key: _savedEmailKey);
  }

  static Future<String?> getSavedPassword() {
    return _storage.read(key: _savedPasswordKey);
  }

  static Future<bool> isRememberMe() async {
    final v = await _storage.read(key: _rememberMeKey);
    return v == 'true';
  }

  static Future<void> setBiometricLoginEnabled(bool enabled) {
    return _storage.write(key: _biometricLoginKey, value: enabled.toString());
  }

  static Future<bool> isBiometricLoginEnabled() async {
    final v = await _storage.read(key: _biometricLoginKey);
    return v == 'true';
  }
}
