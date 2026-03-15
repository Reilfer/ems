import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_exceptions.dart';
import '../../auth/providers/auth_provider.dart';

class EnrollmentProvider extends ChangeNotifier {
  AuthProvider? _auth;
  final ApiClient _api = ApiClient();

  List<Map<String, dynamic>> _applications = [];
  List<Map<String, dynamic>> _leads = [];
  int _totalApplications = 0;
  int _totalLeads = 0;
  bool _isLoading = false;
  String? _error;

  List<Map<String, dynamic>> get applications => _applications;
  List<Map<String, dynamic>> get leads => _leads;
  int get totalApplications => _totalApplications;
  int get totalLeads => _totalLeads;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    _auth = auth;
  }

  Future<void> loadApplications({String? status}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(
        ApiConstants.enrollmentApplications,
        queryParameters: {
          'page': '1',
          'limit': '50',
          if (status != null && status.isNotEmpty) 'status': status,
        },
      );

      final data = response.data;
      if (data is Map && data['data'] is List) {
        _applications = List<Map<String, dynamic>>.from(data['data']);
        _totalApplications =
            (data['meta'] as Map?)?['total'] ?? _applications.length;
      } else if (data is List) {
        _applications = List<Map<String, dynamic>>.from(data);
        _totalApplications = _applications.length;
      }

      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.userMessage;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Không thể tải hồ sơ tuyển sinh';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadLeads({String? status}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(
        ApiConstants.enrollmentLeads,
        queryParameters: {
          'page': '1',
          'limit': '50',
          if (status != null && status.isNotEmpty) 'status': status,
        },
      );

      final data = response.data;
      if (data is Map && data['data'] is List) {
        _leads = List<Map<String, dynamic>>.from(data['data']);
        _totalLeads = (data['meta'] as Map?)?['total'] ?? _leads.length;
      } else if (data is List) {
        _leads = List<Map<String, dynamic>>.from(data);
        _totalLeads = _leads.length;
      }

      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.userMessage;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Không thể tải danh sách leads';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateApplicationStatus(String id, String newStatus) async {
    try {
      await _api.patch(
        '${ApiConstants.enrollmentApplications}/$id',
        data: {'status': newStatus},
      );
      final idx = _applications.indexWhere((a) => a['id'] == id);
      if (idx >= 0) {
        _applications[idx]['status'] = newStatus;
        notifyListeners();
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> updateLeadStatus(String id, String newStatus) async {
    try {
      await _api.patch(
        '${ApiConstants.enrollmentLeads}/$id',
        data: {'status': newStatus},
      );
      final idx = _leads.indexWhere((l) => l['id'] == id);
      if (idx >= 0) {
        _leads[idx]['status'] = newStatus;
        notifyListeners();
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> refreshApplications() => loadApplications();
  Future<void> refreshLeads() => loadLeads();
}
