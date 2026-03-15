import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../notifications/providers/notifications_provider.dart';
import 'do_quiz_screen.dart';

class AssignmentsScreen extends StatelessWidget {
  const AssignmentsScreen({super.key});

  static bool _isAdmin(String? role) =>
      role == 'SCHOOL_ADMIN' || role == 'SUPER_ADMIN' || role == 'admin';
  static bool _isTeacher(String? role) => role == 'TEACHER';

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final role = auth.user?.role;

    if (_isAdmin(role) || _isTeacher(role)) {
      return const _TeacherAssignments();
    }
    return const _StudentAssignments();
  }
}

class _TeacherAssignments extends StatefulWidget {
  const _TeacherAssignments();
  @override
  State<_TeacherAssignments> createState() => _TeacherAssignmentsState();
}

class _TeacherAssignmentsState extends State<_TeacherAssignments> {
  final ApiClient _api = ApiClient();
  List<Map<String, dynamic>> _assignments = [];
  bool _isLoading = true;
  String? _error;
  String _filterClass = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final params = <String, String>{};
      if (_filterClass != 'all') params['className'] = _filterClass;
      final response =
          await _api.get(ApiConstants.assignments, queryParameters: params);
      final data = response.data;
      if (data is Map && data['data'] is List) {
        _assignments = List<Map<String, dynamic>>.from(data['data']);
      } else if (data is List) {
        _assignments = List<Map<String, dynamic>>.from(data);
      }
    } catch (e) {
      _error = 'Không thể tải bài tập';
    }
    setState(() => _isLoading = false);
  }

  void _showCreateSheet(BuildContext context) {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final maxScoreCtrl = TextEditingController(text: '10');
    final answerKeyCtrl = TextEditingController();
    String type = 'homework';
    final selectedClasses = <String>{};
    String subject = '';
    DateTime? dueDate;
    bool useAiGrading = false;

    final questions = <Map<String, dynamic>>[
      {'question': '', 'options': ['', '', '', ''], 'correctAnswer': 0},
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          final theme = Theme.of(ctx);
          return DraggableScrollableSheet(
            initialChildSize: 0.9,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            expand: false,
            builder: (_, scrollCtrl) => SingleChildScrollView(
              controller: scrollCtrl,
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 32, height: 4,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.onSurfaceVariant.withOpacity(0.4),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text('Giao bài tập mới', style: theme.textTheme.headlineSmall),
                  const SizedBox(height: 20),
                  TextField(
                    controller: titleCtrl,
                    decoration: const InputDecoration(labelText: 'Tiêu đề bài tập', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 16),
                  Text('Loại bài tập', style: theme.textTheme.labelLarge),
                  const SizedBox(height: 8),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'homework', label: Text('Bài tập')),
                      ButtonSegment(value: 'quiz', label: Text('Trắc nghiệm')),
                      ButtonSegment(value: 'project', label: Text('Dự án')),
                    ],
                    selected: {type},
                    onSelectionChanged: (v) => setSheetState(() => type = v.first),
                  ),
                  const SizedBox(height: 16),
                  Text('Lớp', style: theme.textTheme.labelLarge),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      {'id': 'cls-001', 'name': '10A1'},
                      {'id': 'cls-002', 'name': '10A2'},
                      {'id': 'cls-004', 'name': '11A1'},
                    ].map((cls) {
                      return FilterChip(
                        label: Text(cls['name']!),
                        selected: selectedClasses.contains(cls['id']),
                        onSelected: (v) => setSheetState(() {
                          v ? selectedClasses.add(cls['id']!) : selectedClasses.remove(cls['id']);
                        }),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: subject.isEmpty ? null : subject,
                    decoration: const InputDecoration(labelText: 'Môn học', border: OutlineInputBorder()),
                    items: [
                      {'id': 'sub-math01', 'name': 'Toán'},
                      {'id': 'sub-lit01', 'name': 'Ngữ văn'},
                      {'id': 'sub-eng01', 'name': 'Tiếng Anh'},
                      {'id': 'sub-phy01', 'name': 'Vật lý'},
                    ]
                        .map((s) => DropdownMenuItem(value: s['id'], child: Text(s['name']!)))
                        .toList(),
                    onChanged: (v) => setSheetState(() => subject = v ?? ''),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: maxScoreCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Điểm tối đa', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 16),
                  ListTile(
                    title: Text(dueDate == null ? 'Chọn hạn nộp' : 'Hạn: ${dueDate!.day}/${dueDate!.month}/${dueDate!.year}'),
                    trailing: const Icon(Icons.calendar_today_outlined),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: theme.colorScheme.outline)),
                    onTap: () async {
                      final picked = await showDatePicker(context: ctx, initialDate: DateTime.now().add(const Duration(days: 7)), firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
                      if (picked != null) setSheetState(() => dueDate = picked);
                    },
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: descCtrl,
                    maxLines: 4,
                    decoration: const InputDecoration(labelText: 'Mô tả / Hướng dẫn', border: OutlineInputBorder(), alignLabelWithHint: true),
                  ),

                  if (type == 'quiz') ...[
                    const SizedBox(height: 20),
                    const Divider(),
                    Text('Câu hỏi trắc nghiệm', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 12),
                    ...List.generate(questions.length, (qi) {
                      final q = questions[qi];
                      final opts = q['options'] as List;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Câu ${qi + 1}', style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold)),
                                  if (questions.length > 1)
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, size: 20),
                                      color: theme.colorScheme.error,
                                      onPressed: () => setSheetState(() => questions.removeAt(qi)),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              TextField(
                                decoration: const InputDecoration(
                                  hintText: 'Nội dung câu hỏi',
                                  border: OutlineInputBorder(),
                                  isDense: true,
                                ),
                                onChanged: (v) => q['question'] = v,
                                controller: TextEditingController(text: q['question'] as String),
                              ),
                              const SizedBox(height: 12),
                              ...List.generate(4, (oi) {
                                final letter = String.fromCharCode(65 + oi); 
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Row(
                                    children: [
                                      Radio<int>(
                                        value: oi,
                                        groupValue: q['correctAnswer'] as int,
                                        onChanged: (v) => setSheetState(() => q['correctAnswer'] = v),
                                      ),
                                      Expanded(
                                        child: TextField(
                                          decoration: InputDecoration(
                                            hintText: 'Đáp án $letter',
                                            border: const OutlineInputBorder(),
                                            isDense: true,
                                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                          ),
                                          onChanged: (v) => opts[oi] = v,
                                          controller: TextEditingController(text: opts[oi] as String),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                      );
                    }),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.add),
                        label: const Text('Thêm câu hỏi'),
                        onPressed: () => setSheetState(() {
                          questions.add({'question': '', 'options': ['', '', '', ''], 'correctAnswer': 0});
                        }),
                      ),
                    ),
                  ],

                  if (type == 'project') ...[
                    const SizedBox(height: 20),
                    const Divider(),
                    Text('Đáp án mẫu & chấm điểm', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 12),
                    TextField(
                      controller: answerKeyCtrl,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        labelText: 'Đáp án / Ý chính',
                        hintText: 'Nhập đáp án mẫu hoặc các ý chính cần có...',
                        border: OutlineInputBorder(),
                        alignLabelWithHint: true,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SwitchListTile(
                      title: const Text('AI chấm tự động'),
                      subtitle: const Text('So sánh bài làm với đáp án mẫu'),
                      value: useAiGrading,
                      onChanged: (v) => setSheetState(() => useAiGrading = v),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: theme.colorScheme.outline),
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () async {
                        if (titleCtrl.text.isEmpty || selectedClasses.isEmpty) {
                          ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Nhập tiêu đề và chọn ít nhất 1 lớp')));
                          return;
                        }
                        try {
                          final auth = ctx.read<AuthProvider>();
                          for (final cls in selectedClasses) {
                            final data = <String, dynamic>{
                              'schoolId': auth.user?.schoolId ?? 'sch-001', 
                              'classId': cls, 
                              'subjectId': subject,
                              'teacherId': auth.user?.id ?? '',
                              'title': titleCtrl.text, 
                              'description': descCtrl.text,
                              'type': type == 'project' ? 'essay' : type, 
                              'dueDate': dueDate?.toIso8601String() ?? DateTime.now().add(const Duration(days: 7)).toIso8601String(),
                              'maxScore': int.tryParse(maxScoreCtrl.text) ?? 10,
                            };
                            if (type == 'quiz') {
                              data['questions'] = questions.map((q) => <String, dynamic>{
                                'content': q['question'],
                                'options': q['options'],
                                'correctIndex': q['correctAnswer'],
                                'points': 2,
                              }).toList();
                            }
                            if (type == 'project') {
                              data['answerKey'] = answerKeyCtrl.text;
                              data['gradingMode'] = useAiGrading ? 'ai' : 'manual';
                            }
                            await _api.post(ApiConstants.assignments, data: data);
                          }
                          if (ctx.mounted) Navigator.pop(ctx);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Đã giao bài tập cho ${selectedClasses.length} lớp')));
                            _load();
                          }
                        } catch (_) {
                          if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Không thể tạo bài tập')));
                        }
                      },
                      child: const Text('Giao bài tập'),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final quizCount = _assignments.where((a) => (a['type'] ?? '').toString().toLowerCase() == 'quiz').length;
    final essayCount = _assignments.length - quizCount;

    return Scaffold(
      appBar: AppBar(title: const Text('Bài tập')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreateSheet(context),
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [

          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Row(children: [
              _MiniStat(
                  label: 'Tổng',
                  value: '${_assignments.length}',
                  color: colorScheme.primary),
              const SizedBox(width: 8),
              _MiniStat(
                  label: 'Trắc nghiệm',
                  value: '$quizCount',
                  color: Colors.green.shade700),
              const SizedBox(width: 8),
              _MiniStat(
                  label: 'Tự luận',
                  value: '$essayCount',
                  color: const Color(0xFF7B1FA2)),
            ]),
          ),

          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(children: [
              FilterChip(
                  label: const Text('Tất cả lớp'),
                  selected: _filterClass == 'all',
                  onSelected: (_) {
                    _filterClass = 'all';
                    _load();
                  }),
              const SizedBox(width: 8),
              for (final cls in ['10A1', '10A2', '11A1']) ...[
                FilterChip(
                    label: Text(cls),
                    selected: _filterClass == cls,
                    onSelected: (_) {
                      _filterClass = cls;
                      _load();
                    }),
                const SizedBox(width: 8),
              ],
            ]),
          ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? _ErrorView(message: _error!, onRetry: _load)
                    : _assignments.isEmpty
                        ? _EmptyView(
                            icon: Icons.assignment_outlined,
                            message: 'Chưa có bài tập nào',
                            subtitle: 'Bài tập sẽ hiện khi tạo trên web')
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.builder(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _assignments.length,
                              itemBuilder: (ctx, i) => _TeacherAssignmentCard(
                                  assignment: _assignments[i],
                                  onRefresh: _load),
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

class _StudentAssignments extends StatefulWidget {
  const _StudentAssignments();
  @override
  State<_StudentAssignments> createState() => _StudentAssignmentsState();
}

class _StudentAssignmentsState extends State<_StudentAssignments> {
  final ApiClient _api = ApiClient();
  List<Map<String, dynamic>> _assignments = [];
  bool _isLoading = true;
  String? _error;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final params = <String, String>{};
      if (_filter != 'all') params['status'] = _filter;
      final response =
          await _api.get(ApiConstants.assignments, queryParameters: params);
      final data = response.data;
      if (data is Map && data['data'] is List) {
        _assignments = List<Map<String, dynamic>>.from(data['data']);
      } else if (data is List) {
        _assignments = List<Map<String, dynamic>>.from(data);
      }
    } catch (e) {
      _error = 'Không thể tải bài tập';
    }
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Bài tập của tôi'),
          Text('${_assignments.length} bài tập',
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: colorScheme.onSurfaceVariant)),
        ]),
      ),
      body: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(children: [
              FilterChip(
                  label: const Text('Tất cả'),
                  selected: _filter == 'all',
                  onSelected: (_) {
                    _filter = 'all';
                    _load();
                  }),
              const SizedBox(width: 8),
              FilterChip(
                  label: const Text('Chưa nộp'),
                  selected: _filter == 'active',
                  onSelected: (_) {
                    _filter = 'active';
                    _load();
                  }),
              const SizedBox(width: 8),
              FilterChip(
                  label: const Text('Đã nộp'),
                  selected: _filter == 'submitted',
                  onSelected: (_) {
                    _filter = 'submitted';
                    _load();
                  }),
              const SizedBox(width: 8),
              FilterChip(
                  label: const Text('Đã chấm'),
                  selected: _filter == 'graded',
                  onSelected: (_) {
                    _filter = 'graded';
                    _load();
                  }),
            ]),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? _ErrorView(message: _error!, onRetry: _load)
                    : _assignments.isEmpty
                        ? _EmptyView(
                            icon: Icons.assignment_outlined,
                            message: 'Chưa có bài tập',
                            subtitle: 'Giáo viên chưa giao bài tập')
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.builder(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _assignments.length,
                              itemBuilder: (ctx, i) => _StudentAssignmentCard(
                                  assignment: _assignments[i],
                                  onRefresh: _load),
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

class _TeacherAssignmentCard extends StatelessWidget {
  final Map<String, dynamic> assignment;
  final VoidCallback? onRefresh;
  const _TeacherAssignmentCard({required this.assignment, this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final title = assignment['title'] ?? '';
    final type = assignment['type'] ?? 'quiz';
    final subject = assignment['subjectName'] ?? assignment['subject'] ?? '';
    final className = assignment['className'] ?? '';
    final dueDate = assignment['dueDate'] ?? '';
    final submissionCount =
        assignment['totalSubmissions'] ?? assignment['submissionCount'] ?? 0;
    final gradedCount = assignment['gradedCount'] ?? 0;

    final isQuiz = type.toString().toLowerCase() == 'quiz';
    final typeColor = isQuiz ? Colors.green.shade700 : const Color(0xFF7B1FA2);
    final typeBg = isQuiz ? const Color(0xFFE6F4EA) : const Color(0xFFF3E8FD);

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _showSubmissionsSheet(context),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                  color: typeBg, borderRadius: BorderRadius.circular(12)),
              child: Icon(isQuiz ? Icons.quiz_outlined : Icons.edit_note_outlined,
                  color: typeColor, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child:
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w500, fontSize: 15)),
                const SizedBox(height: 4),
                Wrap(spacing: 6, children: [
                  _Tag(
                      label: isQuiz ? 'Trắc nghiệm' : 'Tự luận',
                      color: typeColor),
                  if (subject.isNotEmpty)
                    _Tag(label: subject, color: colorScheme.primary),
                  if (className.isNotEmpty)
                    _Tag(label: className, color: Colors.blue.shade700),
                ]),
              ]),
            ),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              if (dueDate.isNotEmpty)
                Text('Hạn: $dueDate',
                    style: TextStyle(
                        fontSize: 11, color: colorScheme.onSurfaceVariant)),
              const SizedBox(height: 4),
              Text('$submissionCount nộp · $gradedCount chấm',
                  style: TextStyle(
                      fontSize: 11, color: colorScheme.onSurfaceVariant)),
            ]),
            const SizedBox(width: 8),
            IconButton(
              icon: Icon(Icons.delete_outline, color: colorScheme.error, size: 20),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Xóa bài tập'),
                    content: const Text('Xóa bài tập này và mọi bài nộp?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Hủy')),
                      TextButton(
                        onPressed: () async {
                          Navigator.pop(ctx);
                          try {
                            await ApiClient().delete('${ApiConstants.homework}/${assignment['id']}');
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã xóa bài tập')));
                              onRefresh?.call();
                            }
                          } catch (_) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lỗi xóa bài tập')));
                            }
                          }
                        },
                        child: Text('Xóa', style: TextStyle(color: colorScheme.error)),
                      ),
                    ],
                  ),
                );
              },
            ),
          ]),
        ),
      ),
    );
  }

  void _showSubmissionsSheet(BuildContext context) {
    final api = ApiClient();
    final assignmentId = assignment['id'] ?? '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          maxChildSize: 0.95,
          expand: false,
          builder: (_, scrollController) {
            return FutureBuilder<List<dynamic>>(
              future: api.get('${ApiConstants.homework}/$assignmentId/submissions')
                  .then((r) => r.data is List ? r.data : (r.data['data'] ?? [])),
              builder: (ctx2, snap) {
                final theme = Theme.of(ctx2);
                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text('Bài nộp: ${assignment['title']}',
                          style: theme.textTheme.titleMedium),
                    ),
                    const Divider(height: 1),
                    if (snap.connectionState == ConnectionState.waiting)
                      const Expanded(child: Center(child: CircularProgressIndicator()))
                    else if (!snap.hasData || snap.data!.isEmpty)
                      const Expanded(child: Center(child: Text('Chưa có bài nộp nào')))
                    else
                      Expanded(
                        child: ListView.builder(
                          controller: scrollController,
                          itemCount: snap.data!.length,
                          itemBuilder: (_, i) {
                            final sub = snap.data![i] as Map<String, dynamic>;
                            return _SubmissionTile(
                              submission: sub,
                              assignmentId: assignmentId.toString(),
                              onGraded: () {
                                onRefresh?.call();
                                Navigator.pop(ctx);
                              },
                            );
                          },
                        ),
                      ),
                  ],
                );
              },
            );
          },
        );
      },
    );
  }
}

