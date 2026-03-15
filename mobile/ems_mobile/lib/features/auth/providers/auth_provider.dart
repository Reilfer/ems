import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../repositories/auth_repository.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/network/api_exceptions.dart';

class AuthProvider extends ChangeNotifier {
  final AuthRepository _repo = AuthRepository();

  User? _user;
  bool _isLoading = false;
  String? _error;
  bool _isInitialized = false;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;
  bool get isInitialized => _isInitialized;
  String get accessToken => ''; 

  AuthProvider() {
    _init();
  }

  Future<void> _init() async {
    try {

      await SecureStorage.clearAuthTokens();
    } catch (_) {}
    _isInitialized = true;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _repo.login(email, password);

      await SecureStorage.saveTokens(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      );
      await SecureStorage.saveUserData(jsonEncode(response.user.toJson()));

      _user = response.user;
      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.userMessage;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _repo.logout();
    } catch (_) {}
    await SecureStorage.clearAll();
    _user = null;
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
