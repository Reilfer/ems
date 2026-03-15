import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/providers/settings_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _currentPwController = TextEditingController();
  final _newPwController = TextEditingController();
  final _confirmPwController = TextEditingController();
  bool _isChangingPassword = false;
  bool _showChangePassword = false;
  String? _pwMessage;
  bool _pwSuccess = false;

  @override
  void dispose() {
    _currentPwController.dispose();
    _newPwController.dispose();
    _confirmPwController.dispose();
    super.dispose();
  }

  Future<void> _changePassword(bool isVi) async {
    if (_newPwController.text != _confirmPwController.text) {
      setState(() {
        _pwMessage = isVi
            ? 'Mật khẩu mới không trùng khớp'
            : 'New passwords do not match';
        _pwSuccess = false;
      });
      return;
    }
    if (_newPwController.text.length < 6) {
      setState(() {
        _pwMessage = isVi
            ? 'Mật khẩu phải ít nhất 6 ký tự'
            : 'Password must be at least 6 characters';
        _pwSuccess = false;
      });
      return;
    }

    setState(() => _isChangingPassword = true);
    try {
      await ApiClient().post(
        ApiConstants.changePassword,
        data: {
          'currentPassword': _currentPwController.text,
          'newPassword': _newPwController.text,
        },
      );
      setState(() {
        _pwMessage = isVi
            ? 'Đổi mật khẩu thành công!'
            : 'Password changed successfully!';
        _pwSuccess = true;
        _currentPwController.clear();
        _newPwController.clear();
        _confirmPwController.clear();
      });
    } catch (e) {
      setState(() {
        _pwMessage = isVi
            ? 'Mật khẩu hiện tại không đúng'
            : 'Current password is incorrect';
        _pwSuccess = false;
      });
    }
    setState(() => _isChangingPassword = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final settings = context.watch<SettingsProvider>();
    final isVi = settings.language == 'vi';

    return Scaffold(
      appBar: AppBar(
          title: Text(isVi ? 'Hồ sơ cá nhân' : 'Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [

          const SizedBox(height: 8),
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 44,
                  backgroundColor: colorScheme.primaryContainer,
                  child: Text(
                    (user?.firstName != null && user!.firstName.isNotEmpty)
                        ? user.firstName[0].toUpperCase()
                        : '?',
                    style: TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.w400,
                      color: colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  user?.fullName ?? '',
                  style: theme.textTheme.headlineSmall,
                ),
                const SizedBox(height: 4),
                Text(
                  user?.email ?? '',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    color: colorScheme.secondaryContainer,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    user?.roleDisplay ?? '',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: colorScheme.onSecondaryContainer,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          Text(isVi ? 'Thông tin tài khoản' : 'Account information',
              style: theme.textTheme.titleSmall
                  ?.copyWith(color: colorScheme.onSurfaceVariant)),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                _InfoRow(
                    icon: Icons.mail_outlined,
                    label: 'Email',
                    value: user?.email ?? ''),
                const Divider(height: 1, indent: 56),
                _InfoRow(
                    icon: Icons.phone_outlined,
                    label: isVi ? 'Điện thoại' : 'Phone',
                    value: user?.phone ??
                        (isVi ? 'Chưa cập nhật' : 'Not set')),
                const Divider(height: 1, indent: 56),
                _InfoRow(
                    icon: Icons.school_outlined,
                    label: isVi ? 'Trường' : 'School',
                    value: user?.school?.name ?? ''),
                const Divider(height: 1, indent: 56),
                _InfoRow(
                    icon: Icons.badge_outlined,
                    label: isVi ? 'Mã trường' : 'School code',
                    value: user?.school?.code ?? ''),
                const Divider(height: 1, indent: 56),
                ListTile(
                  leading: Icon(
                    Icons.circle,
                    size: 12,
                    color: user?.status == 'active'
                        ? colorScheme.primary
                        : colorScheme.error,
                  ),
                  title: Text(isVi ? 'Trạng thái' : 'Status',
                      style: const TextStyle(fontSize: 14)),
                  trailing: Text(
                    user?.status == 'active'
                        ? (isVi ? 'Đang hoạt động' : 'Active')
                        : (isVi ? 'Ngừng hoạt động' : 'Inactive'),
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: user?.status == 'active'
                          ? colorScheme.primary
                          : colorScheme.error,
                    ),
                  ),
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
            child: Column(
              children: [
                ListTile(
                  leading: Icon(Icons.lock_outline,
                      color: colorScheme.onSurfaceVariant),
                  title: Text(isVi ? 'Đổi mật khẩu' : 'Change password'),
                  trailing: Icon(
                    _showChangePassword
                        ? Icons.expand_less
                        : Icons.expand_more,
                    color: colorScheme.onSurfaceVariant,
                  ),
                  onTap: () => setState(
                      () => _showChangePassword = !_showChangePassword),
                ),
                if (_showChangePassword) ...[
                  const Divider(height: 1),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        TextField(
                          controller: _currentPwController,
                          obscureText: true,
                          decoration: InputDecoration(
                            labelText: isVi
                                ? 'Mật khẩu hiện tại'
                                : 'Current password',
                            prefixIcon: const Icon(Icons.lock_outlined),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _newPwController,
                          obscureText: true,
                          decoration: InputDecoration(
                            labelText: isVi
                                ? 'Mật khẩu mới'
                                : 'New password',
                            prefixIcon: const Icon(Icons.lock_reset_outlined),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _confirmPwController,
                          obscureText: true,
                          decoration: InputDecoration(
                            labelText: isVi
                                ? 'Xác nhận mật khẩu mới'
                                : 'Confirm new password',
                            prefixIcon: const Icon(Icons.lock_reset_outlined),
                          ),
                        ),
                        if (_pwMessage != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 10),
                            decoration: BoxDecoration(
                              color: _pwSuccess
                                  ? colorScheme.primaryContainer
                                  : colorScheme.errorContainer,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              _pwMessage!,
                              style: TextStyle(
                                color: _pwSuccess
                                    ? colorScheme.onPrimaryContainer
                                    : colorScheme.onErrorContainer,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: _isChangingPassword
                                ? null
                                : () => _changePassword(isVi),
                            child: _isChangingPassword
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2),
                                  )
                                : Text(isVi
                                    ? 'Đổi mật khẩu'
                                    : 'Change password'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 32),

          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: Text(isVi ? 'Đăng xuất' : 'Sign out'),
                    content: Text(isVi
                        ? 'Bạn có chắc muốn đăng xuất?'
                        : 'Are you sure you want to sign out?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        child: Text(isVi ? 'Hủy' : 'Cancel'),
                      ),
                      FilledButton(
                        onPressed: () {
                          Navigator.pop(ctx);
                          auth.logout();
                        },
                        child: Text(isVi ? 'Đăng xuất' : 'Sign out'),
                      ),
                    ],
                  ),
                );
              },
              icon: const Icon(Icons.logout),
              label: Text(isVi ? 'Đăng xuất' : 'Sign out'),
              style: OutlinedButton.styleFrom(
                  foregroundColor: colorScheme.error),
            ),
          ),

          const SizedBox(height: 32),
          Center(
            child: Text(
              'EMS v1.0.0',
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant.withOpacity(0.5),
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final theme = Theme.of(context);
    return ListTile(
      leading:
          Icon(icon, color: colorScheme.onSurfaceVariant, size: 22),
      title: Text(label,
          style: theme.textTheme.bodySmall
              ?.copyWith(color: colorScheme.onSurfaceVariant)),
      subtitle: Text(value, style: theme.textTheme.bodyLarge),
    );
  }
}
