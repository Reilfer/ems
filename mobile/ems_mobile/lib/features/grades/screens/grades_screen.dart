import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/grades_provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';

class GradesScreen extends StatelessWidget {
  const GradesScreen({super.key});

  static bool _isAdmin(String? role) =>
      role == 'SCHOOL_ADMIN' || role == 'SUPER_ADMIN' || role == 'admin';
  static bool _isTeacher(String? role) => role == 'TEACHER';

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final role = auth.user?.role;

    if (_isAdmin(role) || _isTeacher(role)) {
      return const _TeacherGrades();
    }
    return const _StudentGrades();
  }
}

class _StudentGrades extends StatelessWidget {
  const _StudentGrades();

  String _classifyLabel(double? avg) {
    if (avg == null) return '—';
    if (avg >= 8) return 'Giỏi';
    if (avg >= 6.5) return 'Khá';
    if (avg >= 5) return 'TB';
    if (avg >= 3.5) return 'Yếu';
    return 'Kém';
  }

  Color _classifyColor(double? avg) {
    if (avg == null) return Colors.grey;
    if (avg >= 8) return Colors.green.shade700;
    if (avg >= 6.5) return Colors.blue.shade700;
    if (avg >= 5) return Colors.orange.shade700;
    if (avg >= 3.5) return Colors.deepOrange.shade700;
    return Colors.red.shade700;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final subjects = [
      {
        'name': 'Toán',
        'oral': 8.0,
        'quiz15': 7.5,
        'midterm': 8.0,
        'final': 7.0
      },
      {
        'name': 'Ngữ văn',
        'oral': 7.0,
        'quiz15': 6.5,
        'midterm': 7.0,
        'final': 6.5
      },
      {
        'name': 'Tiếng Anh',
        'oral': 9.0,
        'quiz15': 8.5,
        'midterm': 8.0,
        'final': 8.5
      },
      {
        'name': 'Vật lý',
        'oral': 6.0,
        'quiz15': 5.5,
        'midterm': 6.0,
        'final': 5.0
      },
      {
        'name': 'Hóa học',
        'oral': 7.5,
        'quiz15': 7.0,
        'midterm': 7.5,
        'final': 7.0
      },
      {
        'name': 'Sinh học',
        'oral': 8.0,
        'quiz15': 7.5,
        'midterm': 7.5,
        'final': 8.0
      },
      {
        'name': 'Lịch sử',
        'oral': 6.5,
        'quiz15': 6.0,
        'midterm': 7.0,
        'final': 6.5
      },
      {
        'name': 'Địa lý',
        'oral': 7.0,
        'quiz15': 7.0,
        'midterm': 6.5,
        'final': 7.5
      },
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Kết quả học tập')),
      body: Consumer<GradesProvider>(
        builder: (context, provider, _) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [

              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(children: [
                    Text('Bảng điểm tổng hợp',
                        style: theme.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text('Học kỳ I — Năm học 2025-2026',
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: colorScheme.onSurfaceVariant)),
                  ]),
                ),
              ),
              const SizedBox(height: 12),

              Card(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: DataTable(
                    headingRowColor: WidgetStatePropertyAll(
                        colorScheme.primaryContainer.withOpacity(0.3)),
                    columnSpacing: 16,
                    columns: const [
                      DataColumn(
                          label: Text('Môn',
                              style: TextStyle(fontWeight: FontWeight.w600))),
                      DataColumn(
                          label: Text('Miệng',
                              style: TextStyle(fontWeight: FontWeight.w600)),
                          numeric: true),
                      DataColumn(
                          label: Text('15p',
                              style: TextStyle(fontWeight: FontWeight.w600)),
                          numeric: true),
                      DataColumn(
                          label: Text('1 tiết',
                              style: TextStyle(fontWeight: FontWeight.w600)),
                          numeric: true),
                      DataColumn(
                          label: Text('HK',
                              style: TextStyle(fontWeight: FontWeight.w600)),
                          numeric: true),
                      DataColumn(
                          label: Text('TB',
                              style: TextStyle(fontWeight: FontWeight.w600)),
                          numeric: true),
                      DataColumn(
                          label: Text('Loại',
                              style: TextStyle(fontWeight: FontWeight.w600))),
                    ],
                    rows: subjects.map((s) {
                      final oral = s['oral'] as double?;
                      final quiz15 = s['quiz15'] as double?;
                      final midterm = s['midterm'] as double?;
                      final finalE = s['final'] as double?;
                      double? avg;
                      if (oral != null &&
                          quiz15 != null &&
                          midterm != null &&
                          finalE != null) {
                        avg = (oral + quiz15 + midterm * 2 + finalE * 3) / 7;
                        avg = (avg * 10).roundToDouble() / 10;
                      }
                      return DataRow(cells: [
                        DataCell(Text(s['name'] as String,
                            style:
                                const TextStyle(fontWeight: FontWeight.w500))),
                        DataCell(Text(oral?.toString() ?? '—')),
                        DataCell(Text(quiz15?.toString() ?? '—')),
                        DataCell(Text(midterm?.toString() ?? '—')),
                        DataCell(Text(finalE?.toString() ?? '—')),
                        DataCell(Text(avg?.toString() ?? '—',
                            style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: _classifyColor(avg)))),
                        DataCell(Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                              color: _classifyColor(avg).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8)),
                          child: Text(_classifyLabel(avg),
                              style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: _classifyColor(avg))),
                        )),
                      ]);
                    }).toList(),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _TeacherGrades extends StatefulWidget {
  const _TeacherGrades();
  @override
  State<_TeacherGrades> createState() => _TeacherGradesState();
}

