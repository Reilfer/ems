import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_exceptions.dart';
import '../../auth/providers/auth_provider.dart';

class DashboardProvider extends ChangeNotifier {
  AuthProvider? _auth;
  final ApiClient _api = ApiClient();

  Map<String, dynamic>? _stats;
  bool _isLoading = false;
  String? _error;

  Map<String, dynamic>? get stats => _stats;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    _auth = auth;
    if (auth.isAuthenticated && _stats == null && !_isLoading) {
      loadDashboard();
    }
  }

  Future<void> loadDashboard() async {
    if (_auth?.user == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {

      final studentsRes = await _api.get('${ApiConstants.students}/stats');
      final studentStats = studentsRes.data;

      int maleStudents = 0;
      int femaleStudents = 0;
      if (studentStats['byGender'] is List) {
        for (final g in studentStats['byGender']) {
          final gender = (g['gender'] ?? '').toString().toLowerCase();
          final count = g['count'] ?? 0;
          if (gender == 'nam' || gender == 'male') {
            maleStudents =
                count is int ? count : int.tryParse(count.toString()) ?? 0;
          } else if (gender == 'nữ' || gender == 'female') {
            femaleStudents =
                count is int ? count : int.tryParse(count.toString()) ?? 0;
          }
        }
      }

      int unreadNotifications = 0;
      try {
        final notifRes = await _api.get(
          '${ApiConstants.notifications}/user/${_auth!.user!.id}',
          queryParameters: {'page': '1', 'limit': '1'},
        );
        final data = notifRes.data;
        if (data is Map) {
          unreadNotifications = data['unread'] ?? 0;
        }
      } catch (_) {}

      _stats = {
        'totalStudents': studentStats['total'] ?? 0,
        'activeStudents': studentStats['active'] ?? 0,
        'maleStudents': maleStudents,
        'femaleStudents': femaleStudents,
        'classCount': studentStats['classCount'] ?? 0,
        'unreadNotifications': unreadNotifications,
      };

      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.userMessage;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Không thể tải dữ liệu';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refresh() => loadDashboard();
}
