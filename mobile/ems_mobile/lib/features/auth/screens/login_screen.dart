import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:local_auth/local_auth.dart';
import '../providers/auth_provider.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/providers/settings_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _rememberMe = false;
  bool _biometricAvailable = false;
  bool _biometricLoginEnabled = false;
  final LocalAuthentication _localAuth = LocalAuthentication();

  @override
  void initState() {
    super.initState();
    _loadSavedCredentials();
    _checkBiometric();
  }

  Future<void> _loadSavedCredentials() async {
    final remember = await SecureStorage.isRememberMe();
    final email = await SecureStorage.getSavedEmail();
    final password = await SecureStorage.getSavedPassword();
    final bioLogin = await SecureStorage.isBiometricLoginEnabled();

    if (remember && email != null) {
      setState(() {
        _rememberMe = true;
        _emailController.text = email;
        if (password != null) _passwordController.text = password;
        _biometricLoginEnabled = bioLogin;
      });
    }
  }

  Future<void> _checkBiometric() async {
    try {
      final canAuth = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      setState(() {
        _biometricAvailable = canAuth && isDeviceSupported;
      });

      if (_biometricAvailable) {
        final bioEnabled = await SecureStorage.isBiometricLoginEnabled();
        final hasCreds = await SecureStorage.isRememberMe();
        if (bioEnabled && hasCreds) {
          _loginWithBiometric();
        }
      }
    } catch (_) {
      _biometricAvailable = false;
    }
  }

  Future<void> _loginWithBiometric() async {
    try {
      final authenticated = await _localAuth.authenticate(
        localizedReason: 'Xác thực để đăng nhập',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );

      if (authenticated && mounted) {
        final email = await SecureStorage.getSavedEmail();
        final password = await SecureStorage.getSavedPassword();
        if (email != null && password != null) {
          final auth = context.read<AuthProvider>();
          auth.clearError();
          await auth.login(email, password);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Xác thực sinh trắc học thất bại')),
        );
      }
    }
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    auth.clearError();

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    final success = await auth.login(email, password);

    if (success) {

      if (_rememberMe) {
        await SecureStorage.saveCredentials(email, password);
        if (_biometricLoginEnabled) {
          await SecureStorage.setBiometricLoginEnabled(true);
        }
      } else {
        await SecureStorage.clearCredentials();
        await SecureStorage.setBiometricLoginEnabled(false);
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final settings = context.watch<SettingsProvider>();
    final isVi = settings.language == 'vi';

    return Scaffold(
      backgroundColor: colorScheme.surface,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 48),

                    Center(
                      child: Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          color: colorScheme.primaryContainer,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Icon(
                          Icons.school_outlined,
                          size: 40,
                          color: colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    Text(
                      'ReilferEDUV',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w400,
                        color: colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      isVi ? 'Đăng nhập để tiếp tục' : 'Sign in to continue',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),

                    const SizedBox(height: 40),

                    Consumer<AuthProvider>(
                      builder: (context, auth, _) {
                        if (auth.error == null) return const SizedBox.shrink();
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 20),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: colorScheme.errorContainer,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.error_outline,
                                    color: colorScheme.onErrorContainer,
                                    size: 20),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    auth.error!,
                                    style:
                                        theme.textTheme.bodyMedium?.copyWith(
                                      color: colorScheme.onErrorContainer,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),

                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      decoration: InputDecoration(
                        labelText: 'Email',
                        prefixIcon: const Icon(Icons.mail_outlined),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return isVi
                              ? 'Vui lòng nhập email'
                              : 'Please enter email';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _handleLogin(),
                      decoration: InputDecoration(
                        labelText: isVi ? 'Mật khẩu' : 'Password',
                        prefixIcon: const Icon(Icons.lock_outlined),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                          onPressed: () {
                            setState(
                                () => _obscurePassword = !_obscurePassword);
                          },
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return isVi
                              ? 'Vui lòng nhập mật khẩu'
                              : 'Please enter password';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 8),

                    Row(
                      children: [

                        Expanded(
                          child: InkWell(
                            borderRadius: BorderRadius.circular(8),
                            onTap: () =>
                                setState(() => _rememberMe = !_rememberMe),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: Checkbox(
                                      value: _rememberMe,
                                      onChanged: (v) =>
                                          setState(() => _rememberMe = v!),
                                      materialTapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    isVi ? 'Ghi nhớ' : 'Remember me',
                                    style: theme.textTheme.bodyMedium,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),

                        if (_biometricAvailable && _rememberMe)
                          InkWell(
                            borderRadius: BorderRadius.circular(8),
                            onTap: () => setState(() =>
                                _biometricLoginEnabled =
                                    !_biometricLoginEnabled),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.fingerprint,
                                    size: 20,
                                    color: _biometricLoginEnabled
                                        ? colorScheme.primary
                                        : colorScheme.onSurfaceVariant,
                                  ),
                                  const SizedBox(width: 4),
                                  SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: Checkbox(
                                      value: _biometricLoginEnabled,
                                      onChanged: (v) => setState(
                                          () => _biometricLoginEnabled = v!),
                                      materialTapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    Consumer<AuthProvider>(
                      builder: (context, auth, _) {
                        return FilledButton(
                          onPressed: auth.isLoading ? null : _handleLogin,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 2),
                            child: auth.isLoading
                                ? SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: colorScheme.onPrimary,
                                    ),
                                  )
                                : Text(isVi ? 'Đăng nhập' : 'Sign in'),
                          ),
                        );
                      },
                    ),

                    if (_biometricAvailable &&
                        _biometricLoginEnabled &&
                        _rememberMe) ...[
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: _loginWithBiometric,
                        icon: const Icon(Icons.fingerprint),
                        label: Text(isVi
                            ? 'Đăng nhập bằng sinh trắc học'
                            : 'Sign in with biometrics'),
                      ),
                    ],

                    const SizedBox(height: 64),

                    Text(
                      isVi
                          ? 'Hệ thống quản lý giáo dục'
                          : 'Education Management System',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
