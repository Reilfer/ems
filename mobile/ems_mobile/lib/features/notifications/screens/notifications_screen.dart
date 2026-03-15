import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/notifications_provider.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationsProvider>().loadNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông báo'),
        actions: [
          Consumer<NotificationsProvider>(
            builder: (context, provider, _) {
              if (provider.unread == 0) return const SizedBox.shrink();
              return TextButton.icon(
                onPressed: () => provider.markAllRead(),
                icon: const Icon(Icons.done_all, size: 18),
                label: const Text('Đọc tất cả'),
              );
            },
          ),
        ],
      ),
      body: Consumer<NotificationsProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 48, color: colorScheme.error),
                  const SizedBox(height: 12),
                  Text(provider.error!),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () => provider.refresh(),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          if (provider.notifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_none_outlined, size: 64,
                    color: colorScheme.onSurfaceVariant.withOpacity(0.5)),
                  const SizedBox(height: 12),
                  Text('Chưa có thông báo',
                    style: TextStyle(color: colorScheme.onSurfaceVariant)),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.refresh(),
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: provider.notifications.length,
              separatorBuilder: (_, __) => const Divider(height: 1, indent: 72),
              itemBuilder: (context, index) {
                final notif = provider.notifications[index];
                return _NotificationTile(
                  notification: notif,
                  onTap: () => provider.markRead(notif['id'] ?? ''),
                  onDelete: () async {
                    final ok = await provider.deleteNotification(notif['id'] ?? '');
                    if (ok && context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Đã xóa thông báo')),
                      );
                    }
                  },
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: Builder(
        builder: (context) {
          final auth = context.watch<AuthProvider>();
          final role = auth.user?.role;
          final canCompose = role == 'SCHOOL_ADMIN' ||
              role == 'SUPER_ADMIN' ||
              role == 'admin' ||
              role == 'TEACHER';
          if (!canCompose) return const SizedBox.shrink();
          return FloatingActionButton(
            onPressed: () => _showComposeSheet(context),
            child: const Icon(Icons.edit_outlined),
          );
        },
      ),
    );
  }

  void _showComposeSheet(BuildContext context) {
    final titleCtrl = TextEditingController();
    final contentCtrl = TextEditingController();
    String sendMode = 'broadcast';
    String targetRole = 'all';
    String type = 'INFO';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          final theme = Theme.of(ctx);
          return DraggableScrollableSheet(
            initialChildSize: 0.85,
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
                  Text('Soạn thông báo', style: theme.textTheme.headlineSmall),
                  const SizedBox(height: 20),

                  Text('Hình thức gửi', style: theme.textTheme.labelLarge),
                  const SizedBox(height: 8),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'broadcast', label: Text('Theo nhóm')),
                      ButtonSegment(value: 'direct', label: Text('Cá nhân')),
                    ],
                    selected: {sendMode},
                    onSelectionChanged: (v) => setSheetState(() => sendMode = v.first),
                  ),
                  const SizedBox(height: 16),

                  if (sendMode == 'broadcast') ...[                    Text('Đối tượng', style: theme.textTheme.labelLarge),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: [
                        _roleChip('Tất cả', 'all', targetRole, (v) => setSheetState(() => targetRole = v)),
                        _roleChip('Giáo viên', 'TEACHER', targetRole, (v) => setSheetState(() => targetRole = v)),
                        _roleChip('Học sinh', 'STUDENT', targetRole, (v) => setSheetState(() => targetRole = v)),
                        _roleChip('Phụ huynh', 'PARENT', targetRole, (v) => setSheetState(() => targetRole = v)),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],

                  Text('Loại', style: theme.textTheme.labelLarge),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      _roleChip('Thông báo', 'INFO', type, (v) => setSheetState(() => type = v)),
                      _roleChip('Cảnh báo', 'WARNING', type, (v) => setSheetState(() => type = v)),
                      _roleChip('Điểm', 'GRADE', type, (v) => setSheetState(() => type = v)),
                      _roleChip('Tài chính', 'FINANCE', type, (v) => setSheetState(() => type = v)),
                    ],
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: titleCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Tiêu đề',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: contentCtrl,
                    maxLines: 5,
                    decoration: const InputDecoration(
                      labelText: 'Nội dung',
                      border: OutlineInputBorder(),
                      alignLabelWithHint: true,
                    ),
                  ),
                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () async {
                        if (titleCtrl.text.isEmpty || contentCtrl.text.isEmpty) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            const SnackBar(content: Text('Vui lòng nhập tiêu đề và nội dung')),
                          );
                          return;
                        }
                        final provider = context.read<NotificationsProvider>();
                        bool ok;
                        if (sendMode == 'broadcast') {
                          ok = await provider.broadcast(
                            title: titleCtrl.text,
                            content: contentCtrl.text,
                            type: type,
                            targetRole: targetRole,
                          );
                        } else {
                          ok = await provider.sendNotification(
                            recipientId: '',
                            title: titleCtrl.text,
                            content: contentCtrl.text,
                            type: type,
                          );
                        }
                        if (ctx.mounted) Navigator.pop(ctx);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(ok ? 'Đã gửi thông báo' : 'Gửi thất bại')),
                          );
                          if (ok) provider.refresh();
                        }
                      },
                      child: const Text('Gửi thông báo'),
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

  Widget _roleChip(String label, String value, String current, ValueChanged<String> onTap) {
    return ChoiceChip(
      label: Text(label),
      selected: current == value,
      onSelected: (_) => onTap(value),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final Map<String, dynamic> notification;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _NotificationTile({
    required this.notification,
    required this.onTap,
    required this.onDelete,
  });

  IconData _getIcon(String type) {
    switch (type) {
      case 'attendance': return Icons.fact_check_outlined;
      case 'grade': return Icons.grading_outlined;
      case 'finance': return Icons.payment_outlined;
      case 'schedule': return Icons.calendar_today_outlined;
      case 'system': return Icons.settings_outlined;
      default: return Icons.notifications_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isRead = notification['isRead'] == true;
    final type = notification['type'] ?? '';
    final title = notification['title'] ?? 'Thông báo';
    final content = notification['content'] ?? '';
    final createdAt = notification['createdAt']?.toString() ?? '';

    String timeDisplay = '';
    if (createdAt.isNotEmpty) {
      try {
        final dt = DateTime.parse(createdAt);
        final diff = DateTime.now().difference(dt);
        if (diff.inMinutes < 60) {
          timeDisplay = '${diff.inMinutes} phút trước';
        } else if (diff.inHours < 24) {
          timeDisplay = '${diff.inHours} giờ trước';
        } else {
          timeDisplay = '${diff.inDays} ngày trước';
        }
      } catch (_) {}
    }

    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: isRead
              ? colorScheme.surfaceContainerHighest.withOpacity(0.5)
              : colorScheme.primaryContainer,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(
          _getIcon(type),
          size: 20,
          color: isRead
              ? colorScheme.onSurfaceVariant
              : colorScheme.onPrimaryContainer,
        ),
      ),
      title: Text(
        title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontWeight: isRead ? FontWeight.w400 : FontWeight.w600,
          fontSize: 14,
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (content.isNotEmpty)
            Text(
              content,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 13,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          if (timeDisplay.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                timeDisplay,
                style: TextStyle(
                  fontSize: 11,
                  color: colorScheme.onSurfaceVariant.withOpacity(0.7),
                ),
              ),
            ),
        ],
      ),
      trailing: !isRead
          ? Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: colorScheme.primary,
              ),
            )
          : null,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      onTap: onTap,
      onLongPress: () {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Xóa thông báo?'),
            content: Text('"$title"'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Hủy')),
              FilledButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  onDelete();
                },
                child: const Text('Xóa'),
              ),
            ],
          ),
        );
      },
    );
  }
}
