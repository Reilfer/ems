import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/enrollment_provider.dart';

class EnrollmentScreen extends StatefulWidget {
  const EnrollmentScreen({super.key});

  @override
  State<EnrollmentScreen> createState() => _EnrollmentScreenState();
}

class _EnrollmentScreenState extends State<EnrollmentScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _appStatusFilter = '';
  String _leadStatusFilter = '';

  static const _appStatuses = [
    {'value': '', 'label': 'Tất cả'},
    {'value': 'submitted', 'label': 'Đã nộp'},
    {'value': 'reviewing', 'label': 'Đang xét'},
    {'value': 'interview', 'label': 'Phỏng vấn'},
    {'value': 'testing', 'label': 'Kiểm tra'},
    {'value': 'accepted', 'label': 'Đậu'},
    {'value': 'rejected', 'label': 'Trượt'},
    {'value': 'enrolled', 'label': 'Nhập học'},
    {'value': 'withdrawn', 'label': 'Rút hồ sơ'},
  ];

  static const _leadStatuses = [
    {'value': '', 'label': 'Tất cả'},
    {'value': 'new', 'label': 'Mới'},
    {'value': 'contacted', 'label': 'Đã liên hệ'},
    {'value': 'interested', 'label': 'Quan tâm'},
    {'value': 'visiting', 'label': 'Tham quan'},
    {'value': 'applied', 'label': 'Đã nộp HS'},
    {'value': 'enrolled', 'label': 'Đã nhập học'},
    {'value': 'lost', 'label': 'Mất'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<EnrollmentProvider>();
      provider.loadApplications();
      provider.loadLeads();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tuyển sinh'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Hồ sơ tuyển sinh'),
            Tab(text: 'CRM Leads'),
          ],
        ),
      ),
      body: Consumer<EnrollmentProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(provider.error!, style: theme.textTheme.bodyLarge),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () {
                      provider.loadApplications();
                      provider.loadLeads();
                    },
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }
          return TabBarView(
            controller: _tabController,
            children: [
              _buildApplicationsTab(context, provider),
              _buildLeadsTab(context, provider),
            ],
          );
        },
      ),
    );
  }

  Widget _buildApplicationsTab(
      BuildContext context, EnrollmentProvider provider) {
    final theme = Theme.of(context);
    return Column(
      children: [

        SizedBox(
          height: 56,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            scrollDirection: Axis.horizontal,
            itemCount: _appStatuses.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final s = _appStatuses[index];
              final selected = _appStatusFilter == s['value'];
              return FilterChip(
                label: Text(s['label']!),
                selected: selected,
                onSelected: (_) {
                  setState(() => _appStatusFilter = s['value']!);
                  provider.loadApplications(
                    status:
                        s['value']!.isEmpty ? null : s['value'],
                  );
                },
              );
            },
          ),
        ),

        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Text(
                'Tổng: ${provider.totalApplications} hồ sơ',
                style: theme.textTheme.labelLarge,
              ),
              const Spacer(),
            ],
          ),
        ),
        const SizedBox(height: 8),

        Expanded(
          child: provider.applications.isEmpty
              ? Center(
                  child: Text(
                    'Không có hồ sơ nào',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: provider.refreshApplications,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 8),
                    itemCount: provider.applications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final app = provider.applications[index];
                      return _ApplicationCard(
                        application: app,
                        onStatusChange: (newStatus) {
                          provider.updateApplicationStatus(
                            app['id']?.toString() ?? '',
                            newStatus,
                          );
                        },
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildLeadsTab(BuildContext context, EnrollmentProvider provider) {
    final theme = Theme.of(context);
    return Column(
      children: [

        SizedBox(
          height: 56,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            scrollDirection: Axis.horizontal,
            itemCount: _leadStatuses.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final s = _leadStatuses[index];
              final selected = _leadStatusFilter == s['value'];
              return FilterChip(
                label: Text(s['label']!),
                selected: selected,
                onSelected: (_) {
                  setState(() => _leadStatusFilter = s['value']!);
                  provider.loadLeads(
                    status:
                        s['value']!.isEmpty ? null : s['value'],
                  );
                },
              );
            },
          ),
        ),

        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Text(
                'Tổng: ${provider.totalLeads} leads',
                style: theme.textTheme.labelLarge,
              ),
              const Spacer(),
            ],
          ),
        ),
        const SizedBox(height: 8),

        Expanded(
          child: provider.leads.isEmpty
              ? Center(
                  child: Text(
                    'Không có leads nào',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: provider.refreshLeads,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 8),
                    itemCount: provider.leads.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final lead = provider.leads[index];
                      return _LeadCard(
                        lead: lead,
                        onStatusChange: (newStatus) {
                          provider.updateLeadStatus(
                            lead['id']?.toString() ?? '',
                            newStatus,
                          );
                        },
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }
}

class _ApplicationCard extends StatelessWidget {
  final Map<String, dynamic> application;
  final ValueChanged<String> onStatusChange;

  const _ApplicationCard({
    required this.application,
    required this.onStatusChange,
  });

  Color _statusColor(String? status) {
    switch (status) {
      case 'submitted':
        return Colors.blue;
      case 'reviewing':
        return Colors.orange;
      case 'interview':
        return Colors.deepPurple;
      case 'testing':
        return Colors.indigo;
      case 'accepted':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      case 'enrolled':
        return Colors.teal;
      case 'withdrawn':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  String _statusLabel(String? status) {
    switch (status) {
      case 'submitted':
        return 'Đã nộp';
      case 'reviewing':
        return 'Đang xét';
      case 'interview':
        return 'Phỏng vấn';
      case 'testing':
        return 'Kiểm tra';
      case 'accepted':
        return 'Trúng tuyển';
      case 'rejected':
        return 'Không đậu';
      case 'enrolled':
        return 'Nhập học';
      case 'withdrawn':
        return 'Rút hồ sơ';
      default:
        return status ?? 'N/A';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final status = application['status']?.toString();
    final studentName = application['studentName'] ??
        application['student']?['name'] ??
        'Không rõ tên';
    final email = application['email'] ??
        application['student']?['email'] ??
        '';
    final grade = application['gradeLevel'] ?? application['grade'] ?? '';
    final submittedAt = application['createdAt'] ?? application['submittedAt'];

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _showDetail(context),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      studentName.toString(),
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _statusColor(status).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _statusLabel(status),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: _statusColor(status),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              if (email.toString().isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  email.toString(),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
              if (grade.toString().isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  'Khối: $grade',
                  style: theme.textTheme.bodySmall,
                ),
              ],
              if (submittedAt != null) ...[
                const SizedBox(height: 4),
                Text(
                  'Ngày nộp: ${_formatDate(submittedAt.toString())}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showDetail(BuildContext context) {
    final theme = Theme.of(context);
    final status = application['status']?.toString();
    final studentName = application['studentName'] ??
        application['student']?['name'] ??
        'Không rõ';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.4,
        maxChildSize: 0.95,
        expand: false,
        builder: (_, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 32,
                  height: 4,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.onSurfaceVariant.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text('Chi tiết hồ sơ',
                  style: theme.textTheme.headlineSmall),
              const SizedBox(height: 16),
              _infoRow(theme, 'Họ tên', studentName.toString()),
              _infoRow(theme, 'Email',
                  (application['email'] ?? '').toString()),
              _infoRow(theme, 'SĐT',
                  (application['phone'] ?? '').toString()),
              _infoRow(theme, 'Khối',
                  (application['gradeLevel'] ?? '').toString()),
              _infoRow(theme, 'Trạng thái', _statusLabel(status)),
              _infoRow(theme, 'Ghi chú',
                  (application['notes'] ?? '').toString()),
              const SizedBox(height: 24),
              Text('Cập nhật trạng thái',
                  style: theme.textTheme.titleMedium),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  'submitted',
                  'reviewing',
                  'interview',
                  'testing',
                  'accepted',
                  'rejected',
                  'enrolled',
                  'withdrawn',
                ]
                    .where((s) => s != status)
                    .map(
                      (s) => ActionChip(
                        label: Text(_statusLabel(s)),
                        backgroundColor:
                            _statusColor(s).withOpacity(0.12),
                        onPressed: () {
                          onStatusChange(s);
                          Navigator.pop(ctx);
                        },
                      ),
                    )
                    .toList(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoRow(ThemeData theme, String label, String value) {
    if (value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(label,
                style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant)),
          ),
          Expanded(
            child: Text(value, style: theme.textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }

  String _formatDate(String isoDate) {
    try {
      final dt = DateTime.parse(isoDate);
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    } catch (_) {
      return isoDate;
    }
  }
}

class _LeadCard extends StatelessWidget {
  final Map<String, dynamic> lead;
  final ValueChanged<String> onStatusChange;

  const _LeadCard({
    required this.lead,
    required this.onStatusChange,
  });

  Color _statusColor(String? status) {
    switch (status) {
      case 'new':
        return Colors.blue;
      case 'contacted':
        return Colors.orange;
      case 'interested':
        return Colors.deepPurple;
      case 'visiting':
        return Colors.indigo;
      case 'applied':
        return Colors.cyan;
      case 'enrolled':
        return Colors.green;
      case 'lost':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _statusLabel(String? status) {
    switch (status) {
      case 'new':
        return 'Mới';
      case 'contacted':
        return 'Đã liên hệ';
      case 'interested':
        return 'Quan tâm';
      case 'visiting':
        return 'Tham quan';
      case 'applied':
        return 'Đã nộp HS';
      case 'enrolled':
        return 'Đã nhập học';
      case 'lost':
        return 'Mất';
      default:
        return status ?? 'N/A';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final status = lead['status']?.toString();
    final name = lead['name'] ?? lead['parentName'] ?? 'Không rõ';
    final phone = lead['phone'] ?? '';
    final email = lead['email'] ?? '';
    final source = lead['source'] ?? '';

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _showDetail(context),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      name.toString(),
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _statusColor(status).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _statusLabel(status),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: _statusColor(status),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              if (phone.toString().isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  'SĐT: $phone',
                  style: theme.textTheme.bodySmall,
                ),
              ],
              if (email.toString().isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  email.toString(),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
              if (source.toString().isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  'Nguồn: $source',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showDetail(BuildContext context) {
    final theme = Theme.of(context);
    final status = lead['status']?.toString();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.3,
        maxChildSize: 0.9,
        expand: false,
        builder: (_, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 32,
                  height: 4,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.onSurfaceVariant.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text('Chi tiết Lead', style: theme.textTheme.headlineSmall),
              const SizedBox(height: 16),
              _infoRow(theme, 'Tên', (lead['name'] ?? '').toString()),
              _infoRow(theme, 'PH', (lead['parentName'] ?? '').toString()),
              _infoRow(theme, 'SĐT', (lead['phone'] ?? '').toString()),
              _infoRow(theme, 'Email', (lead['email'] ?? '').toString()),
              _infoRow(theme, 'Nguồn', (lead['source'] ?? '').toString()),
              _infoRow(
                  theme, 'Trạng thái', _statusLabel(status)),
              _infoRow(theme, 'Ghi chú', (lead['notes'] ?? '').toString()),
              const SizedBox(height: 24),
              Text('Cập nhật trạng thái',
                  style: theme.textTheme.titleMedium),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  'new',
                  'contacted',
                  'interested',
                  'visiting',
                  'applied',
                  'enrolled',
                  'lost',
                ]
                    .where((s) => s != status)
                    .map(
                      (s) => ActionChip(
                        label: Text(_statusLabel(s)),
                        backgroundColor:
                            _statusColor(s).withOpacity(0.12),
                        onPressed: () {
                          onStatusChange(s);
                          Navigator.pop(ctx);
                        },
                      ),
                    )
                    .toList(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoRow(ThemeData theme, String label, String value) {
    if (value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(label,
                style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant)),
          ),
          Expanded(
            child: Text(value, style: theme.textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}
