import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/dashboard_provider.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  static bool _isAdmin(String? role) =>
      role == 'SCHOOL_ADMIN' || role == 'SUPER_ADMIN' || role == 'admin';
  static bool _isTeacher(String? role) => role == 'TEACHER';

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final role = auth.user?.role;

    if (_isAdmin(role) || _isTeacher(role)) {
      return _AdminTeacherDashboard(auth: auth);
    }
    return _StudentDashboard(auth: auth);
  }
}

class _AdminTeacherDashboard extends StatelessWidget {
  final AuthProvider auth;
  const _AdminTeacherDashboard({required this.auth});

  static bool _isAdmin(String? role) =>
      role == 'SCHOOL_ADMIN' || role == 'SUPER_ADMIN' || role == 'admin';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _isAdmin(user?.role) ? 'Dashboard' : 'Tổng quan',
              style: theme.textTheme.titleLarge,
            ),
            if (user?.school != null)
              Text(user!.school!.name,
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: colorScheme.onSurfaceVariant)),
          ],
        ),
        actions: [
          IconButton(
              icon: const Icon(Icons.settings_outlined),
              onPressed: () => context.push('/settings')),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: () => context.push('/profile'),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: colorScheme.primaryContainer,
              child: Text(
                (user?.firstName != null && user!.firstName.isNotEmpty)
                    ? user.firstName[0].toUpperCase()
                    : '?',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: colorScheme.onPrimaryContainer,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: Consumer<DashboardProvider>(
        builder: (context, dashboard, _) {
          return RefreshIndicator(
            onRefresh: () => dashboard.refresh(),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: [
                if (dashboard.isLoading)
                  const Padding(
                      padding: EdgeInsets.all(48),
                      child: Center(child: CircularProgressIndicator()))
                else if (dashboard.error != null)
                  _ErrorCard(
                      message: dashboard.error!,
                      onRetry: () => dashboard.refresh())
                else ...[

                  _StatsRow(stats: dashboard.stats ?? {}, colorScheme: colorScheme),
                  const SizedBox(height: 24),

                  _GenderChart(
                    male: (dashboard.stats?['maleStudents'] ?? 0).toDouble(),
                    female: (dashboard.stats?['femaleStudents'] ?? 0).toDouble(),
                  ),
                  const SizedBox(height: 16),
                  _OverviewChart(stats: dashboard.stats ?? {}),
                ],

                const SizedBox(height: 24),

                Text('Truy cập nhanh',
                    style: theme.textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w500)),
                const SizedBox(height: 12),

                _QuickActionsGrid(
                  actions: _isAdmin(auth.user?.role)
                      ? _adminActions(context)
                      : _teacherActions(context),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  List<_ActionItem> _adminActions(BuildContext context) => [
        _ActionItem(Icons.people_outlined, 'Học sinh', () => context.go('/students')),
        _ActionItem(Icons.leaderboard_outlined, 'Điểm số', () => context.go('/grades')),
        _ActionItem(Icons.fact_check_outlined, 'Điểm danh', () => context.go('/attendance')),
        _ActionItem(Icons.calendar_today_outlined, 'Thời khóa biểu', () => context.go('/schedule')),
        _ActionItem(Icons.receipt_long_outlined, 'Tài chính', () => context.push('/finance')),
        _ActionItem(Icons.badge_outlined, 'GV & Nhân sự', () => context.push('/teachers')),
        _ActionItem(Icons.school_outlined, 'Tuyển sinh', () => context.push('/enrollment')),
        _ActionItem(Icons.event_busy_outlined, 'Đơn xin nghỉ', () => context.push('/attendance/leave-requests')),
        _ActionItem(Icons.assignment_outlined, 'Bài tập', () => context.go('/assignments')),
        _ActionItem(Icons.bar_chart_outlined, 'Báo cáo', () => context.push('/reports')),
        _ActionItem(Icons.smart_toy_outlined, 'AI Chat', () => context.push('/ai-chat')),
        _ActionItem(Icons.notifications_outlined, 'Thông báo', () => context.go('/notifications')),
        _ActionItem(Icons.settings_outlined, 'Cài đặt', () => context.push('/settings')),
      ];

  List<_ActionItem> _teacherActions(BuildContext context) => [
        _ActionItem(Icons.qr_code_scanner_outlined, 'Chấm công', () => context.push('/attendance/scan')),
        _ActionItem(Icons.people_outlined, 'HS lớp tôi', () => context.go('/students')),
        _ActionItem(Icons.assignment_outlined, 'Bài tập', () => context.go('/assignments')),
        _ActionItem(Icons.leaderboard_outlined, 'Nhập điểm', () => context.go('/grades')),
        _ActionItem(Icons.fact_check_outlined, 'Điểm danh', () => context.go('/attendance')),
        _ActionItem(Icons.event_busy_outlined, 'Đơn xin nghỉ', () => context.push('/attendance/leave-requests')),
        _ActionItem(Icons.calendar_today_outlined, 'Lịch dạy', () => context.go('/schedule')),
        _ActionItem(Icons.smart_toy_outlined, 'AI Chat', () => context.push('/ai-chat')),
        _ActionItem(Icons.notifications_outlined, 'Hộp thư', () => context.go('/notifications')),
        _ActionItem(Icons.settings_outlined, 'Cài đặt', () => context.push('/settings')),
      ];
}

class _StudentDashboard extends StatelessWidget {
  final AuthProvider auth;
  const _StudentDashboard({required this.auth});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Xin chào, ${user?.firstName ?? ''}',
                style: theme.textTheme.titleLarge),
            Text('Lớp 10A1',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: colorScheme.onSurfaceVariant)),
          ],
        ),
        actions: [
          IconButton(
              icon: const Icon(Icons.settings_outlined),
              onPressed: () => context.push('/settings')),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: () => context.push('/profile'),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: colorScheme.primaryContainer,
              child: Text(
                (user?.firstName != null && user!.firstName.isNotEmpty)
                    ? user.firstName[0].toUpperCase()
                    : '?',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: colorScheme.onPrimaryContainer,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: Consumer<DashboardProvider>(
        builder: (context, dashboard, _) {
          return RefreshIndicator(
            onRefresh: () => dashboard.refresh(),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: [

                Row(children: [
                  Expanded(
                      child: _StatCard(
                          icon: Icons.assignment_outlined,
                          label: 'Bài tập chờ',
                          value: '0',
                          color: colorScheme.tertiary)),
                  const SizedBox(width: 12),
                  Expanded(
                      child: _StatCard(
                          icon: Icons.notifications_outlined,
                          label: 'Thông báo mới',
                          value:
                              '${dashboard.stats?['unreadNotifications'] ?? 0}',
                          color: colorScheme.primary)),
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(
                      child: _StatCard(
                          icon: Icons.trending_up_outlined,
                          label: 'Điểm TB',
                          value: '-',
                          color: colorScheme.secondary)),
                  const SizedBox(width: 12),
                  Expanded(
                      child: _StatCard(
                          icon: Icons.event_available_outlined,
                          label: 'Buổi điểm danh',
                          value: '0',
                          color: colorScheme.tertiary)),
                ]),

                const SizedBox(height: 24),

                Text('Truy cập nhanh',
                    style: theme.textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w500)),
                const SizedBox(height: 12),

                _QuickActionsGrid(
                  actions: [
                    _ActionItem(Icons.qr_code_scanner_outlined, 'Điểm danh QR',
                        () => context.push('/attendance/scan')),
                    _ActionItem(Icons.assignment_outlined, 'Bài tập',
                        () => context.go('/assignments')),
                    _ActionItem(Icons.leaderboard_outlined, 'Kết quả HT',
                        () => context.go('/grades')),
                    _ActionItem(Icons.fact_check_outlined, 'Lịch sử ĐD',
                        () => context.go('/attendance')),
                    _ActionItem(Icons.event_busy_outlined, 'Xin nghỉ',
                        () => context.push('/attendance/leave-requests')),
                    _ActionItem(Icons.calendar_today_outlined, 'Lịch học',
                        () => context.go('/schedule')),
                    _ActionItem(Icons.smart_toy_outlined, 'Hỏi đáp AI',
                        () => context.push('/ai-chat')),
                    _ActionItem(Icons.notifications_outlined, 'Thông báo',
                        () => context.go('/notifications')),
                    _ActionItem(Icons.settings_outlined, 'Cài đặt',
                        () => context.push('/settings')),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  final Map<String, dynamic> stats;
  final ColorScheme colorScheme;
  const _StatsRow({required this.stats, required this.colorScheme});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(children: [
          Expanded(
              child: _StatCard(
                  icon: Icons.people_outlined,
                  label: 'Tổng học sinh',
                  value: '${stats['totalStudents'] ?? 0}',
                  color: colorScheme.primary)),
          const SizedBox(width: 12),
          Expanded(
              child: _StatCard(
                  icon: Icons.class_outlined,
                  label: 'Lớp học',
                  value: '${stats['classCount'] ?? 0}',
                  color: colorScheme.tertiary)),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(
              child: _StatCard(
                  icon: Icons.check_circle_outlined,
                  label: 'Đang học',
                  value: '${stats['activeStudents'] ?? 0}',
                  color: colorScheme.secondary)),
          const SizedBox(width: 12),
          Expanded(
              child: _StatCard(
                  icon: Icons.notifications_outlined,
                  label: 'Chưa đọc',
                  value: '${stats['unreadNotifications'] ?? 0}',
                  color: colorScheme.error)),
        ]),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final Color color;
  const _StatCard(
      {required this.icon,
      required this.label,
      required this.value,
      required this.color});
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 12),
          Text(value,
              style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w500,
                  color: colorScheme.onSurface)),
          const SizedBox(height: 2),
          Text(label,
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: colorScheme.onSurfaceVariant)),
        ]),
      ),
    );
  }
}

