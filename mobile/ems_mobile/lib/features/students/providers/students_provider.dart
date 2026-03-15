import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_exceptions.dart';
import '../../auth/providers/auth_provider.dart';

class StudentsProvider extends ChangeNotifier {
  AuthProvider? _auth;
  final ApiClient _api = ApiClient();

  List<Map<String, dynamic>> _students = [];
  Map<String, dynamic>? _selectedStudent;
  int _total = 0;
  int _page = 1;
  bool _isLoading = false;
  bool _isLoadingMore = false;
  String? _error;
  String _searchQuery = '';

  List<Map<String, dynamic>> get students => _students;
  Map<String, dynamic>? get selectedStudent => _selectedStudent;
  int get total => _total;
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  String? get error => _error;
  bool get hasMore => _students.length < _total;

  void updateAuth(AuthProvider auth) {
    _auth = auth;
  }

  Future<void> loadStudents({String? search}) async {
    _isLoading = true;
    _error = null;
    _page = 1;
    _searchQuery = search ?? '';
    notifyListeners();

    try {
      final response = await _api.get(
        ApiConstants.students,
        queryParameters: {
          'page': '1',
          'limit': '20',
          if (_searchQuery.isNotEmpty) 'search': _searchQuery,
        },
      );

      _parseResponse(response.data, clear: true);
      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.userMessage;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Không thể tải danh sách học sinh';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMore() async {
    if (_isLoadingMore || !hasMore) return;

    _isLoadingMore = true;
    _page++;
    notifyListeners();

    try {
      final response = await _api.get(
        ApiConstants.students,
        queryParameters: {
          'page': '$_page',
          'limit': '20',
          if (_searchQuery.isNotEmpty) 'search': _searchQuery,
        },
      );

      _parseResponse(response.data, clear: false);
      _isLoadingMore = false;
      notifyListeners();
    } catch (e) {
      _page--;
      _isLoadingMore = false;
      notifyListeners();
    }
  }

  void _parseResponse(dynamic data, {required bool clear}) {
    if (data is Map) {
      final list = data['data'];
      if (list is List) {
        if (clear) {
          _students = List<Map<String, dynamic>>.from(list);
        } else {
          _students.addAll(List<Map<String, dynamic>>.from(list));
        }
      }

      final meta = data['meta'];
      if (meta is Map) {
        _total = meta['total'] ?? _students.length;
      } else {
        _total = data['total'] ?? _students.length;
      }
    } else if (data is List) {
      if (clear) {
        _students = List<Map<String, dynamic>>.from(data);
      } else {
        _students.addAll(List<Map<String, dynamic>>.from(data));
      }
      _total = _students.length;
    }
  }

  Future<void> loadStudentDetail(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get('${ApiConstants.students}/$id');
      _selectedStudent = Map<String, dynamic>.from(response.data);
      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.userMessage;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Không thể tải thông tin học sinh';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createStudent(Map<String, dynamic> data) async {
    try {
      final response = await _api.post(ApiConstants.students, data: data);
      final newStudent = response.data is Map
          ? Map<String, dynamic>.from(response.data)
          : null;
      if (newStudent != null) {
        _students.insert(0, newStudent);
        _total++;
        notifyListeners();
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> updateStudent(String id, Map<String, dynamic> data) async {
    try {
      await _api.patch('${ApiConstants.students}/$id', data: data);
      final idx = _students.indexWhere((s) => s['id'] == id);
      if (idx >= 0) {
        _students[idx] = {..._students[idx], ...data};
        notifyListeners();
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> deleteStudent(String id) async {
    try {
      await _api.delete('${ApiConstants.students}/$id');
      _students.removeWhere((s) => s['id'] == id);
      _total--;
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }
}
