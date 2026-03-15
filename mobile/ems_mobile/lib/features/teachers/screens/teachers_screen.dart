import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/teachers_provider.dart';
import '../../auth/providers/auth_provider.dart';

class TeachersScreen extends StatefulWidget {
  const TeachersScreen({super.key});

  @override
  State<TeachersScreen> createState() => _TeachersScreenState();
}

class _TeachersScreenState extends State<TeachersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  bool get _isAdmin {
    final role = context.read<AuthProvider>().user?.role ?? '';
    return role == 'SUPER_ADMIN' || role == 'SCHOOL_ADMIN' || role == 'PRINCIPAL';
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Giáo viên & Nhân sự'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Giáo viên'),
            Tab(text: 'Tài khoản'),
          ],
        ),
      ),
      floatingActionButton: _isAdmin
          ? FloatingActionButton(
              onPressed: () {
                if (_tabController.index == 0) {
                  _showCreateTeacherSheet(context);
                } else {
                  _showCreateAccountSheet(context);
                }
              },
              child: const Icon(Icons.person_add_outlined),
            )
          : null,
      body: TabBarView(
        controller: _tabController,
        children: const [
          _TeachersTab(),
          _AccountsTab(),
        ],
      ),
    );
  }

  void _showCreateTeacherSheet(BuildContext context) {
    final firstCtrl = TextEditingController();
    final lastCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final specCtrl = TextEditingController();

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
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Thêm giáo viên', style: theme.textTheme.titleMedium),
                const SizedBox(height: 16),
                Row(children: [
                  Expanded(child: TextField(
                    controller: lastCtrl,
                    decoration: const InputDecoration(labelText: 'Họ', border: OutlineInputBorder()),
                  )),
                  const SizedBox(width: 12),
                  Expanded(child: TextField(
                    controller: firstCtrl,
                    decoration: const InputDecoration(labelText: 'Tên', border: OutlineInputBorder()),
                  )),
                ]),
                const SizedBox(height: 12),
                TextField(
                  controller: emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Điện thoại', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: specCtrl,
                  decoration: const InputDecoration(labelText: 'Chuyên môn', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () async {
                      if (firstCtrl.text.isEmpty || lastCtrl.text.isEmpty) return;
                      final provider = context.read<TeachersProvider>();
                      try {
                        await provider.createUser({
                          'firstName': firstCtrl.text,
                          'lastName': lastCtrl.text,
                          'email': emailCtrl.text,
                          'phone': phoneCtrl.text,
                          'role': 'TEACHER',
                          'specialization': specCtrl.text,
                          'password': 'Teacher@123',
                        });
                        if (ctx.mounted) Navigator.pop(ctx);
                        provider.loadTeachers();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Đã thêm giáo viên')),
                          );
                        }
                      } catch (_) {
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            const SnackBar(content: Text('Thêm giáo viên thất bại')),
                          );
                        }
                      }
                    },
                    child: const Text('Thêm giáo viên'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showCreateAccountSheet(BuildContext context) {
    final firstCtrl = TextEditingController();
    final lastCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final passwordCtrl = TextEditingController();
    String role = 'TEACHER';

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
                  Text('Tạo tài khoản', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 16),
                  Row(children: [
                    Expanded(child: TextField(
                      controller: lastCtrl,
                      decoration: const InputDecoration(labelText: 'Họ', border: OutlineInputBorder()),
                    )),
                    const SizedBox(width: 12),
                    Expanded(child: TextField(
                      controller: firstCtrl,
                      decoration: const InputDecoration(labelText: 'Tên', border: OutlineInputBorder()),
                    )),
                  ]),
                  const SizedBox(height: 12),
                  TextField(
                    controller: emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: passwordCtrl,
                    obscureText: true,
                    decoration: const InputDecoration(labelText: 'Mật khẩu', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: role,
                    decoration: const InputDecoration(
                      labelText: 'Vai trò',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: const [
                      DropdownMenuItem(value: 'TEACHER', child: Text('Giáo viên')),
                      DropdownMenuItem(value: 'SCHOOL_ADMIN', child: Text('Admin')),
                      DropdownMenuItem(value: 'STUDENT', child: Text('Học sinh')),
                      DropdownMenuItem(value: 'PARENT', child: Text('Phụ huynh')),
                      DropdownMenuItem(value: 'STAFF', child: Text('Nhân viên')),
                    ],
                    onChanged: (v) => setSheetState(() => role = v ?? 'TEACHER'),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () async {
                        if (emailCtrl.text.isEmpty || passwordCtrl.text.isEmpty) return;
                        final provider = context.read<TeachersProvider>();
                        try {
                          await provider.createUser({
                            'firstName': firstCtrl.text,
                            'lastName': lastCtrl.text,
                            'email': emailCtrl.text,
                            'password': passwordCtrl.text,
                            'role': role,
                          });
                          if (ctx2.mounted) Navigator.pop(ctx2);
                          provider.loadUsers();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Đã tạo tài khoản')),
                            );
                          }
                        } catch (_) {
                          if (ctx2.mounted) {
                            ScaffoldMessenger.of(ctx2).showSnackBar(
                              const SnackBar(content: Text('Tạo tài khoản thất bại')),
                            );
                          }
                        }
                      },
                      child: const Text('Tạo tài khoản'),
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
}

class _TeachersTab extends StatefulWidget {
  const _TeachersTab();
  @override
  State<_TeachersTab> createState() => _TeachersTabState();
}

class _TeachersTabState extends State<_TeachersTab> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TeachersProvider>().loadTeachers();
    });

    _scrollController.addListener(() {
      if (_scrollController.position.pixels >=
          _scrollController.position.maxScrollExtent - 200) {
        context.read<TeachersProvider>().loadMore();
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

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: SearchBar(
            controller: _searchController,
            hintText: 'Tìm kiếm giáo viên...',
            elevation: WidgetStateProperty.all(0),
            backgroundColor: WidgetStateProperty.all(
              colorScheme.surfaceContainerHighest.withOpacity(0.3),
            ),
            trailing: [
              if (_searchController.text.isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.clear, size: 20),
                  onPressed: () {
                    _searchController.clear();
                    context.read<TeachersProvider>().loadTeachers();
                  },
                ),
            ],
            onSubmitted: (query) {
              context.read<TeachersProvider>().loadTeachers(search: query);
            },
          ),
        ),
        Expanded(
          child: Consumer<TeachersProvider>(
            builder: (context, provider, _) {
              if (provider.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }

              if (provider.error != null) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(provider.error!,
                          style: TextStyle(color: colorScheme.error)),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: () => provider.loadTeachers(),
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                );
              }

              if (provider.teachers.isEmpty) {
                return Center(
                  child: Text('Chưa có giáo viên nào',
                      style: TextStyle(color: colorScheme.onSurfaceVariant)),
                );
              }

              return RefreshIndicator(
                onRefresh: () =>
                    provider.loadTeachers(search: _searchController.text),
                child: ListView.builder(
                  controller: _scrollController,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  itemCount: provider.teachers.length +
                      (provider.isLoadingMore ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index >= provider.teachers.length) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(16),
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      );
                    }

                    final teacher = provider.teachers[index];
                    return _TeacherTile(
                      teacher: teacher,
                      onTap: () => _showTeacherDetail(context, teacher),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showTeacherDetail(
      BuildContext context, Map<String, dynamic> teacher) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final user = teacher['user'] as Map<String, dynamic>? ?? {};
    final firstName = user['firstName'] ?? teacher['firstName'] ?? '';
    final lastName = user['lastName'] ?? teacher['lastName'] ?? '';
    final email = user['email'] ?? teacher['email'] ?? '';
    final phone = user['phone'] ?? teacher['phone'] ?? '';
    final code = teacher['teacherCode'] ?? '';
    final specialization = teacher['specialization'] ?? '';
    final qualification = teacher['qualification'] ?? '';
    final department = teacher['department'] ?? '';
    final status = teacher['status'] ?? 'active';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.3,
          maxChildSize: 0.9,
          expand: false,
          builder: (_, scrollController) {
            return ListView(
              controller: scrollController,
              padding: const EdgeInsets.all(24),
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: colorScheme.outlineVariant,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Center(
                  child: CircleAvatar(
                    radius: 36,
                    backgroundColor: colorScheme.primaryContainer,
                    child: Text(
                      firstName.isNotEmpty ? firstName[0].toUpperCase() : '?',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Center(
                  child: Text(
                    '$firstName $lastName',
                    style: theme.textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.w600),
                  ),
                ),
                if (code.isNotEmpty)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text('Mã GV: $code',
                          style: TextStyle(
                              color: colorScheme.onSurfaceVariant,
                              fontSize: 13)),
                    ),
                  ),
                const SizedBox(height: 20),
                _DetailRow(label: 'Email', value: email.isEmpty ? 'Chưa cập nhật' : email),
                _DetailRow(label: 'Điện thoại', value: phone.isEmpty ? 'Chưa cập nhật' : phone),
                _DetailRow(label: 'Chuyên môn', value: specialization.isEmpty ? 'Chưa cập nhật' : specialization),
                _DetailRow(label: 'Bằng cấp', value: qualification.isEmpty ? 'Chưa cập nhật' : qualification),
                _DetailRow(label: 'Bộ môn', value: department.isEmpty ? 'Chưa cập nhật' : department),
                _DetailRow(
                  label: 'Trạng thái',
                  value: status == 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động',
                  valueColor: status == 'active' ? Colors.green : colorScheme.error,
                ),
              ],
            );
          },
        );
      },
    );
  }
}

