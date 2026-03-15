import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/reports_provider.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReportsProvider>().loadAllReports();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Báo cáo'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Học tập'),
            Tab(text: 'Điểm danh'),
            Tab(text: 'Tài chính'),
            Tab(text: 'Tuyển sinh'),
          ],
        ),
      ),
      body: Consumer<ReportsProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(provider.error!),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: provider.refresh,
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }
          return TabBarView(
            controller: _tabController,
            children: [
              _AcademicTab(stats: provider.academicStats),
              _AttendanceTab(stats: provider.attendanceStats),
              _FinanceTab(stats: provider.financeStats),
              _EnrollmentTab(stats: provider.enrollmentStats),
            ],
          );
        },
      ),
    );
  }
}

class _AcademicTab extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _AcademicTab({required this.stats});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final gpa = (stats['averageGPA'] ?? 0).toDouble();
    final passRate = (stats['passRate'] ?? 0).toDouble();
    final totalStudents = stats['totalStudents'] ?? 0;
    final totalExams = stats['totalExams'] ?? 0;
    final distribution =
        List<Map<String, dynamic>>.from(stats['gradeDistribution'] ?? []);

    return RefreshIndicator(
      onRefresh: () => context.read<ReportsProvider>().refresh(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [

          Row(
            children: [
              Expanded(
                child: _StatCard(
                  label: 'GPA trung bình',
                  value: gpa.toStringAsFixed(1),
                  theme: theme,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  label: 'Tỉ lệ đậu',
                  value: '${passRate.toStringAsFixed(1)}%',
                  theme: theme,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  label: 'Tổng học sinh',
                  value: totalStudents.toString(),
                  theme: theme,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  label: 'Tổng kì thi',
                  value: totalExams.toString(),
                  theme: theme,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          if (distribution.isNotEmpty) ...[
            Text('Phân bố xếp loại', style: theme.textTheme.titleMedium),
            const SizedBox(height: 16),
            SizedBox(
              height: 220,
              child: PieChart(
                PieChartData(
                  sectionsSpace: 2,
                  centerSpaceRadius: 40,
                  sections: distribution.asMap().entries.map((e) {
                    final colors = [
                      theme.colorScheme.primary,
                      theme.colorScheme.secondary,
                      theme.colorScheme.tertiary,
                      theme.colorScheme.error,
                    ];
                    return PieChartSectionData(
                      value: (e.value['value'] ?? 0).toDouble(),
                      title:
                          '${(e.value['value'] ?? 0).toStringAsFixed(1)}%',
                      color: colors[e.key % colors.length],
                      radius: 55,
                      titleStyle: theme.textTheme.labelSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            const SizedBox(height: 12),

            Wrap(
              spacing: 16,
              runSpacing: 8,
              children: distribution.asMap().entries.map((e) {
                final colors = [
                  theme.colorScheme.primary,
                  theme.colorScheme.secondary,
                  theme.colorScheme.tertiary,
                  theme.colorScheme.error,
                ];
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: colors[e.key % colors.length],
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${e.value['label']}',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _AttendanceTab extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _AttendanceTab({required this.stats});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final presentRate = (stats['presentRate'] ?? 0).toDouble();
    final absentRate = (stats['absentRate'] ?? 0).toDouble();
    final lateRate = (stats['lateRate'] ?? 0).toDouble();
    final totalSessions = stats['totalSessions'] ?? 0;
    final weeklyTrend =
        List<Map<String, dynamic>>.from(stats['weeklyTrend'] ?? []);

    return RefreshIndicator(
      onRefresh: () => context.read<ReportsProvider>().refresh(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  label: 'Có mặt',
                  value: '${presentRate.toStringAsFixed(1)}%',
                  theme: theme,
                  valueColor: Colors.green,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _StatCard(
                  label: 'Vắng',
                  value: '${absentRate.toStringAsFixed(1)}%',
                  theme: theme,
                  valueColor: Colors.red,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _StatCard(
                  label: 'Muộn',
                  value: '${lateRate.toStringAsFixed(1)}%',
                  theme: theme,
                  valueColor: Colors.orange,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _StatCard(
            label: 'Tổng buổi học',
            value: totalSessions.toString(),
            theme: theme,
          ),
          const SizedBox(height: 24),

          if (weeklyTrend.isNotEmpty) ...[
            Text('Xu hướng tuần', style: theme.textTheme.titleMedium),
            const SizedBox(height: 16),
            SizedBox(
              height: 220,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: 100,
                  barTouchData: BarTouchData(enabled: true),
                  titlesData: FlTitlesData(
                    show: true,
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, _) {
                          final idx = value.toInt();
                          if (idx < 0 || idx >= weeklyTrend.length) {
                            return const SizedBox.shrink();
                          }
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              weeklyTrend[idx]['day']?.toString() ?? '',
                              style: theme.textTheme.labelSmall,
                            ),
                          );
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 32,
                        getTitlesWidget: (value, _) => Text(
                          '${value.toInt()}%',
                          style: theme.textTheme.labelSmall,
                        ),
                        interval: 25,
                      ),
                    ),
                    topTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                  ),
                  gridData: FlGridData(
                    show: true,
                    horizontalInterval: 25,
                    getDrawingHorizontalLine: (value) => FlLine(
                      color: theme.colorScheme.outlineVariant,
                      strokeWidth: 0.5,
                    ),
                    drawVerticalLine: false,
                  ),
                  borderData: FlBorderData(show: false),
                  barGroups: weeklyTrend.asMap().entries.map((e) {
                    return BarChartGroupData(
                      x: e.key,
                      barRods: [
                        BarChartRodData(
                          toY: (e.value['rate'] ?? 0).toDouble(),
                          color: theme.colorScheme.primary,
                          width: 24,
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(6),
                            topRight: Radius.circular(6),
                          ),
                        ),
                      ],
                    );
                  }).toList(),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _FinanceTab extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _FinanceTab({required this.stats});

  String _formatCurrency(num amount) {
    final s = amount.toInt().toString();
    final buffer = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buffer.write('.');
      buffer.write(s[i]);
    }
    return '${buffer}đ';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final totalRevenue = (stats['totalRevenue'] ?? 0);
    final totalCollected = (stats['totalCollected'] ?? 0);
    final totalPending = (stats['totalPending'] ?? 0);
    final collectionRate = (stats['collectionRate'] ?? 0).toDouble();
    final paid = stats['paidInvoices'] ?? 0;
    final pending = stats['pendingInvoices'] ?? 0;
    final overdue = stats['overdueInvoices'] ?? 0;
    final revenueByMonth =
        List<Map<String, dynamic>>.from(stats['revenueByMonth'] ?? []);

    return RefreshIndicator(
      onRefresh: () => context.read<ReportsProvider>().refresh(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _StatCard(
            label: 'Tổng doanh thu',
            value: _formatCurrency(totalRevenue),
            theme: theme,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  label: 'Đã thu',
                  value: _formatCurrency(totalCollected),
                  theme: theme,
                  valueColor: Colors.green,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  label: 'Còn thiếu',
                  value: _formatCurrency(totalPending),
                  theme: theme,
                  valueColor: Colors.orange,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  label: 'Tỉ lệ thu',
                  value: '${collectionRate.toStringAsFixed(1)}%',
                  theme: theme,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _StatCard(
                  label: 'Đã thanh toán',
                  value: paid.toString(),
                  theme: theme,
                  valueColor: Colors.green,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _StatCard(
                  label: 'Quá hạn',
                  value: overdue.toString(),
                  theme: theme,
                  valueColor: Colors.red,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          if (revenueByMonth.isNotEmpty) ...[
            Text('Doanh thu theo tháng',
                style: theme.textTheme.titleMedium),
            const SizedBox(height: 16),
            SizedBox(
              height: 220,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  barTouchData: BarTouchData(enabled: true),
                  titlesData: FlTitlesData(
                    show: true,
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, _) {
                          final idx = value.toInt();
                          if (idx < 0 || idx >= revenueByMonth.length) {
                            return const SizedBox.shrink();
                          }
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              revenueByMonth[idx]['month']?.toString() ?? '',
                              style: theme.textTheme.labelSmall,
                            ),
                          );
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 40,
                        getTitlesWidget: (value, _) {
                          final millions = (value / 1000000).round();
                          return Text(
                            '${millions}M',
                            style: theme.textTheme.labelSmall,
                          );
                        },
                      ),
                    ),
                    topTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                  ),
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (value) => FlLine(
                      color: theme.colorScheme.outlineVariant,
                      strokeWidth: 0.5,
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  barGroups: revenueByMonth.asMap().entries.map((e) {
                    return BarChartGroupData(
                      x: e.key,
                      barRods: [
                        BarChartRodData(
                          toY: (e.value['amount'] ?? 0).toDouble(),
                          color: theme.colorScheme.primary,
                          width: 24,
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(6),
                            topRight: Radius.circular(6),
                          ),
                        ),
                      ],
                    );
                  }).toList(),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _EnrollmentTab extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _EnrollmentTab({required this.stats});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final totalApps = stats['totalApplications'] ?? 0;
    final accepted = stats['accepted'] ?? 0;
    final rejected = stats['rejected'] ?? 0;
    final pending = stats['pending'] ?? 0;
    final conversionRate = (stats['conversionRate'] ?? 0).toDouble();
    final totalLeads = stats['totalLeads'] ?? 0;
    final leadsBySource =
        List<Map<String, dynamic>>.from(stats['leadsBySource'] ?? []);

    return RefreshIndicator(
      onRefresh: () => context.read<ReportsProvider>().refresh(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  label: 'Tổng hồ sơ',
                  value: totalApps.toString(),
                  theme: theme,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  label: 'Tỉ lệ chuyển đổi',
                  value: '${conversionRate.toStringAsFixed(1)}%',
                  theme: theme,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  label: 'Đậu',
                  value: accepted.toString(),
                  theme: theme,
                  valueColor: Colors.green,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _StatCard(
                  label: 'Trượt',
                  value: rejected.toString(),
                  theme: theme,
                  valueColor: Colors.red,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _StatCard(
                  label: 'Chờ xử lý',
                  value: pending.toString(),
                  theme: theme,
                  valueColor: Colors.orange,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _StatCard(
            label: 'Tổng số leads',
            value: totalLeads.toString(),
            theme: theme,
          ),
          const SizedBox(height: 24),

          if (leadsBySource.isNotEmpty) ...[
            Text('Leads theo nguồn', style: theme.textTheme.titleMedium),
            const SizedBox(height: 16),
            SizedBox(
              height: 220,
              child: PieChart(
                PieChartData(
                  sectionsSpace: 2,
                  centerSpaceRadius: 40,
                  sections: leadsBySource.asMap().entries.map((e) {
                    final colors = [
                      theme.colorScheme.primary,
                      theme.colorScheme.secondary,
                      theme.colorScheme.tertiary,
                      Colors.amber,
                      Colors.cyan,
                    ];
                    return PieChartSectionData(
                      value: (e.value['count'] ?? 0).toDouble(),
                      title: e.value['count'].toString(),
                      color: colors[e.key % colors.length],
                      radius: 55,
                      titleStyle: theme.textTheme.labelSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 16,
              runSpacing: 8,
              children: leadsBySource.asMap().entries.map((e) {
                final colors = [
                  theme.colorScheme.primary,
                  theme.colorScheme.secondary,
                  theme.colorScheme.tertiary,
                  Colors.amber,
                  Colors.cyan,
                ];
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: colors[e.key % colors.length],
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${e.value['source']}',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final ThemeData theme;
  final Color? valueColor;

  const _StatCard({
    required this.label,
    required this.value,
    required this.theme,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: valueColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
