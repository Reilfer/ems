import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/students_provider.dart';
import '../../auth/providers/auth_provider.dart';

class StudentListScreen extends StatefulWidget {
  const StudentListScreen({super.key});

  @override
  State<StudentListScreen> createState() => _StudentListScreenState();
}

class _StudentListScreenState extends State<StudentListScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  bool get _isAdmin {
    final role = context.read<AuthProvider>().user?.role ?? '';
    return role == 'SUPER_ADMIN' || role == 'SCHOOL_ADMIN' || role == 'PRINCIPAL';
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<StudentsProvider>().loadStudents();
    });

    _scrollController.addListener(() {
      if (_scrollController.position.pixels >=
          _scrollController.position.maxScrollExtent - 200) {
        context.read<StudentsProvider>().loadMore();
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Học sinh'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: SearchBar(
              controller: _searchController,
              hintText: 'Tìm kiếm học sinh...',
              leading: const Icon(Icons.search, size: 20),
              trailing: [
                if (_searchController.text.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.clear, size: 20),
                    onPressed: () {
                      _searchController.clear();
                      context.read<StudentsProvider>().loadStudents();
                    },
                  ),
              ],
              elevation: WidgetStateProperty.all(0),
              backgroundColor: WidgetStateProperty.all(
                colorScheme.surfaceContainerHighest.withOpacity(0.3),
              ),
              onSubmitted: (query) {
                context.read<StudentsProvider>().loadStudents(search: query);
              },
            ),
          ),
        ),
      ),
      floatingActionButton: _isAdmin
          ? FloatingActionButton(
              onPressed: () => _showStudentForm(context),
              child: const Icon(Icons.person_add_outlined),
            )
          : null,
      body: Consumer<StudentsProvider>(
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
                    onPressed: () => provider.loadStudents(),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          if (provider.students.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.people_outlined, size: 64,
                    color: colorScheme.onSurfaceVariant.withOpacity(0.5)),
                  const SizedBox(height: 12),
                  Text('Chưa có học sinh nào',
                    style: TextStyle(color: colorScheme.onSurfaceVariant)),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadStudents(search: _searchController.text),
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: provider.students.length + (provider.isLoadingMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index >= provider.students.length) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  );
                }

                final student = provider.students[index];
                return _StudentTile(
                  student: student,
                  onTap: () => context.go('/students/${student['id']}'),
                  onLongPress: _isAdmin
                      ? () => _showStudentActions(context, student, provider)
                      : null,
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _showStudentActions(BuildContext context, Map<String, dynamic> student,
      StudentsProvider provider) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit_outlined),
              title: const Text('Sửa thông tin'),
              onTap: () {
                Navigator.pop(ctx);
                _showStudentForm(context, existing: student);
              },
            ),
            ListTile(
              leading: Icon(Icons.delete_outlined, color: Theme.of(context).colorScheme.error),
              title: Text('Xoá học sinh',
                  style: TextStyle(color: Theme.of(context).colorScheme.error)),
              onTap: () {
                Navigator.pop(ctx);
                _showDeleteConfirm(context, student, provider);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showStudentForm(BuildContext context, {Map<String, dynamic>? existing}) {
    final isEdit = existing != null;
    final codeCtrl = TextEditingController(text: existing?['studentCode'] ?? '');
    final firstCtrl = TextEditingController(text: existing?['firstName'] ?? '');
    final lastCtrl = TextEditingController(text: existing?['lastName'] ?? '');
    final emailCtrl = TextEditingController(text: existing?['email'] ?? '');
    final phoneCtrl = TextEditingController(text: existing?['phone'] ?? '');
    final addressCtrl = TextEditingController(text: existing?['address'] ?? '');
    String gender = existing?['gender'] ?? 'male';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx2, setSheetState) {
          final theme = Theme.of(ctx2);
          return Padding(
            padding: EdgeInsets.only(
              left: 24, right: 24, top: 24,
              bottom: MediaQuery.of(ctx2).viewInsets.bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(isEdit ? 'Sửa học sinh' : 'Thêm học sinh',
                      style: theme.textTheme.titleMedium),
                  const SizedBox(height: 16),
                  TextField(
                    controller: codeCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Mã học sinh',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(children: [
                    Expanded(
                      child: TextField(
                        controller: lastCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Họ',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: firstCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Tên',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ]),
                  const SizedBox(height: 12),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'male', label: Text('Nam')),
                      ButtonSegment(value: 'female', label: Text('Nữ')),
                    ],
                    selected: {gender},
                    onSelectionChanged: (v) => setSheetState(() => gender = v.first),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: phoneCtrl,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Số điện thoại',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: addressCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Địa chỉ',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () async {
                        if (firstCtrl.text.isEmpty || lastCtrl.text.isEmpty) return;
                        final data = {
                          'studentCode': codeCtrl.text,
                          'firstName': firstCtrl.text,
                          'lastName': lastCtrl.text,
                          'gender': gender,
                          'email': emailCtrl.text,
                          'phone': phoneCtrl.text,
                          'address': addressCtrl.text,
                        };
                        final provider = context.read<StudentsProvider>();
                        try {
                          if (isEdit) {
                            await provider.updateStudent(
                                existing['id'].toString(), data);
                          } else {
                            await provider.createStudent(data);
                          }
                          if (ctx2.mounted) Navigator.pop(ctx2);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                              content: Text(isEdit
                                  ? 'Đã cập nhật học sinh'
                                  : 'Đã thêm học sinh'),
                            ));
                          }
                        } catch (_) {
                          if (ctx2.mounted) {
                            ScaffoldMessenger.of(ctx2).showSnackBar(
                              const SnackBar(content: Text('Thao tác thất bại')),
                            );
                          }
                        }
                      },
                      child: Text(isEdit ? 'Cập nhật' : 'Thêm mới'),
                    ),
                  ),
                ],
              ),
            ),
          );
        });
      },
    );
  }

  void _showDeleteConfirm(BuildContext context, Map<String, dynamic> student,
      StudentsProvider provider) {
    final name = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}';
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xoá học sinh'),
        content: Text('Bạn chắc chắn muốn xoá $name?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Huỷ')),
          FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.error),
            onPressed: () async {
              try {
                await provider.deleteStudent(student['id'].toString());
                if (ctx.mounted) Navigator.pop(ctx);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Đã xoá học sinh')),
                  );
                }
              } catch (_) {
                if (ctx.mounted) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(content: Text('Xoá thất bại')),
                  );
                }
              }
            },
            child: const Text('Xoá'),
          ),
        ],
      ),
    );
  }
}

class _StudentTile extends StatelessWidget {
  final Map<String, dynamic> student;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;

  const _StudentTile({required this.student, required this.onTap, this.onLongPress});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final firstName = student['firstName'] ?? '';
    final lastName = student['lastName'] ?? '';
    final code = student['studentCode'] ?? '';
    final status = student['status'] ?? 'active';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: colorScheme.secondaryContainer,
          child: Text(
            firstName.isNotEmpty ? firstName[0].toUpperCase() : '?',
            style: TextStyle(
              color: colorScheme.onSecondaryContainer,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        title: Text(
          '$firstName $lastName',
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        subtitle: Text(
          'MSV: $code',
          style: TextStyle(
            fontSize: 12,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: status == 'active'
                ? Colors.green.withOpacity(0.1)
                : Colors.grey.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            status == 'active' ? 'Đang học' : 'Nghỉ',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: status == 'active' ? Colors.green.shade700 : Colors.grey,
            ),
          ),
        ),
        onTap: onTap,
        onLongPress: onLongPress,
      ),
    );
  }
}