class _SubmissionTile extends StatelessWidget {
  final Map<String, dynamic> submission;
  final String assignmentId;
  final VoidCallback? onGraded;
  const _SubmissionTile({required this.submission, required this.assignmentId, this.onGraded});

  @override
  Widget build(BuildContext context) {
    final name = submission['studentName'] ?? 'Học sinh';
    final status = submission['status'] ?? 'submitted';
    final score = submission['score'];
    final content = submission['content'] ?? '';
    final colorScheme = Theme.of(context).colorScheme;

    return ListTile(
      leading: CircleAvatar(
        backgroundColor: colorScheme.primaryContainer,
        child: Text(name.isNotEmpty ? name[0] : '?',
            style: TextStyle(color: colorScheme.onPrimaryContainer)),
      ),
      title: Text(name),
      subtitle: Text(content.length > 60 ? '${content.substring(0, 60)}...' : content,
          maxLines: 1, overflow: TextOverflow.ellipsis),
      trailing: status == 'graded'
          ? Chip(label: Text('$score đ'), backgroundColor: const Color(0xFFE6F4EA))
          : FilledButton.tonal(
              onPressed: () => _showGradeDialog(context),
              child: const Text('Chấm'),
            ),
    );
  }

  void _showGradeDialog(BuildContext context) {
    final scoreCtrl = TextEditingController();
    final feedbackCtrl = TextEditingController();
    final api = ApiClient();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Chấm điểm'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: scoreCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Điểm',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: feedbackCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Nhận xét',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Huỷ')),
          FilledButton(
            onPressed: () async {
              final sc = double.tryParse(scoreCtrl.text);
              if (sc == null) return;
              try {
                await api.patch('${ApiConstants.homework}/submissions/${submission['id']}/grade', data: {
                  'score': sc,
                  'feedback': feedbackCtrl.text,
                });
                if (ctx.mounted) Navigator.pop(ctx);
                onGraded?.call();
              } catch (_) {
                if (ctx.mounted) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(content: Text('Chấm điểm thất bại')),
                  );
                }
              }
            },
            child: const Text('Lưu điểm'),
          ),
        ],
      ),
    );
  }
}