class _TeacherTile extends StatelessWidget {
  final Map<String, dynamic> teacher;
  final VoidCallback onTap;

  const _TeacherTile({required this.teacher, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final user = teacher['user'] as Map<String, dynamic>? ?? {};
    final firstName = user['firstName'] ?? teacher['firstName'] ?? '';
    final lastName = user['lastName'] ?? teacher['lastName'] ?? '';
    final code = teacher['teacherCode'] ?? '';
    final specialization = teacher['specialization'] ?? '';
    final status = teacher['status'] ?? 'active';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: colorScheme.tertiaryContainer,
          child: Text(
            firstName.isNotEmpty ? firstName[0].toUpperCase() : '?',
            style: TextStyle(
              color: colorScheme.onTertiaryContainer,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        title: Text(
          '$firstName $lastName',
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        subtitle: Text(
          specialization.isNotEmpty ? specialization : 'Mã: $code',
          style: TextStyle(fontSize: 12, color: colorScheme.onSurfaceVariant),
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
            status == 'active' ? 'Hoạt động' : 'Ngừng',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: status == 'active' ? Colors.green.shade700 : Colors.grey,
            ),
          ),
        ),
        onTap: onTap,
      ),
    );
  }
}

class _AccountsTab extends StatefulWidget {
  const _AccountsTab();
  @override
  State<_AccountsTab> createState() => _AccountsTabState();
}

