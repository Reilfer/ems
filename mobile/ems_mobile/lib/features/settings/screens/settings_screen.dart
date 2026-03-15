import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:local_auth/local_auth.dart';
import '../../../core/providers/settings_provider.dart';
import '../../../core/storage/secure_storage.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _biometricAvailable = false;
  final LocalAuthentication _localAuth = LocalAuthentication();

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  Future<void> _checkBiometric() async {
    try {
      final canAuth = await _localAuth.canCheckBiometrics;
      final isSupported = await _localAuth.isDeviceSupported();
      setState(() => _biometricAvailable = canAuth && isSupported);
    } catch (_) {}
  }

  Future<void> _toggleBiometric(SettingsProvider settings, bool value) async {
    if (value) {

      try {
        final authenticated = await _localAuth.authenticate(
          localizedReason: settings.language == 'vi'
              ? 'Xác thực để bật sinh trắc học'
              : 'Authenticate to enable biometrics',
          options: const AuthenticationOptions(
            stickyAuth: true,
            biometricOnly: true,
          ),
        );
        if (authenticated) {
          await settings.setBiometricEnabled(true);
          await SecureStorage.setBiometricLoginEnabled(true);
        }
      } catch (_) {}
    } else {
      await settings.setBiometricEnabled(false);
      await SecureStorage.setBiometricLoginEnabled(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final settings = context.watch<SettingsProvider>();
    final isVi = settings.language == 'vi';

    return Scaffold(
      appBar: AppBar(title: Text(isVi ? 'Cài đặt' : 'Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [

          Text(isVi ? 'Giao diện' : 'Appearance',
              style: theme.textTheme.titleSmall
                  ?.copyWith(color: colorScheme.onSurfaceVariant)),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  secondary: Icon(
                    settings.isDarkMode
                        ? Icons.dark_mode_outlined
                        : Icons.light_mode_outlined,
                    color: colorScheme.onSurfaceVariant,
                  ),
                  title: Text(isVi ? 'Chế độ tối' : 'Dark mode'),
                  subtitle: Text(
                    settings.isDarkMode
                        ? (isVi ? 'Đang bật' : 'On')
                        : (isVi ? 'Đang tắt' : 'Off'),
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                  value: settings.isDarkMode,
                  onChanged: (_) => settings.toggleDarkMode(),
                ),
                const Divider(height: 1, indent: 56),
                ListTile(
                  leading: Icon(Icons.palette_outlined,
                      color: colorScheme.onSurfaceVariant),
                  title: Text(isVi
                      ? 'Giao diện hệ thống'
                      : 'System theme'),
                  subtitle: Text(
                    isVi
                        ? 'Tự động theo thiết bị'
                        : 'Follow device setting',
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                  trailing: Radio<ThemeMode>(
                    value: ThemeMode.system,
                    groupValue: settings.themeMode,
                    onChanged: (v) => settings.setThemeMode(v!),
                  ),
                  onTap: () => settings.setThemeMode(ThemeMode.system),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          Text(isVi ? 'Bảo mật' : 'Security',
              style: theme.textTheme.titleSmall
                  ?.copyWith(color: colorScheme.onSurfaceVariant)),
          const SizedBox(height: 8),
          Card(
            child: SwitchListTile(
              secondary: Icon(Icons.fingerprint,
                  color: colorScheme.onSurfaceVariant),
              title: Text(isVi
                  ? 'Mở khóa sinh trắc học'
                  : 'Biometric unlock'),
              subtitle: Text(
                _biometricAvailable
                    ? (isVi
                        ? 'Đăng nhập bằng vân tay / Face ID'
                        : 'Sign in with fingerprint / Face ID')
                    : (isVi
                        ? 'Thiết bị không hỗ trợ'
                        : 'Not supported on this device'),
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
              value: settings.biometricEnabled,
              onChanged: _biometricAvailable
                  ? (v) => _toggleBiometric(settings, v)
                  : null,
            ),
          ),

          const SizedBox(height: 24),

          Text(isVi ? 'Ngôn ngữ' : 'Language',
              style: theme.textTheme.titleSmall
                  ?.copyWith(color: colorScheme.onSurfaceVariant)),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                RadioListTile<String>(
                  title: const Text('Tiếng Việt'),
                  subtitle: Text('Vietnamese',
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: colorScheme.onSurfaceVariant)),
                  value: 'vi',
                  groupValue: settings.language,
                  onChanged: (v) => settings.setLanguage(v!),
                ),
                const Divider(height: 1, indent: 56),
                RadioListTile<String>(
                  title: const Text('English'),
                  subtitle: Text(isVi ? 'Tiếng Anh' : 'English',
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: colorScheme.onSurfaceVariant)),
                  value: 'en',
                  groupValue: settings.language,
                  onChanged: (v) => settings.setLanguage(v!),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          Text(isVi ? 'Thông tin' : 'About',
              style: theme.textTheme.titleSmall
                  ?.copyWith(color: colorScheme.onSurfaceVariant)),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: Icon(Icons.info_outline,
                      color: colorScheme.onSurfaceVariant),
                  title: Text(isVi ? 'Phiên bản' : 'Version'),
                  trailing: Text(
                    '1.0.0',
                    style: theme.textTheme.bodyMedium
                        ?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                ),
                const Divider(height: 1, indent: 56),
                ListTile(
                  leading: Icon(Icons.description_outlined,
                      color: colorScheme.onSurfaceVariant),
                  title: Text(isVi
                      ? 'Điều khoản sử dụng'
                      : 'Terms of Service'),
                  trailing: Icon(Icons.chevron_right,
                      color: colorScheme.onSurfaceVariant, size: 20),
                  onTap: () {},
                ),
                const Divider(height: 1, indent: 56),
                ListTile(
                  leading: Icon(Icons.privacy_tip_outlined,
                      color: colorScheme.onSurfaceVariant),
                  title: Text(isVi
                      ? 'Chính sách bảo mật'
                      : 'Privacy Policy'),
                  trailing: Icon(Icons.chevron_right,
                      color: colorScheme.onSurfaceVariant, size: 20),
                  onTap: () {},
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