class _StudentAssignmentCard extends StatelessWidget {
  final Map<String, dynamic> assignment;
  final VoidCallback? onRefresh;
  const _StudentAssignmentCard({required this.assignment, this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final title = assignment['title'] ?? '';
    final type = assignment['type'] ?? 'quiz';
    final subject = assignment['subjectName'] ?? assignment['subject'] ?? '';
    final dueDate = assignment['dueDate'] ?? '';
    final status = assignment['status'] ?? '';

    final isQuiz = type.toString().toLowerCase() == 'quiz';
    final typeColor = isQuiz ? Colors.green.shade700 : const Color(0xFF7B1FA2);
    final typeBg = isQuiz ? const Color(0xFFE6F4EA) : const Color(0xFFF3E8FD);

    Widget statusWidget;
    if (status == 'graded') {
      statusWidget = _Tag(
          label:
              '${assignment['score'] ?? '?'}/${assignment['maxScore'] ?? 10}',
          color: Colors.green.shade700);
    } else if (status == 'submitted') {
      statusWidget =
          _Tag(label: 'Đã nộp — chờ chấm', color: Colors.blue.shade700);
    } else {
      statusWidget = _Tag(label: 'Chưa nộp', color: Colors.orange.shade700);
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () async {
          if (status != 'graded' && status != 'submitted') {
            if (isQuiz) {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => DoQuizScreen(assignment: assignment),
                ),
              );
              if (result == true) {
                onRefresh?.call();
              }
            } else {
              _showSubmitSheet(context);
            }
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                  color: typeBg, borderRadius: BorderRadius.circular(12)),
              child: Icon(isQuiz ? Icons.quiz_outlined : Icons.edit_note_outlined,
                  color: typeColor, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child:
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w500, fontSize: 15)),
                const SizedBox(height: 4),
                Wrap(spacing: 6, children: [
                  _Tag(
                      label: isQuiz ? 'Trắc nghiệm' : 'Tự luận',
                      color: typeColor),
                  if (subject.isNotEmpty)
                    _Tag(label: subject, color: colorScheme.primary),
                ]),
                if (dueDate.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text('Hạn: $dueDate',
                      style: TextStyle(
                          fontSize: 11, color: colorScheme.onSurfaceVariant)),
                ],
              ]),
            ),
            statusWidget,
          ]),
        ),
      ),
    );
  }

  void _showSubmitSheet(BuildContext context) {
    final contentCtrl = TextEditingController();
    final api = ApiClient();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) {
        final theme = Theme.of(ctx);
        final auth = ctx.read<AuthProvider>();
        return Padding(
          padding: EdgeInsets.only(
            left: 24, right: 24, top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Nộp bài: ${assignment['title']}', style: theme.textTheme.titleMedium),
              const SizedBox(height: 16),
              TextField(
                controller: contentCtrl,
                maxLines: 6,
                decoration: const InputDecoration(
                  labelText: 'Bài làm của bạn',
                  border: OutlineInputBorder(),
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () async {
                    if (contentCtrl.text.isEmpty) return;
                    try {
                      await api.post('${ApiConstants.homework}/${assignment['id']}/submit-essay', data: {
                        'studentId': auth.user?.id ?? '',
                        'studentName': '${auth.user?.firstName ?? ''} ${auth.user?.lastName ?? ''}',
                        'content': contentCtrl.text,
                      });
                      if (ctx.mounted) Navigator.pop(ctx);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Đã nộp bài thành công')),
                        );
                        onRefresh?.call();
                      }
                    } catch (_) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          const SnackBar(content: Text('Nộp bài thất bại')),
                        );
                      }
                    }
                  },
                  child: const Text('Nộp bài'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _Tag extends StatelessWidget {
  final String label;
  final Color color;
  const _Tag({required this.label, required this.color});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8)),
        child: Text(label,
            style: TextStyle(
                fontSize: 11, fontWeight: FontWeight.w500, color: color)),
      );
}

