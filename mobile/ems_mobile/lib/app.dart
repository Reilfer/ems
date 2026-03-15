import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/providers/settings_provider.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/splash/screens/splash_screen.dart';
import 'features/onboarding/screens/onboarding_screen.dart';

class EmsApp extends StatefulWidget {
  const EmsApp({super.key});

  @override
  State<EmsApp> createState() => _EmsAppState();
}

class _EmsAppState extends State<EmsApp> {
  bool _showSplash = true;
  bool _showOnboarding = false;

  @override
  void initState() {
    super.initState();
    _checkFirstLaunch();
  }

  Future<void> _checkFirstLaunch() async {
    const storage = FlutterSecureStorage();
    final hasLaunched = await storage.read(key: 'hasLaunched');
    if (hasLaunched == null) {
      setState(() => _showOnboarding = true);
      await storage.write(key: 'hasLaunched', value: 'true');
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();

    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        if (_showSplash) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            darkTheme: AppTheme.dark(),
            themeMode: settings.themeMode,
            home: SplashScreen(
              onComplete: () => setState(() => _showSplash = false),
            ),
          );
        }

        if (_showOnboarding) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            darkTheme: AppTheme.dark(),
            themeMode: settings.themeMode,
            home: OnboardingScreen(
              onComplete: () => setState(() => _showOnboarding = false),
            ),
          );
        }

        return MaterialApp.router(
          title: 'ReilferEDUV - Quản lý giáo dục',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light(),
          darkTheme: AppTheme.dark(),
          themeMode: settings.themeMode,
          routerConfig: AppRouter.router(auth),
        );
      },
    );
  }
}
