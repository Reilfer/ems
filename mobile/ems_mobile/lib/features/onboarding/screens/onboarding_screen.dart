import 'package:flutter/material.dart';

class OnboardingScreen extends StatefulWidget {
  final VoidCallback onComplete;
  const OnboardingScreen({super.key, required this.onComplete});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  static const _titles = [
    'Quản lý giáo dục thông minh',
    'Điểm danh bằng QR',
    'AI Trợ lý 24/7',
  ];

  static const _descriptions = [
    'Theo dõi học sinh, điểm số, lịch học và tất cả mọi thứ trong một ứng dụng duy nhất.',
    'Quét mã QR để điểm danh nhanh chóng, chính xác với công nghệ chống gian lận.',
    'Hỏi đáp thông tin học sinh, điểm số, lịch học bất cứ lúc nào với AI thông minh.',
  ];

  static const _icons = [
    Icons.school_outlined,
    Icons.qr_code_scanner_outlined,
    Icons.smart_toy_outlined,
  ];

  static const _colors = [
    Colors.blue,
    Colors.orange,
    Colors.purple,
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _next() {
    if (_currentPage < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      widget.onComplete();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [

              Align(
                alignment: Alignment.topRight,
                child: TextButton(
                  onPressed: widget.onComplete,
                  child: const Text('Bỏ qua'),
                ),
              ),

              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: 3,
                  onPageChanged: (i) => setState(() => _currentPage = i),
                  itemBuilder: (ctx, i) {
                    return Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: _colors[i].withOpacity(0.1),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Icon(_icons[i], size: 56, color: _colors[i]),
                        ),
                        const SizedBox(height: 32),
                        Text(
                          _titles[i],
                          textAlign: TextAlign.center,
                          style: theme.textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _descriptions[i],
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 15,
                            color: colorScheme.onSurfaceVariant,
                            height: 1.5,
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),

              Row(
                children: [

                  for (int i = 0; i < 3; i++) ...[
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      width: i == _currentPage ? 24 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: i == _currentPage
                            ? colorScheme.primary
                            : colorScheme.primary.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    if (i < 2) const SizedBox(width: 8),
                  ],
                  const Spacer(),

                  SizedBox(
                    width: 100,
                    child: FilledButton(
                      onPressed: _next,
                      child: Text(_currentPage < 2 ? 'Tiếp' : 'Bắt đầu'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
