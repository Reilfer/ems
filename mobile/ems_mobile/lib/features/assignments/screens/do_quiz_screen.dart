import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';

class DoQuizScreen extends StatefulWidget {
  final Map<String, dynamic> assignment;

  const DoQuizScreen({super.key, required this.assignment});

  @override
  State<DoQuizScreen> createState() => _DoQuizScreenState();
}

class _DoQuizScreenState extends State<DoQuizScreen> {
  final ApiClient _api = ApiClient();
  bool _isLoading = true;
  String? _error;

  Map<String, dynamic>? _quizDetail;
  List<dynamic> _questions = [];

  final Map<String, int> _answers = {};

  @override
  void initState() {
    super.initState();
    _loadQuiz();
  }

  Future<void> _loadQuiz() async {
    try {
      final res = await _api.get('${ApiConstants.homework}/${widget.assignment['id']}');
      final data = res.data is Map ? res.data : res.data['data'];

      setState(() {
        _quizDetail = data;
        _questions = data['questions'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Không thể tải đề thi';
        _isLoading = false;
      });
    }
  }

  Future<void> _submitQuiz() async {
    if (_answers.length < _questions.length) {
      final proceed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Chưa làm hết'),
          content: const Text('Bạn chưa chọn đáp án cho tất cả câu hỏi. Bạn có chắc chắn muốn nộp bài không?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Làm tiếp'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Nộp bài'),
            ),
          ],
        ),
      );
      if (proceed != true) return;
    }

    setState(() => _isLoading = true);
    try {
      final auth = context.read<AuthProvider>();
      final response = await _api.post('${ApiConstants.homework}/${widget.assignment['id']}/submit-quiz', data: {
        'studentId': auth.user?.id ?? '',
        'studentName': '${auth.user?.firstName ?? ''} ${auth.user?.lastName ?? ''}',
        'answers': _answers,
      });

      if (!mounted) return;
      setState(() => _isLoading = false);

      final responseData = response.data;
      final data = responseData is Map && responseData.containsKey('data') ? responseData['data'] : responseData;

      final score = data['score'] ?? 0;
      final maxScore = data['maxScore'] ?? 10;
      final feedback = data['feedback'] ?? '';

      await showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          icon: Icon(Icons.stars_rounded, color: Colors.orange.shade400, size: 48),
          title: const Text('Kết quả điểm', textAlign: TextAlign.center),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('$score / $maxScore', 
                style: Theme.of(ctx).textTheme.displayMedium?.copyWith(
                  color: Colors.green.shade700, 
                  fontWeight: FontWeight.bold
                )
              ),
              const SizedBox(height: 16),
              Text(feedback, textAlign: TextAlign.center, style: const TextStyle(fontSize: 14)),
            ],
          ),
          actions: [
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pop(context, true);
                },
                child: const Text('Hoàn tất'),
              ),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
         SnackBar(content: Text('Lỗi nộp bài: ${e.toString()}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_isLoading && _quizDetail == null) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.assignment['title'] ?? 'Làm bài')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.assignment['title'] ?? 'Làm bài')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
              const SizedBox(height: 16),
              Text(_error!),
              const SizedBox(height: 16),
              OutlinedButton(onPressed: _loadQuiz, child: const Text('Thử lại')),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.assignment['title'] ?? 'Trắc nghiệm'),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Đã làm: ${_answers.length}/${_questions.length}',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                Text(
                  'Thời gian: Không giới hạn',
                  style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _questions.length,
              itemBuilder: (ctx, idx) {
                final q = _questions[idx];
                final qId = q['id'] ?? 'q_$idx';
                final options = q['options'] as List<dynamic>? ?? [];

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    side: BorderSide(color: theme.colorScheme.outlineVariant),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Câu ${idx + 1}: ${q['content'] ?? q['question'] ?? ''}',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ...List.generate(options.length, (optIdx) {
                          final isSelected = _answers[qId] == optIdx;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: InkWell(
                              onTap: () {
                                setState(() {
                                  _answers[qId] = optIdx;
                                });
                              },
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                decoration: BoxDecoration(
                                  color: isSelected ? theme.colorScheme.primaryContainer.withOpacity(0.5) : null,
                                  border: Border.all(
                                    color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outlineVariant,
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 24,
                                      height: 24,
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: isSelected ? theme.colorScheme.primary : null,
                                        border: Border.all(
                                          color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outline,
                                        ),
                                      ),
                                      child: Text(
                                        String.fromCharCode(65 + optIdx),
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: isSelected ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(options[optIdx].toString()),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton(
            onPressed: _isLoading ? null : _submitQuiz,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.all(16),
            ),
            child: _isLoading 
                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('NỘP BÀI', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
        ),
      ),
    );
  }
}
