import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SettingsProvider extends ChangeNotifier {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ThemeMode _themeMode = ThemeMode.system;
  bool _biometricEnabled = false;
  String _language = 'vi';

  ThemeMode get themeMode => _themeMode;
  bool get biometricEnabled => _biometricEnabled;
  String get language => _language;

  bool get isDarkMode {
    if (_themeMode == ThemeMode.dark) return true;
    if (_themeMode == ThemeMode.light) return false;

    return SchedulerBinding.instance.platformDispatcher.platformBrightness == Brightness.dark;
  }

  Future<void> loadSettings() async {
    try {
      final theme = await _storage.read(key: 'themeMode');
      if (theme == 'dark') {
        _themeMode = ThemeMode.dark;
      } else if (theme == 'light') {
        _themeMode = ThemeMode.light;
      } else {
        _themeMode = ThemeMode.system;
      }

      final bio = await _storage.read(key: 'biometricEnabled');
      _biometricEnabled = bio == 'true';

      final lang = await _storage.read(key: 'language');
      _language = lang ?? 'vi';

      notifyListeners();
    } catch (_) {}
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    notifyListeners();
    await _storage.write(
      key: 'themeMode',
      value: mode == ThemeMode.dark
          ? 'dark'
          : mode == ThemeMode.light
              ? 'light'
              : 'system',
    );
  }

  Future<void> toggleDarkMode() async {
    if (_themeMode == ThemeMode.dark) {
      await setThemeMode(ThemeMode.light);
    } else {
      await setThemeMode(ThemeMode.dark);
    }
  }

  Future<void> setBiometricEnabled(bool enabled) async {
    _biometricEnabled = enabled;
    notifyListeners();
    await _storage.write(key: 'biometricEnabled', value: enabled.toString());
  }

  Future<void> setLanguage(String lang) async {
    _language = lang;
    notifyListeners();
    await _storage.write(key: 'language', value: lang);
  }
}