class _TeacherGradesState extends State<_TeacherGrades> {
  String? _selectedClass;
  String? _selectedSubject;
  bool _isSaving = false;

  final _classes = ['10A1', '10A2', '10A3', '11A1', '11A2', '11A3'];
  final _subjects = [
    'Toán',
    'Ngữ văn',
    'Tiếng Anh',
    'Vật lý',
    'Hóa học',
    'Sinh học',
    'Lịch sử',
    'Địa lý'
  ];

  late List<Map<String, dynamic>> _students;

  @override
  void initState() {
    super.initState();
    _students = _buildDemoStudents();
  }

  List<Map<String, dynamic>> _buildDemoStudents() => [
        {'id': '1', 'name': 'Trần Văn An', 'code': 'HS001', 'oral': 8.0, 'quiz15': 7.5, 'midterm': 8.0, 'final': 7.0},
        {'id': '2', 'name': 'Lê Thị Bình', 'code': 'HS002', 'oral': 7.0, 'quiz15': 6.5, 'midterm': 7.0, 'final': 6.5},
        {'id': '3', 'name': 'Phạm Minh Châu', 'code': 'HS003', 'oral': 9.0, 'quiz15': 8.5, 'midterm': 8.0, 'final': 8.5},
        {'id': '4', 'name': 'Hoàng Đức Dũng', 'code': 'HS004', 'oral': 6.0, 'quiz15': 5.5, 'midterm': 6.0, 'final': 5.0},
        {'id': '5', 'name': 'Ngô Thùy Em', 'code': 'HS005', 'oral': 7.5, 'quiz15': 7.0, 'midterm': 7.5, 'final': 7.0},
      ];

