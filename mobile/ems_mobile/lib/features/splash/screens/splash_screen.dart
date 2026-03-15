import 'package:flutter/material.dart';

class SplashScreen extends StatefulWidget {
  final VoidCallback onComplete;
  const SplashScreen({super.key, required this.onComplete});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeIn;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _fadeIn = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
          parent: _controller,
          curve: const Interval(0, 0.6, curve: Curves.easeOut)),
    );

    _scale = Tween<double>(begin: 0.8, end: 1).animate(
      CurvedAnimation(
          parent: _controller,
          curve: const Interval(0, 0.6, curve: Curves.easeOutBack)),
    );

    _controller.forward();

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) widget.onComplete();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: Center(
        child: FadeTransition(
          opacity: _fadeIn,
          child: ScaleTransition(
            scale: _scale,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [

                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(
                    Icons.school_outlined,
                    size: 40,
                    color: colorScheme.onPrimaryContainer,
                  ),
                ),
                const SizedBox(height: 20),

                Text(
                  'ReilferEDUV',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Education Management System',
                  style: TextStyle(
                    fontSize: 13,
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),

                const SizedBox(height: 32),
                SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: colorScheme.primary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
