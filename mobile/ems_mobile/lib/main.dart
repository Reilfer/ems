import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'app.dart';
import 'core/providers/settings_provider.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/students/providers/students_provider.dart';
import 'features/attendance/providers/attendance_provider.dart';
import 'features/schedule/providers/schedule_provider.dart';
import 'features/grades/providers/grades_provider.dart';
import 'features/notifications/providers/notifications_provider.dart';
import 'features/dashboard/providers/dashboard_provider.dart';
import 'features/teachers/providers/teachers_provider.dart';
import 'features/enrollment/providers/enrollment_provider.dart';
import 'features/reports/providers/reports_provider.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();

}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp();

  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  final messaging = FirebaseMessaging.instance;
  await messaging.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );

  final fcmToken = await messaging.getToken();
  debugPrint('FCM Token: $fcmToken');

  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  final settingsProvider = SettingsProvider();
  await settingsProvider.loadSettings();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: settingsProvider),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProxyProvider<AuthProvider, DashboardProvider>(
          create: (_) => DashboardProvider(),
          update: (_, auth, dash) => dash!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, StudentsProvider>(
          create: (_) => StudentsProvider(),
          update: (_, auth, prov) => prov!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, AttendanceProvider>(
          create: (_) => AttendanceProvider(),
          update: (_, auth, prov) => prov!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, ScheduleProvider>(
          create: (_) => ScheduleProvider(),
          update: (_, auth, prov) => prov!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, GradesProvider>(
          create: (_) => GradesProvider(),
          update: (_, auth, prov) => prov!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, NotificationsProvider>(
          create: (_) => NotificationsProvider(),
          update: (_, auth, prov) => prov!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, TeachersProvider>(
          create: (_) => TeachersProvider(),
          update: (_, auth, prov) => prov!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, EnrollmentProvider>(
          create: (_) => EnrollmentProvider(),
          update: (_, auth, prov) => prov!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, ReportsProvider>(
          create: (_) => ReportsProvider(),
          update: (_, auth, prov) => prov!..updateAuth(auth),
        ),
      ],
      child: const EmsApp(),
    ),
  );
}