class _GenderChart extends StatelessWidget {
  final double male, female;
  const _GenderChart({required this.male, required this.female});
  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final theme = Theme.of(context);
    final total = male + female;
    if (total == 0) {
      return Card(
          child: Padding(
              padding: const EdgeInsets.all(24),
              child: Center(
                  child: Text('Chưa có dữ liệu',
                      style: TextStyle(color: colorScheme.onSurfaceVariant)))));
    }
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Tỷ lệ giới tính',
                style: theme.textTheme.titleSmall
                    ?.copyWith(color: colorScheme.onSurfaceVariant)),
            const SizedBox(height: 16),
            Row(children: [
              SizedBox(
                  width: 100,
                  height: 100,
                  child: PieChart(PieChartData(
                    sectionsSpace: 2,
                    centerSpaceRadius: 20,
                    sections: [
                      PieChartSectionData(
                          value: male,
                          color: colorScheme.primary,
                          radius: 24,
                          title: '${male.toInt()}',
                          titleStyle: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Colors.white)),
                      PieChartSectionData(
                          value: female,
                          color: colorScheme.tertiary,
                          radius: 24,
                          title: '${female.toInt()}',
                          titleStyle: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Colors.white)),
                    ],
                  ))),
              const SizedBox(width: 24),
              Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    _LegendRow(
                        color: colorScheme.primary,
                        label: 'Nam',
                        value: '${(male / total * 100).toStringAsFixed(0)}%'),
                    const SizedBox(height: 12),
                    _LegendRow(
                        color: colorScheme.tertiary,
                        label: 'Nữ',
                        value: '${(female / total * 100).toStringAsFixed(0)}%'),
                    const SizedBox(height: 12),
                    Text('Tổng: ${total.toInt()} học sinh',
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: colorScheme.onSurfaceVariant)),
                  ])),
            ]),
          ],
        ),
      ),
    );
  }
}

