import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_exceptions.dart';
import '../../auth/providers/auth_provider.dart';

class AttendanceProvider extends ChangeNotifier {
  AuthProvider? _auth;
  final ApiClient _api = ApiClient();

  List<Map<String, dynamic>> _activeSessions = [];
  List<Map<String, dynamic>> _records = [];
  bool _isLoading = false;
  String? _error;
  String? _scanResult;
  bool _scanSuccess = false;

  List<Map<String, dynamic>> get activeSessions => _activeSessions;
  List<Map<String, dynamic>> get records => _records;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get scanResult => _scanResult;
  bool get scanSuccess => _scanSuccess;

  void updateAuth(AuthProvider auth) {
    _auth = auth;
  }

  Future<void> loadActiveSessions() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response =
          await _api.get('${ApiConstants.attendanceSessions}/active');
      final data = response.data;
      if (data is List) {
        _activeSessions = List<Map<String, dynamic>>.from(data);
      } else {
        _activeSessions = [];
      }
      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.userMessage;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Không thể tải phiên điểm danh';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadRecords({String? date, String? classId}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(
        ApiConstants.attendanceRecords,
        queryParameters: {
          if (date != null) 'date': date,
          if (classId != null) 'classId': classId,
        },
      );
      final data = response.data;
      if (data is List) {
        _records = List<Map<String, dynamic>>.from(data);
      } else {
        _records = [];
      }
      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.userMessage;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Không thể tải bản ghi điểm danh';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> scanQR({
    required String sessionId,
    required String studentId,
    required String qrPayload,
    required String qrSignature,
    double? deviceLat,
    double? deviceLng,
  }) async {
    _scanResult = null;
    _scanSuccess = false;
    notifyListeners();

    try {
      final response = await _api.post(
        ApiConstants.attendanceScan,
        data: {
          'sessionId': sessionId,
          'studentId': studentId,
          'qrPayload': qrPayload,
          'qrSignature': qrSignature,
          'deviceTimestamp': DateTime.now().toIso8601String(),
          if (deviceLat != null) 'deviceLat': deviceLat,
          if (deviceLng != null) 'deviceLng': deviceLng,
        },
      );

      final data = response.data;
      if (data['success'] == true) {
        _scanSuccess = true;
        _scanResult = 'Điểm danh thành công!';
      } else {
        _scanSuccess = false;
        final failures = data['failures'] as List? ?? [];
        _scanResult =
            failures.isNotEmpty ? failures.first : 'Điểm danh thất bại';
      }

      notifyListeners();
      return _scanSuccess;
    } on ApiException catch (e) {
      _scanSuccess = false;
      _scanResult = e.userMessage;
      notifyListeners();
      return false;
    } catch (e) {
      _scanSuccess = false;
      _scanResult = 'Lỗi kết nối. Vui lòng thử lại.';
      notifyListeners();
      return false;
    }
  }

  void clearScanResult() {
    _scanResult = null;
    _scanSuccess = false;
    notifyListeners();
  }

  Future<void> refresh() => loadActiveSessions();

  Future<Map<String, dynamic>> createSession({
    required String classId,
    required String className,
    String? teacherId,
  }) async {
    final response = await _api.post(
      ApiConstants.attendanceSessions,
      data: {
        'classId': classId,
        'className': className,
        if (teacherId != null) 'teacherId': teacherId,
        'date': DateTime.now().toIso8601String().split('T').first,
      },
    );
    final created = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : (response.data?['data'] as Map<String, dynamic>? ?? {});
    _activeSessions.insert(0, created);
    notifyListeners();
    return created;
  }

  Future<void> deactivateSession(String sessionId) async {
    await _api.patch('${ApiConstants.attendanceSessions}/$sessionId/deactivate');
    _activeSessions.removeWhere((s) => s['id'].toString() == sessionId);
    notifyListeners();
  }
}
