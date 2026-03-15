import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_exceptions.dart';
import '../../auth/providers/auth_provider.dart';

class GradesProvider extends ChangeNotifier {
  AuthProvider? _auth;
  final ApiClient _api = ApiClient();

  List<Map<String, dynamic>> _scores = [];
  Map<String, dynamic>? _transcript;
  bool _isLoading = false;
  String? _error;

  List<Map<String, dynamic>> get scores => _scores;
  Map<String, dynamic>? get transcript => _transcript;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    _auth = auth;
  }

  Future<void> loadClassScores({
    required String classId,
    required String subjectId,
    required String academicYearId,
    required int semester,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(
        '${ApiConstants.grades}/class-scores',
        queryParameters: {
          'classId': classId,
          'subjectId': subjectId,
          'academicYearId': academicYearId,
          'semester': '$semester',
        },
      );

      final data = response.data;
      if (data is List) {
        _scores = List<Map<String, dynamic>>.from(data);
      } else if (data is Map && data['scores'] != null) {
        _scores = List<Map<String, dynamic>>.from(data['scores']);
      } else {
        _scores = [];
      }

      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.userMessage;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Không thể tải bảng điểm';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadStudentTranscript(String studentId, String academicYearId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(
        '${ApiConstants.grades}/transcript/$studentId',
        queryParameters: {'academicYearId': academicYearId},
      );

      _transcript = Map<String, dynamic>.from(response.data);
      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.userMessage;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Không thể tải bảng điểm';
      _isLoading = false;
      notifyListeners();
    }
  }
}
