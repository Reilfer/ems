import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';

class ShellScaffold extends StatelessWidget {
  final Widget child;

  const ShellScaffold({super.key, required this.child});

  static const _adminDestinations = [
    NavigationDestination(
        icon: Icon(Icons.dashboard_outlined),
        selectedIcon: Icon(Icons.dashboard),
        label: 'Dashboard'),
    NavigationDestination(
        icon: Icon(Icons.people_outlined),
        selectedIcon: Icon(Icons.people),
        label: 'Học sinh'),
    NavigationDestination(
        icon: Icon(Icons.fact_check_outlined),
        selectedIcon: Icon(Icons.fact_check),
        label: 'Điểm danh'),
    NavigationDestination(
        icon: Icon(Icons.calendar_today_outlined),
        selectedIcon: Icon(Icons.calendar_today),
        label: 'Thời khóa biểu'),
    NavigationDestination(
        icon: Icon(Icons.notifications_outlined),
        selectedIcon: Icon(Icons.notifications),
        label: 'Thông báo'),
  ];
  static const _adminRoutes = [
    '/',
    '/students',
    '/attendance',
    '/schedule',
    '/notifications'
  ];

  static const _teacherDestinations = [
    NavigationDestination(
        icon: Icon(Icons.dashboard_outlined),
        selectedIcon: Icon(Icons.dashboard),
        label: 'Tổng quan'),
    NavigationDestination(
        icon: Icon(Icons.fact_check_outlined),
        selectedIcon: Icon(Icons.fact_check),
        label: 'Điểm danh'),
    NavigationDestination(
        icon: Icon(Icons.assignment_outlined),
        selectedIcon: Icon(Icons.assignment),
        label: 'Bài tập'),
    NavigationDestination(
        icon: Icon(Icons.calendar_today_outlined),
        selectedIcon: Icon(Icons.calendar_today),
        label: 'Lịch dạy'),
    NavigationDestination(
        icon: Icon(Icons.notifications_outlined),
        selectedIcon: Icon(Icons.notifications),
        label: 'Hộp thư'),
  ];
  static const _teacherRoutes = [
    '/',
    '/attendance',
    '/assignments',
    '/schedule',
    '/notifications'
  ];

  static const _studentDestinations = [
    NavigationDestination(
        icon: Icon(Icons.home_outlined),
        selectedIcon: Icon(Icons.home),
        label: 'Trang chủ'),
    NavigationDestination(
        icon: Icon(Icons.assignment_outlined),
        selectedIcon: Icon(Icons.assignment),
        label: 'Bài tập'),
    NavigationDestination(
        icon: Icon(Icons.leaderboard_outlined),
        selectedIcon: Icon(Icons.leaderboard),
        label: 'Kết quả'),
    NavigationDestination(
        icon: Icon(Icons.calendar_today_outlined),
        selectedIcon: Icon(Icons.calendar_today),
        label: 'Lịch học'),
    NavigationDestination(
        icon: Icon(Icons.notifications_outlined),
        selectedIcon: Icon(Icons.notifications),
        label: 'Thông báo'),
  ];
  static const _studentRoutes = [
    '/',
    '/assignments',
    '/grades',
    '/schedule',
    '/notifications'
  ];

  List<NavigationDestination> _getDestinations(String? role) {
    if (_isAdmin(role)) return _adminDestinations;
    if (_isTeacher(role)) return _teacherDestinations;
    return _studentDestinations;
  }

  List<String> _getRoutes(String? role) {
    if (_isAdmin(role)) return _adminRoutes;
    if (_isTeacher(role)) return _teacherRoutes;
    return _studentRoutes;
  }

  static bool _isAdmin(String? role) =>
      role == 'SCHOOL_ADMIN' || role == 'SUPER_ADMIN' || role == 'admin';
  static bool _isTeacher(String? role) => role == 'TEACHER';

  int _calculateSelectedIndex(BuildContext context, List<String> routes) {
    final location = GoRouterState.of(context).matchedLocation;
    for (int i = 0; i < routes.length; i++) {
      if (location == routes[i] ||
          (routes[i] != '/' && location.startsWith('${routes[i]}/'))) {
        return i;
      }
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final role = auth.user?.role;
    final destinations = _getDestinations(role);
    final routes = _getRoutes(role);
    final selectedIndex = _calculateSelectedIndex(context, routes);

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: (i) => context.go(routes[i]),
        destinations: destinations,
      ),
    );
  }
}