  Future<void> _saveScores() async {
    setState(() => _isSaving = true);
    final api = ApiClient();
    try {
      final scores = _students.map((s) => {
        'studentId': s['id'],
        'subjectName': _selectedSubject,
        'className': _selectedClass,
        'oral': s['oral'],
        'quiz15': s['quiz15'],
        'midterm': s['midterm'],
        'final': s['final'],
      }).toList();
      await api.post('${ApiConstants.grades}/scores/batch', data: {'scores': scores});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã lưu điểm thành công')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lưu điểm thất bại')),
        );
      }
    }
    setState(() => _isSaving = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final hasSelection = _selectedClass != null && _selectedSubject != null;

    return Scaffold(
      appBar: AppBar(title: const Text('Bảng điểm')),
      body: Consumer<GradesProvider>(
        builder: (context, provider, _) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [

              Row(children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _selectedClass,
                    decoration: const InputDecoration(
                      labelText: 'Lớp',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: _classes
                        .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                        .toList(),
                    onChanged: (v) => setState(() => _selectedClass = v),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _selectedSubject,
                    decoration: const InputDecoration(
                      labelText: 'Môn học',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: _subjects
                        .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                        .toList(),
                    onChanged: (v) => setState(() => _selectedSubject = v),
                  ),
                ),
              ]),
              const SizedBox(height: 16),

              if (!hasSelection)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(children: [
                      Icon(Icons.grading_outlined,
                          size: 48, color: colorScheme.onSurfaceVariant),
                      const SizedBox(height: 12),
                      Text('Chọn lớp và môn học',
                          style: TextStyle(
                              color: colorScheme.onSurfaceVariant,
                              fontSize: 15)),
                      const SizedBox(height: 4),
                      Text('để xem và nhập bảng điểm',
                          style: TextStyle(
                              color: colorScheme.onSurfaceVariant,
                              fontSize: 13)),
                    ]),
                  ),
                )
              else ...[

                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('$_selectedClass — $_selectedSubject',
                              style: theme.textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w600)),
                          Text('${_students.length} HS',
                              style: TextStyle(
                                  color: colorScheme.onSurfaceVariant)),
                        ]),
                  ),
                ),
                const SizedBox(height: 8),

                Card(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      headingRowColor: WidgetStatePropertyAll(
                          colorScheme.primaryContainer.withOpacity(0.3)),
                      columnSpacing: 12,
                      columns: const [
                        DataColumn(
                            label: Text('Họ tên',
                                style: TextStyle(fontWeight: FontWeight.w600))),
                        DataColumn(
                            label: Text('Miệng',
                                style: TextStyle(fontWeight: FontWeight.w600)),
                            numeric: true),
                        DataColumn(
                            label: Text('15p',
                                style: TextStyle(fontWeight: FontWeight.w600)),
                            numeric: true),
                        DataColumn(
                            label: Text('1 tiết',
                                style: TextStyle(fontWeight: FontWeight.w600)),
                            numeric: true),
                        DataColumn(
                            label: Text('HK',
                                style: TextStyle(fontWeight: FontWeight.w600)),
                            numeric: true),
                        DataColumn(
                            label: Text('TB',
                                style: TextStyle(fontWeight: FontWeight.w600)),
                            numeric: true),
                      ],
                      rows: List.generate(_students.length, (idx) {
                        final s = _students[idx];
                        final oral = s['oral'] as double?;
                        final quiz15 = s['quiz15'] as double?;
                        final midterm = s['midterm'] as double?;
                        final finalE = s['final'] as double?;
                        double? avg;
                        if (oral != null &&
                            quiz15 != null &&
                            midterm != null &&
                            finalE != null) {
                          avg = (oral + quiz15 + midterm * 2 + finalE * 3) / 7;
                          avg = (avg * 10).roundToDouble() / 10;
                        }
                        return DataRow(cells: [
                          DataCell(Text(s['name'] as String,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w500))),
                          DataCell(_EditableScoreField(
                            value: oral,
                            onChanged: (v) => setState(() => _students[idx]['oral'] = v),
                          )),
                          DataCell(_EditableScoreField(
                            value: quiz15,
                            onChanged: (v) => setState(() => _students[idx]['quiz15'] = v),
                          )),
                          DataCell(_EditableScoreField(
                            value: midterm,
                            onChanged: (v) => setState(() => _students[idx]['midterm'] = v),
                          )),
                          DataCell(_EditableScoreField(
                            value: finalE,
                            onChanged: (v) => setState(() => _students[idx]['final'] = v),
                          )),
                          DataCell(Text(avg?.toString() ?? '—',
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600))),
                        ]);
                      }),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _isSaving ? null : _saveScores,
                    icon: _isSaving
                        ? const SizedBox(
                            width: 18, height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.save_outlined),
                    label: Text(_isSaving ? 'Đang lưu...' : 'Lưu điểm'),
                  ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _EditableScoreField extends StatelessWidget {
  final double? value;
  final ValueChanged<double?> onChanged;
  const _EditableScoreField({this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 48,
      child: TextField(
        controller: TextEditingController(text: value?.toString() ?? ''),
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        textAlign: TextAlign.center,
        style: const TextStyle(fontSize: 13),
        decoration: const InputDecoration(
          isDense: true,
          contentPadding: EdgeInsets.symmetric(horizontal: 4, vertical: 6),
          border: UnderlineInputBorder(),
        ),
        onSubmitted: (v) {
          final parsed = double.tryParse(v);
          onChanged(parsed);
        },
      ),
    );
  }
}
