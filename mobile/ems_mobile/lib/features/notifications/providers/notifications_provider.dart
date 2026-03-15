import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_exceptions.dart';
import '../../auth/providers/auth_provider.dart';

class NotificationsProvider extends ChangeNotifier {
  AuthProvider? _auth;
  final ApiClient _api = ApiClient();

  List<Map<String, dynamic>> _notifications = [];
  int _total = 0;
  int _unread = 0;
  bool _isLoading = false;
  String? _error;

  List<Map<String, dynamic>> get notifications => _notifications;
  int get total => _total;
  int get unread => _unread;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    _auth = auth;
  }

  Future<void> loadNotifications() async {
    if (_auth?.user == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(
        '${ApiConstants.notifications}/user/${_auth!.user!.id}',
        queryParameters: {'page': '1', 'limit': '50'},
      );

      final data = response.data;
      if (data is Map) {

        final list = data['notifications'] ?? data['data'];
        if (list is List) {
          _notifications = List<Map<String, dynamic>>.from(list);
        }
        final meta = data['meta'];
        if (meta is Map) {
          _total = meta['total'] ?? _notifications.length;
        } else {
          _total = data['total'] ?? _notifications.length;
        }
        _unread = data['unread'] ??
            _notifications.where((n) => n['isRead'] != true).length;
      } else if (data is List) {
        _notifications = List<Map<String, dynamic>>.from(data);
        _total = _notifications.length;
        _unread = _notifications.where((n) => n['isRead'] != true).length;
      }

      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.userMessage;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Không thể tải thông báo';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markRead(String id) async {
    try {
      await _api.patch('${ApiConstants.notifications}/$id/read');
      final index = _notifications.indexWhere((n) => n['id'] == id);
      if (index >= 0) {
        _notifications[index]['isRead'] = true;
        _unread = _notifications.where((n) => n['isRead'] != true).length;
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> markAllRead() async {
    if (_auth?.user == null) return;
    try {
      await _api.patch(
        '${ApiConstants.notifications}/user/${_auth!.user!.id}/read-all',
      );
      for (var n in _notifications) {
        n['isRead'] = true;
      }
      _unread = 0;
      notifyListeners();
    } catch (_) {}
  }

  Future<bool> sendNotification({
    required String recipientId,
    required String title,
    required String content,
    String type = 'INFO',
  }) async {
    if (_auth?.user == null) return false;
    try {
      await _api.post(
        '${ApiConstants.notifications}/send',
        data: {
          'schoolId': _auth!.user!.school?.id ?? '',
          'recipientId': recipientId,
          'senderId': _auth!.user!.id,
          'title': title,
          'content': content,
          'type': type,
          'channels': ['in_app', 'push'],
        },
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> broadcast({
    required String title,
    required String content,
    String type = 'INFO',
    String targetRole = 'all',
    List<String>? targetUserIds,
  }) async {
    if (_auth?.user == null) return false;
    try {
      await _api.post(
        '${ApiConstants.notifications}/broadcast',
        data: {
          'schoolId': _auth!.user!.school?.id ?? '',
          'senderId': _auth!.user!.id,
          'title': title,
          'content': content,
          'type': type,
          if (targetUserIds != null && targetUserIds.isNotEmpty)
            'targetUserIds': targetUserIds
          else
            'targetRole': targetRole,
        },
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> deleteNotification(String id) async {
    try {
      await _api.delete('${ApiConstants.notifications}/$id');
      _notifications.removeWhere((n) => n['id'] == id);
      _total--;
      _unread = _notifications.where((n) => n['isRead'] != true).length;
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> refresh() => loadNotifications();
}