class _AccountsTabState extends State<_AccountsTab> {
  final _searchController = TextEditingController();
  String _roleFilter = 'all';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TeachersProvider>().loadUsers();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _applyFilter() {
    context.read<TeachersProvider>().loadUsers(
          search: _searchController.text.isNotEmpty
              ? _searchController.text
              : null,
          role: _roleFilter != 'all' ? _roleFilter : null,
        );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: SearchBar(
            controller: _searchController,
            hintText: 'Tìm kiếm tài khoản...',
            elevation: WidgetStateProperty.all(0),
            backgroundColor: WidgetStateProperty.all(
              colorScheme.surfaceContainerHighest.withOpacity(0.3),
            ),
            trailing: [
              if (_searchController.text.isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.clear, size: 20),
                  onPressed: () {
                    _searchController.clear();
                    _applyFilter();
                  },
                ),
            ],
            onSubmitted: (_) => _applyFilter(),
          ),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              for (final entry in {
                'all': 'Tất cả',
                'TEACHER': 'Giáo viên',
                'SCHOOL_ADMIN': 'Admin',
                'STUDENT': 'Học sinh',
                'PARENT': 'Phụ huynh',
                'STAFF': 'Nhân viên',
              }.entries) ...[
                FilterChip(
                  label: Text(entry.value),
                  selected: _roleFilter == entry.key,
                  onSelected: (_) {
                    setState(() => _roleFilter = entry.key);
                    _applyFilter();
                  },
                ),
                const SizedBox(width: 8),
              ],
            ],
          ),
        ),
        Expanded(
          child: Consumer<TeachersProvider>(
            builder: (context, provider, _) {
              if (provider.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }

              if (provider.error != null) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(provider.error!,
                          style: TextStyle(color: colorScheme.error)),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: _applyFilter,
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                );
              }

              if (provider.users.isEmpty) {
                return Center(
                  child: Text('Chưa có tài khoản nào',
                      style: TextStyle(color: colorScheme.onSurfaceVariant)),
                );
              }

              return RefreshIndicator(
                onRefresh: () async => _applyFilter(),
                child: ListView.builder(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  itemCount: provider.users.length,
                  itemBuilder: (context, index) {
                    final user = provider.users[index];
                    return _UserTile(
                      user: user,
                      onToggle: () async {
                        final ok = await provider
                            .toggleUserActive(user['id'] ?? '');
                        if (ok && context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text('Đã cập nhật trạng thái')),
                          );
                        }
                      },
                      onDelete: () => _confirmDeleteUser(context, user, provider),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _confirmDeleteUser(BuildContext context, Map<String, dynamic> user,
      TeachersProvider provider) {
    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}';
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xoá tài khoản'),
        content: Text('Bạn chắc chắn muốn xoá $name?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Huỷ')),
          FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.error),
            onPressed: () async {
              try {
                await provider.deleteUser(user['id'].toString());
                if (ctx.mounted) Navigator.pop(ctx);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Đã xoá tài khoản')),
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

class _UserTile extends StatelessWidget {
  final Map<String, dynamic> user;
  final VoidCallback onToggle;
  final VoidCallback? onDelete;

  const _UserTile({required this.user, required this.onToggle, this.onDelete});

  String _roleLabel(String role) {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'SCHOOL_ADMIN':
        return 'Admin';
      case 'PRINCIPAL':
        return 'Hiệu trưởng';
      case 'TEACHER':
        return 'Giáo viên';
      case 'STUDENT':
        return 'Học sinh';
      case 'PARENT':
        return 'Phụ huynh';
      case 'STAFF':
        return 'Nhân viên';
      default:
        return role;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final firstName = user['firstName'] ?? '';
    final lastName = user['lastName'] ?? '';
    final email = user['email'] ?? '';
    final role = user['role'] ?? '';
    final status = user['status'] ?? 'active';
    final isActive = status == 'active';

    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor:
              isActive ? colorScheme.secondaryContainer : colorScheme.surfaceContainerHighest,
          child: Text(
            firstName.isNotEmpty ? firstName[0].toUpperCase() : '?',
            style: TextStyle(
              color: isActive
                  ? colorScheme.onSecondaryContainer
                  : colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        title: Text(
          '$firstName $lastName',
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        subtitle: Row(
          children: [
            Text(email,
                style: TextStyle(
                    fontSize: 12, color: colorScheme.onSurfaceVariant)),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer.withOpacity(0.5),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                _roleLabel(role),
                style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: colorScheme.primary),
              ),
            ),
          ],
        ),
        trailing: Switch(
          value: isActive,
          onChanged: (_) => onToggle(),
        ),
        onLongPress: onDelete,
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _DetailRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.w500,
                color: valueColor ?? colorScheme.onSurface,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