class _LegendRow extends StatelessWidget {
  final Color color;
  final String label, value;
  const _LegendRow(
      {required this.color, required this.label, required this.value});
  @override
  Widget build(BuildContext context) => Row(children: [
        Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
                color: color, borderRadius: BorderRadius.circular(4))),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(fontSize: 13)),
        const Spacer(),
        Text(value,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
      ]);
}

class _OverviewChart extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _OverviewChart({required this.stats});
  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final theme = Theme.of(context);
    final total = (stats['totalStudents'] ?? 0).toDouble();
    final active = (stats['activeStudents'] ?? 0).toDouble();
    final male = (stats['maleStudents'] ?? 0).toDouble();
    final female = (stats['femaleStudents'] ?? 0).toDouble();
    if (total == 0) {
      return Card(
          child: Padding(
              padding: const EdgeInsets.all(24),
              child: Center(
                  child: Text('Chưa có dữ liệu',
                      style: TextStyle(color: colorScheme.onSurfaceVariant)))));
    }
    final maxY = total * 1.2;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Thống kê tổng quan',
                style: theme.textTheme.titleSmall
                    ?.copyWith(color: colorScheme.onSurfaceVariant)),
            const SizedBox(height: 16),
            SizedBox(
                height: 180,
                child: BarChart(BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: maxY,
                  barTouchData: BarTouchData(
                      touchTooltipData: BarTouchTooltipData(
                    getTooltipItem: (group, groupIndex, rod, rodIndex) {
                      const labels = ['Tổng', 'Đang học', 'Nam', 'Nữ'];
                      return BarTooltipItem(
                          '${labels[groupIndex]}\n${rod.toY.toInt()}',
                          TextStyle(
                              color: colorScheme.onSurface,
                              fontSize: 12,
                              fontWeight: FontWeight.w500));
                    },
                  )),
                  titlesData: FlTitlesData(
                    topTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                    leftTitles: AxisTitles(
                        sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 32,
                            getTitlesWidget: (value, meta) => Text(
                                value.toInt().toString(),
                                style: TextStyle(
                                    fontSize: 10,
                                    color: colorScheme.onSurfaceVariant)))),
                    bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (value, meta) {
                              const labels = ['Tổng', 'Đang học', 'Nam', 'Nữ'];
                              final i = value.toInt();
                              if (i >= 0 && i < labels.length) {
                                return Padding(
                                    padding: const EdgeInsets.only(top: 6),
                                    child: Text(labels[i],
                                        style: TextStyle(
                                            fontSize: 11,
                                            color:
                                                colorScheme.onSurfaceVariant)));
                              }
                              return const SizedBox.shrink();
                            })),
                  ),
                  gridData: FlGridData(
                      show: true,
                      drawVerticalLine: false,
                      horizontalInterval: maxY / 4,
                      getDrawingHorizontalLine: (value) => FlLine(
                          color: colorScheme.outlineVariant.withOpacity(0.3),
                          strokeWidth: 0.5)),
                  borderData: FlBorderData(show: false),
                  barGroups: [
                    _makeBar(0, total, colorScheme.primary),
                    _makeBar(1, active, colorScheme.secondary),
                    _makeBar(2, male, colorScheme.primary.withOpacity(0.6)),
                    _makeBar(3, female, colorScheme.tertiary),
                  ],
                ))),
          ],
        ),
      ),
    );
  }

  BarChartGroupData _makeBar(int x, double y, Color color) =>
      BarChartGroupData(x: x, barRods: [
        BarChartRodData(
            toY: y,
            color: color,
            width: 24,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(8))),
      ]);
}

class _ActionItem {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _ActionItem(this.icon, this.label, this.onTap);
}

class _QuickActionsGrid extends StatelessWidget {
  final List<_ActionItem> actions;
  const _QuickActionsGrid({required this.actions});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 0.85,
      ),
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: actions.length,
      itemBuilder: (context, i) {
        final action = actions[i];
        return InkWell(
          onTap: action.onTap,
          borderRadius: BorderRadius.circular(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(action.icon, color: colorScheme.onSurface, size: 24),
              ),
              const SizedBox(height: 8),
              Text(action.label,
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: colorScheme.onSurface),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis),
            ],
          ),
        );
      },
    );
  }
}

class _ErrorCard extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorCard({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
        child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(children: [
              Icon(Icons.error_outline,
                  color: colorScheme.error, size: 40),
              const SizedBox(height: 16),
              Text(message,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: colorScheme.onSurfaceVariant)),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Thử lại')),
            ])));
  }
}
