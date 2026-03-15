import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_exceptions.dart';
import '../../auth/providers/auth_provider.dart';

class TeachersProvider extends ChangeNotifier {
  AuthProvider? _auth;
  final ApiClient _api = ApiClient();

  List<Map<String, dynamic>> _teachers = [];
  List<Map<String, dynamic>> _users = [];
  Map<String, dynamic>? _selectedTeacher;
  int _total = 0;
  int _page = 1;
  bool _isLoading = false;
  bool _isLoadingMore = false;
  String? _error;
  String _searchQuery = '';

  List<Map<String, dynamic>> get teachers => _teachers;
  List<Map<String, dynamic>> get users => _users;
  Map<String, dynamic>? get selectedTeacher => _selectedTeacher;
  int get total => _total;
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  String? get error => _error;
  bool get hasMore => _teachers.length < _total;

  void updateAuth(AuthProvider auth) {
    _auth = auth;
  }

  Future<void> loadTeachers({String? search}) async {
    _isLoading = true;
    _error = null;
    _page = 1;
    _searchQuery = search ?? '';
    notifyListeners();

    try {
      final response = await _api.get(
        ApiConstants.teachers,
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
      _error = 'Không thể tải danh sách giáo viên';
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
        ApiConstants.teachers,
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
          _teachers = List<Map<String, dynamic>>.from(list);
        } else {
          _teachers.addAll(List<Map<String, dynamic>>.from(list));
        }
      }
      final meta = data['meta'];
      if (meta is Map) {
        _total = meta['total'] ?? _teachers.length;
      } else {
        _total = data['total'] ?? _teachers.length;
      }
    } else if (data is List) {
      if (clear) {
        _teachers = List<Map<String, dynamic>>.from(data);
      } else {
        _teachers.addAll(List<Map<String, dynamic>>.from(data));
      }
      _total = _teachers.length;
    }
  }

  Future<void> loadTeacherDetail(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get('${ApiConstants.teachers}/$id');
      _selectedTeacher = Map<String, dynamic>.from(response.data);
      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.userMessage;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Không thể tải thông tin giáo viên';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadUsers({String? search, String? role}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(
        ApiConstants.users,
        queryParameters: {
          'page': '1',
          'limit': '50',
          if (search != null && search.isNotEmpty) 'search': search,
          if (role != null && role.isNotEmpty) 'role': role,
        },
      );

      final data = response.data;
      if (data is Map && data['data'] is List) {
        _users = List<Map<String, dynamic>>.from(data['data']);
      } else if (data is List) {
        _users = List<Map<String, dynamic>>.from(data);
      }

      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.userMessage;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Không thể tải danh sách tài khoản';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> toggleUserActive(String userId) async {
    try {
      await _api.patch('${ApiConstants.users}/$userId/toggle-active');

      final idx = _users.indexWhere((u) => u['id'] == userId);
      if (idx >= 0) {
        final current = _users[idx]['status'] ?? 'active';
        _users[idx]['status'] = current == 'active' ? 'inactive' : 'active';
        notifyListeners();
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> refresh() => loadTeachers(search: _searchQuery);

  Future<void> createUser(Map<String, dynamic> data) async {
    final response = await _api.post('${ApiConstants.baseUrl}/api/v1/auth/register', data: data);
    final created = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : (response.data?['data'] as Map<String, dynamic>? ?? data);
    _users.insert(0, created);
    notifyListeners();
  }

  Future<void> updateUser(String id, Map<String, dynamic> data) async {
    await _api.patch('${ApiConstants.baseUrl}/api/v1/users/$id', data: data);
    final idx = _users.indexWhere((u) => u['id'].toString() == id);
    if (idx >= 0) {
      _users[idx] = {..._users[idx], ...data};
      notifyListeners();
    }
  }

  Future<void> deleteUser(String id) async {
    await _api.delete('${ApiConstants.baseUrl}/api/v1/users/$id');
    _users.removeWhere((u) => u['id'].toString() == id);
    notifyListeners();
  }
}
