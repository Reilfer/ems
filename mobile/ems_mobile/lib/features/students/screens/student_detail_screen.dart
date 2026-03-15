import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/students_provider.dart';

class StudentDetailScreen extends StatefulWidget {
  final String studentId;
  const StudentDetailScreen({super.key, required this.studentId});

  @override
  State<StudentDetailScreen> createState() => _StudentDetailScreenState();
}

class _StudentDetailScreenState extends State<StudentDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<StudentsProvider>().loadStudentDetail(widget.studentId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Thông tin học sinh')),
      body: Consumer<StudentsProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(child: Text(provider.error!));
          }

          final s = provider.selectedStudent;
          if (s == null) return const Center(child: Text('Không tìm thấy'));

          final firstName = s['firstName'] ?? '';
          final lastName = s['lastName'] ?? '';

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [

              Center(
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: colorScheme.primaryContainer,
                      child: Text(
                        firstName.isNotEmpty ? firstName[0].toUpperCase() : '?',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w600,
                          color: colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '$firstName $lastName',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'MSV: ${s['studentCode'] ?? ''}',
                      style: TextStyle(color: colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              Card(
                child: Column(
                  children: [
                    _InfoRow(
                      icon: Icons.email_outlined,
                      label: 'Email',
                      value: s['email'] ?? 'Chưa cập nhật',
                    ),
                    const Divider(height: 1, indent: 56),
                    _InfoRow(
                      icon: Icons.phone_outlined,
                      label: 'Điện thoại',
                      value: s['phone'] ?? 'Chưa cập nhật',
                    ),
                    const Divider(height: 1, indent: 56),
                    _InfoRow(
                      icon: Icons.person_outlined,
                      label: 'Giới tính',
                      value: s['gender'] == 'male' ? 'Nam' : s['gender'] == 'female' ? 'Nữ' : 'Khác',
                    ),
                    const Divider(height: 1, indent: 56),
                    _InfoRow(
                      icon: Icons.cake_outlined,
                      label: 'Ngày sinh',
                      value: s['dateOfBirth'] ?? 'Chưa cập nhật',
                    ),
                    const Divider(height: 1, indent: 56),
                    _InfoRow(
                      icon: Icons.home_outlined,
                      label: 'Địa chỉ',
                      value: s['address'] ?? 'Chưa cập nhật',
                    ),
                    const Divider(height: 1, indent: 56),
                    _InfoRow(
                      icon: Icons.info_outlined,
                      label: 'Trạng thái',
                      value: s['status'] == 'active' ? 'Đang học' : 'Nghỉ',
                    ),
                  ],
                ),
              ),
            ],
          );
        },
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
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: colorScheme.onSurfaceVariant),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 2),
                Text(value, style: theme.textTheme.bodyMedium),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
