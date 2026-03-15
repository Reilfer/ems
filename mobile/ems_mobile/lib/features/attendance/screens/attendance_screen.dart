import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/attendance_provider.dart';

class AttendanceScreen extends StatelessWidget {
  const AttendanceScreen({super.key});

  static bool _isAdmin(String? role) =>
      role == 'SCHOOL_ADMIN' || role == 'SUPER_ADMIN' || role == 'admin';
  static bool _isTeacher(String? role) => role == 'TEACHER';

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final role = auth.user?.role;

    if (_isAdmin(role) || _isTeacher(role)) {
      return const _TeacherAttendance();
    }
    return const _StudentAttendance();
  }
}

class _TeacherAttendance extends StatefulWidget {
  const _TeacherAttendance();
  @override
  State<_TeacherAttendance> createState() => _TeacherAttendanceState();
}

class _TeacherAttendanceState extends State<_TeacherAttendance> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AttendanceProvider>().loadActiveSessions();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final auth = context.watch<AuthProvider>();
    final isTeacher = auth.user?.role == 'TEACHER';

    return Scaffold(
      appBar: AppBar(title: const Text('Điểm danh')),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            heroTag: 'create_session',
            onPressed: () => _showCreateSessionSheet(context),
            child: const Icon(Icons.add_outlined),
          ),
          const SizedBox(height: 12),
          if (isTeacher)
            FloatingActionButton.extended(
              heroTag: 'scan_qr',
              onPressed: () => context.push('/attendance/scan'),
              icon: const Icon(Icons.qr_code_scanner_outlined),
              label: const Text('Chấm công'),
            ),
        ],
      ),
      body: Consumer<AttendanceProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 48, color: colorScheme.error),
                  const SizedBox(height: 12),
                  Text(provider.error!),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () => provider.refresh(),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.refresh(),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [

                Row(children: [
                  _MiniStat(
                      label: 'Có mặt',
                      value: '0',
                      icon: Icons.check_circle_outlined,
                      color: Colors.green.shade700),
                  _MiniStat(
                      label: 'Đi trễ',
                      value: '0',
                      icon: Icons.schedule_outlined,
                      color: Colors.orange.shade700),
                  _MiniStat(
                      label: 'Vắng',
                      value: '0',
                      icon: Icons.cancel_outlined,
                      color: Colors.red.shade700),
                ]),
                const SizedBox(height: 20),

                Text('Phiên QR điểm danh',
                    style: theme.textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),

                if (provider.activeSessions.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(children: [
                        Icon(Icons.qr_code_outlined,
                            size: 48, color: colorScheme.onSurfaceVariant),
                        const SizedBox(height: 8),
                        Text('Chưa có phiên điểm danh',
                            style:
                                TextStyle(color: colorScheme.onSurfaceVariant)),
                        const SizedBox(height: 4),
                        Text('Phiên sẽ hiện khi giáo viên kích hoạt trên web',
                            style: theme.textTheme.bodySmall
                                ?.copyWith(color: colorScheme.onSurfaceVariant),
                            textAlign: TextAlign.center),
                      ]),
                    ),
                  )
                else
                  ...provider.activeSessions
                      .map((session) => _SessionCard(
                            session: session,
                            onDeactivate: () async {
                              try {
                                await provider.deactivateSession(
                                    session['id'].toString());
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                        content: Text('Đã kết thúc phiên')),
                                  );
                                }
                              } catch (_) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                        content:
                                            Text('Kết thúc phiên thất bại')),
                                  );
                                }
                              }
                            },
                          )),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showCreateSessionSheet(BuildContext context) {
    final classIdCtrl = TextEditingController();
    final classNameCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) {
        final theme = Theme.of(ctx);
        return Padding(
          padding: EdgeInsets.only(
            left: 24, right: 24, top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Tạo phiên điểm danh', style: theme.textTheme.titleMedium),
              const SizedBox(height: 16),
              TextField(
                controller: classNameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Tên lớp',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: classIdCtrl,
                decoration: const InputDecoration(
                  labelText: 'Mã lớp (tuỳ chọn)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () async {
                    if (classNameCtrl.text.isEmpty) return;
                    final provider = context.read<AttendanceProvider>();
                    final auth = context.read<AuthProvider>();
                    try {
                      await provider.createSession(
                        classId: classIdCtrl.text.isNotEmpty
                            ? classIdCtrl.text
                            : classNameCtrl.text,
                        className: classNameCtrl.text,
                        teacherId: auth.user?.id,
                      );
                      if (ctx.mounted) Navigator.pop(ctx);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Đã tạo phiên điểm danh')),
                        );
                      }
                    } catch (_) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          const SnackBar(
                              content: Text('Tạo phiên thất bại')),
                        );
                      }
                    }
                  },
                  child: const Text('Tạo phiên'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _StudentAttendance extends StatefulWidget {
  const _StudentAttendance();
  @override
  State<_StudentAttendance> createState() => _StudentAttendanceState();
}

class _StudentAttendanceState extends State<_StudentAttendance> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AttendanceProvider>().loadActiveSessions();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Điểm danh')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/attendance/scan'),
        icon: const Icon(Icons.qr_code_scanner_outlined),
        label: const Text('Quét QR'),
      ),
      body: Consumer<AttendanceProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final hasActiveSession = provider.activeSessions.isNotEmpty;

          return RefreshIndicator(
            onRefresh: () => provider.refresh(),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [

                Card(
                  color: hasActiveSession
                      ? const Color(0xFFFEF7E0) 
                      : colorScheme.surfaceContainerHighest,
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(children: [
                      Icon(
                        hasActiveSession
                            ? Icons.qr_code_scanner_outlined
                            : Icons.qr_code_outlined,
                        size: 48,
                        color: hasActiveSession
                            ? const Color(0xFFE37400)
                            : colorScheme.primary,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        hasActiveSession
                            ? 'Điểm danh đang mở!'
                            : 'Chờ giáo viên bật điểm danh...',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: hasActiveSession
                              ? const Color(0xFFE37400)
                              : colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        hasActiveSession
                            ? 'Bấm nút "Quét QR" bên dưới để điểm danh'
                            : 'QR sẽ hiện trên bảng khi GV kích hoạt phiên',
                        style: TextStyle(
                            fontSize: 13, color: colorScheme.onSurfaceVariant),
                        textAlign: TextAlign.center,
                      ),
                    ]),
                  ),
                ),
                const SizedBox(height: 20),

                Row(children: [
                  _MiniStat(
                      label: 'Có mặt',
                      value: '0',
                      icon: Icons.check_circle_outlined,
                      color: Colors.green.shade700),
                  _MiniStat(
                      label: 'Đi trễ',
                      value: '0',
                      icon: Icons.schedule_outlined,
                      color: Colors.orange.shade700),
                  _MiniStat(
                      label: 'Vắng',
                      value: '0',
                      icon: Icons.cancel_outlined,
                      color: Colors.red.shade700),
                ]),
                const SizedBox(height: 20),

                Text('Lịch sử điểm danh',
                    style: theme.textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(children: [
                      Icon(Icons.history_outlined,
                          size: 40, color: colorScheme.onSurfaceVariant),
                      const SizedBox(height: 8),
                      Text('Chưa có lịch sử điểm danh',
                          style:
                              TextStyle(color: colorScheme.onSurfaceVariant)),
                    ]),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const _MiniStat(
      {required this.label,
      required this.value,
      required this.icon,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          child: Column(children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 4),
            Text(value,
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w600, color: color)),
            Text(label,
                style: TextStyle(
                    fontSize: 11,
                    color: Theme.of(context).colorScheme.onSurfaceVariant)),
          ]),
        ),
      ),
    );
  }
}

class _SessionCard extends StatelessWidget {
  final Map<String, dynamic> session;
  final VoidCallback? onDeactivate;
  const _SessionCard({required this.session, this.onDeactivate});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final classId = session['classId'] ?? '';
    final scannedCount = session['scannedCount'] ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                    shape: BoxShape.circle, color: Colors.green)),
            const SizedBox(width: 8),
            Text('Đang mở',
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.green.shade700)),
          ]),
          const SizedBox(height: 8),
          Text('Lớp: $classId',
              style: const TextStyle(fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Text('Đã điểm danh: $scannedCount học sinh',
              style:
                  TextStyle(fontSize: 13, color: colorScheme.onSurfaceVariant)),
          if (onDeactivate != null) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: onDeactivate,
                style: OutlinedButton.styleFrom(
                    foregroundColor: colorScheme.error,
                    side: BorderSide(color: colorScheme.error)),
                child: const Text('Kết thúc phiên'),
              ),
            ),
          ],
        ]),
      ),
    );
  }
}
