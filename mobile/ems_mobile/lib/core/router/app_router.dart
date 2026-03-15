import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/students/screens/student_list_screen.dart';
import '../../features/students/screens/student_detail_screen.dart';
import '../../features/attendance/screens/attendance_screen.dart';
import '../../features/attendance/screens/qr_scan_screen.dart';
import '../../features/attendance/screens/leave_requests_screen.dart';
import '../../features/schedule/screens/timetable_screen.dart';
import '../../features/grades/screens/grades_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/finance/screens/finance_screen.dart';
import '../../features/assignments/screens/assignments_screen.dart';
import '../../features/ai/screens/ai_chat_screen.dart';
import '../../features/settings/screens/settings_screen.dart';
import '../../features/teachers/screens/teachers_screen.dart';
import '../../features/enrollment/screens/enrollment_screen.dart';
import '../../features/reports/screens/reports_screen.dart';
import '../../shared/widgets/shell_scaffold.dart';

bool _isAdmin(String? role) =>
    role == 'SCHOOL_ADMIN' || role == 'SUPER_ADMIN' || role == 'admin';
bool _isTeacher(String? role) => role == 'TEACHER';

const _teacherPaths = [
  '/',
  '/dashboard',
  '/students',
  '/assignments',
  '/grades',
  '/attendance',
  '/schedule',
  '/notifications',
  '/ai-chat',
  '/settings',
  '/profile',
];
const _studentPaths = [
  '/',
  '/dashboard',
  '/assignments',
  '/grades',
  '/attendance',
  '/schedule',
  '/notifications',
  '/ai-chat',
  '/settings',
  '/profile',
];

class AppRouter {
  static GoRouter router(AuthProvider auth) {
    return GoRouter(
      initialLocation: '/',
      redirect: (context, state) {
        final isLoggedIn = auth.isAuthenticated;
        final isLoggingIn = state.matchedLocation == '/login';

        if (!isLoggedIn && !isLoggingIn) return '/login';
        if (isLoggedIn && isLoggingIn) return '/';

        if (isLoggedIn && auth.user != null) {
          final role = auth.user!.role;
          final path = state.matchedLocation;

          if (!_isAdmin(role)) {
            final allowedPaths =
                _isTeacher(role) ? _teacherPaths : _studentPaths;
            final isAllowed =
                allowedPaths.any((p) => path == p || path.startsWith('$p/'));
            if (!isAllowed) {
              return '/'; 
            }
          }
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        ShellRoute(
          builder: (context, state, child) => ShellScaffold(child: child),
          routes: [
            GoRoute(
              path: '/',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: DashboardScreen(),
              ),
            ),
            GoRoute(
              path: '/students',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: StudentListScreen(),
              ),
              routes: [
                GoRoute(
                  path: ':id',
                  builder: (context, state) => StudentDetailScreen(
                    studentId: state.pathParameters['id']!,
                  ),
                ),
              ],
            ),
            GoRoute(
              path: '/attendance',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: AttendanceScreen(),
              ),
              routes: [
                GoRoute(
                  path: 'scan',
                  builder: (context, state) => const QrScanScreen(),
                ),
                GoRoute(
                  path: 'leave-requests',
                  builder: (context, state) => const LeaveRequestsScreen(),
                ),
              ],
            ),
            GoRoute(
              path: '/schedule',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: TimetableScreen(),
              ),
            ),
            GoRoute(
              path: '/grades',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: GradesScreen(),
              ),
            ),
            GoRoute(
              path: '/assignments',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: AssignmentsScreen(),
              ),
            ),
            GoRoute(
              path: '/notifications',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: NotificationsScreen(),
              ),
            ),
          ],
        ),

        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
        GoRoute(
          path: '/finance',
          builder: (context, state) => const FinanceScreen(),
        ),
        GoRoute(
          path: '/ai-chat',
          builder: (context, state) => const AiChatScreen(),
        ),
        GoRoute(
          path: '/settings',
          builder: (context, state) => const SettingsScreen(),
        ),
        GoRoute(
          path: '/teachers',
          builder: (context, state) => const TeachersScreen(),
        ),
        GoRoute(
          path: '/enrollment',
          builder: (context, state) => const EnrollmentScreen(),
        ),
        GoRoute(
          path: '/reports',
          builder: (context, state) => const ReportsScreen(),
        ),
      ],
    );
  }
}
