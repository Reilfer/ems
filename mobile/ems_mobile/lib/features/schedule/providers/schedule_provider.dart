import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_exceptions.dart';
import '../../auth/providers/auth_provider.dart';

class ScheduleProvider extends ChangeNotifier {
  AuthProvider? _auth;
  final ApiClient _api = ApiClient();

  List<Map<String, dynamic>> _slots = [];
  bool _isLoading = false;
  String? _error;

  List<Map<String, dynamic>> get slots => _slots;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    _auth = auth;
  }

  Future<void> loadTimetable({String? schoolId}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final user = _auth?.user;
      final role = user?.role ?? '';
      final userId = user?.id ?? '';
      final sid = schoolId ?? user?.schoolId ?? '';

      String url;
      Map<String, String> queryParams = {};

      if (role == 'TEACHER') {

        url = '${ApiConstants.timetable}/teacher/$userId';
      } else if (role == 'STUDENT' || role == 'PARENT') {

        url = '${ApiConstants.timetable}/class/$userId';
      } else {

        url = ApiConstants.timetable;
        queryParams = {'schoolId': sid};
      }

      final response = await _api.get(url, queryParameters: queryParams.isNotEmpty ? queryParams : null);

      final data = response.data;
      if (data is List) {
        _slots = List<Map<String, dynamic>>.from(data);
      } else if (data is Map) {

        if (data['slots'] != null) {
          _slots = List<Map<String, dynamic>>.from(data['slots']);
        } else if (data['data'] != null) {
          _slots = List<Map<String, dynamic>>.from(data['data']);
        } else {
          _slots = [];
        }
      } else {
        _slots = [];
      }

      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.userMessage;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Không thể tải thời khóa biểu';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refresh() => loadTimetable();

  Future<void> createSlot(Map<String, dynamic> data) async {
    final response = await _api.post(ApiConstants.timetable, data: data);
    final created = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : (response.data['data'] as Map<String, dynamic>? ?? data);
    _slots.insert(0, created);
    notifyListeners();
  }

  Future<void> deleteSlot(String id) async {
    await _api.delete('${ApiConstants.timetable}/$id');
    _slots.removeWhere((s) => s['id'].toString() == id);
    notifyListeners();
  }
}