class _MiniStat extends StatelessWidget {
  final String label, value;
  final Color color;
  const _MiniStat(
      {required this.label, required this.value, required this.color});
  @override
  Widget build(BuildContext context) => Expanded(
        child: Card(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
            child: Column(children: [
              Text(value,
                  style: TextStyle(
                      fontSize: 20, fontWeight: FontWeight.w600, color: color)),
              Text(label,
                  style: TextStyle(
                      fontSize: 11,
                      color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ]),
          ),
        ),
      );
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorView({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) => Center(
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(Icons.error_outline,
            size: 48, color: Theme.of(context).colorScheme.error),
        const SizedBox(height: 8),
        Text(message),
        const SizedBox(height: 8),
        OutlinedButton(onPressed: onRetry, child: const Text('Thử lại')),
      ]));
}

class _EmptyView extends StatelessWidget {
  final IconData icon;
  final String message, subtitle;
  const _EmptyView(
      {required this.icon, required this.message, required this.subtitle});
  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Icon(icon, size: 64, color: colorScheme.onSurfaceVariant),
      const SizedBox(height: 12),
      Text(message, style: TextStyle(color: colorScheme.onSurfaceVariant)),
      const SizedBox(height: 4),
      Text(subtitle,
          style: TextStyle(fontSize: 12, color: colorScheme.onSurfaceVariant)),
    ]));
  }
}
