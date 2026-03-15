import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';

class AiChatScreen extends StatefulWidget {
  const AiChatScreen({super.key});

  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  final ApiClient _api = ApiClient();
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<Map<String, String>> _messages = [];
  bool _isLoading = false;

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _isLoading) return;

    _controller.clear();
    setState(() {
      _messages.add({'role': 'user', 'content': text});
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final response = await _api.post(
        ApiConstants.aiChat,
        data: {
          'message': text,
          'conversationHistory': _messages.sublist(0, _messages.length - 1),
        },
      );

      final data = response.data;
      final reply = data['reply'] ?? 'Không có phản hồi';

      setState(() {
        _messages.add({'role': 'assistant', 'content': reply});
      });
    } catch (e) {
      setState(() {
        _messages.add({
          'role': 'assistant',
          'content': 'Xin lỗi, không thể kết nối với AI. Vui lòng thử lại.',
        });
      });
    }

    setState(() => _isLoading = false);
    _scrollToBottom();
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Trợ lý'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Xóa hội thoại',
            onPressed: () => setState(() => _messages.clear()),
          ),
        ],
      ),
      body: Column(
        children: [

          Expanded(
            child: _messages.isEmpty
                ? _buildWelcome(colorScheme, theme)
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length + (_isLoading ? 1 : 0),
                    itemBuilder: (ctx, i) {
                      if (i == _messages.length) {
                        return _TypingIndicator();
                      }
                      return _MessageBubble(message: _messages[i]);
                    },
                  ),
          ),

          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 8, 16),
            decoration: BoxDecoration(
              color: colorScheme.surface,
              border: Border(
                top: BorderSide(
                    color: colorScheme.outlineVariant.withOpacity(0.3)),
              ),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      maxLines: 3,
                      minLines: 1,
                      decoration: InputDecoration(
                        hintText: 'Hỏi AI bất kỳ điều gì...',
                        filled: true,
                        fillColor: colorScheme.surfaceContainerHighest
                            .withOpacity(0.5),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _isLoading ? null : _sendMessage,
                    icon: const Icon(Icons.send_outlined),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWelcome(ColorScheme colorScheme, ThemeData theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.smart_toy_outlined,
              size: 64,
              color: colorScheme.primary.withOpacity(0.6),
            ),
            const SizedBox(height: 16),
            Text(
              'AI Trợ lý EMS',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Hỏi về học sinh, điểm số, lịch học,\n'
              'và mọi thông tin trong hệ thống.',
              textAlign: TextAlign.center,
              style: TextStyle(color: colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: [
                _SuggestionChip(
                  label: 'Có bao nhiêu học sinh?',
                  onTap: () {
                    _controller.text = 'Có bao nhiêu học sinh đang theo học?';
                    _sendMessage();
                  },
                ),
                _SuggestionChip(
                  label: 'Tỷ lệ điểm danh hôm nay',
                  onTap: () {
                    _controller.text = 'Cho tôi biết tỷ lệ điểm danh hôm nay?';
                    _sendMessage();
                  },
                ),
                _SuggestionChip(
                  label: 'Thống kê điểm môn Toán',
                  onTap: () {
                    _controller.text = 'Cho tôi xem thống kê điểm môn Toán';
                    _sendMessage();
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SuggestionChip extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _SuggestionChip({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      label: Text(label, style: const TextStyle(fontSize: 12)),
      onPressed: onTap,
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final Map<String, String> message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message['role'] == 'user';
    final colorScheme = Theme.of(context).colorScheme;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78,
        ),
        decoration: BoxDecoration(
          color: isUser
              ? colorScheme.primary
              : colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isUser ? 16 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 16),
          ),
        ),
        child: Text(
          message['content'] ?? '',
          style: TextStyle(
            color: isUser ? colorScheme.onPrimary : colorScheme.onSurface,
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}

class _TypingIndicator extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: colorScheme.primary,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Đang suy nghĩ...',
              style: TextStyle(
                fontSize: 13,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
