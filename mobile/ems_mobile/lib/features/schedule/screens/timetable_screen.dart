import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/schedule_provider.dart';
import '../../auth/providers/auth_provider.dart';

class TimetableScreen extends StatefulWidget {
  const TimetableScreen({super.key});

  @override
  State<TimetableScreen> createState() => _TimetableScreenState();
}

class _TimetableScreenState extends State<TimetableScreen> {
  static const _dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  static const _dayFullNames = [
    'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật',
  ];

  int _selectedDay = DateTime.now().weekday - 1; 

  bool get _isAdmin {
    final role = context.read<AuthProvider>().user?.role ?? '';
    return role == 'SUPER_ADMIN' || role == 'SCHOOL_ADMIN' || role == 'PRINCIPAL';
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ScheduleProvider>().loadTimetable();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Thời khóa biểu')),
      floatingActionButton: _isAdmin
          ? FloatingActionButton(
              onPressed: () => _showCreateSlotSheet(context),
              child: const Icon(Icons.add_outlined),
            )
          : null,
      body: Column(
        children: [

          SizedBox(
            height: 56,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: 7,
              itemBuilder: (context, index) {
                final isSelected = index == _selectedDay;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                  child: FilterChip(
                    selected: isSelected,
                    label: Text(_dayNames[index]),
                    onSelected: (_) => setState(() => _selectedDay = index),
                    showCheckmark: false,
                    selectedColor: colorScheme.primaryContainer,
                    backgroundColor: colorScheme.surface,
                    side: BorderSide(
                      color: isSelected ? colorScheme.primary : colorScheme.outlineVariant,
                    ),
                  ),
                );
              },
            ),
          ),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                _dayFullNames[_selectedDay],
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),

          Expanded(
            child: Consumer<ScheduleProvider>(
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

                final daySlots = provider.slots.where((slot) {
                  final dayOfWeek = slot['dayOfWeek'] ?? slot['day'];
                  return dayOfWeek == _selectedDay + 1 || dayOfWeek == _selectedDay;
                }).toList();

                daySlots.sort((a, b) {
                  final pa = a['period'] ?? a['startPeriod'] ?? 0;
                  final pb = b['period'] ?? b['startPeriod'] ?? 0;
                  return (pa as int).compareTo(pb as int);
                });

                if (daySlots.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.event_busy_outlined, size: 64,
                          color: colorScheme.onSurfaceVariant.withOpacity(0.5)),
                        const SizedBox(height: 12),
                        Text('Không có tiết học',
                          style: TextStyle(color: colorScheme.onSurfaceVariant)),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => provider.refresh(),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: daySlots.length,
                    itemBuilder: (context, index) {
                      return _SlotCard(
                        slot: daySlots[index],
                        isAdmin: _isAdmin,
                        onDelete: () => _confirmDeleteSlot(
                            context, daySlots[index], provider),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showCreateSlotSheet(BuildContext context) {
    final subjectCtrl = TextEditingController();
    final teacherCtrl = TextEditingController();
    final roomCtrl = TextEditingController();
    final classCtrl = TextEditingController();
    int period = 1;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx2, setSheetState) {
          final theme = Theme.of(ctx2);
          return Padding(
            padding: EdgeInsets.only(
              left: 24, right: 24, top: 24,
              bottom: MediaQuery.of(ctx2).viewInsets.bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Thêm tiết học — ${_dayFullNames[_selectedDay]}',
                      style: theme.textTheme.titleMedium),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<int>(
                    value: period,
                    decoration: const InputDecoration(
                      labelText: 'Tiết',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: List.generate(10, (i) => DropdownMenuItem(
                        value: i + 1, child: Text('Tiết ${i + 1}'))),
                    onChanged: (v) => setSheetState(() => period = v ?? 1),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: subjectCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Môn học',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: classCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Lớp',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: teacherCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Giáo viên',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: roomCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Phòng',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () async {
                        if (subjectCtrl.text.isEmpty) return;
                        final provider = context.read<ScheduleProvider>();
                        try {
                          await provider.createSlot({
                            'dayOfWeek': _selectedDay + 1,
                            'period': period,
                            'subjectName': subjectCtrl.text,
                            'className': classCtrl.text,
                            'teacherName': teacherCtrl.text,
                            'roomName': roomCtrl.text,
                          });
                          if (ctx2.mounted) Navigator.pop(ctx2);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Đã thêm tiết học')),
                            );
                          }
                        } catch (_) {
                          if (ctx2.mounted) {
                            ScaffoldMessenger.of(ctx2).showSnackBar(
                              const SnackBar(content: Text('Thêm tiết học thất bại')),
                            );
                          }
                        }
                      },
                      child: const Text('Thêm tiết học'),
                    ),
                  ),
                ],
              ),
            ),
          );
        });
      },
    );
  }

  void _confirmDeleteSlot(BuildContext context, Map<String, dynamic> slot,
      ScheduleProvider provider) {
    final subject = slot['subject']?['name'] ?? slot['subjectName'] ?? '';
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xoá tiết học'),
        content: Text('Bạn chắc chắn muốn xoá "$subject"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Huỷ')),
          FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.error),
            onPressed: () async {
              try {
                await provider.deleteSlot(slot['id'].toString());
                if (ctx.mounted) Navigator.pop(ctx);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Đã xoá tiết học')),
                  );
                }
              } catch (_) {
                if (ctx.mounted) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(content: Text('Xoá thất bại')),
                  );
                }
              }
            },
            child: const Text('Xoá'),
          ),
        ],
      ),
    );
  }
}

class _SlotCard extends StatelessWidget {
  final Map<String, dynamic> slot;
  final bool isAdmin;
  final VoidCallback? onDelete;
  const _SlotCard({required this.slot, this.isAdmin = false, this.onDelete});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final period = slot['period'] ?? slot['startPeriod'] ?? '';
    final subject = slot['subject']?['name'] ?? slot['subjectName'] ?? 'Chưa rõ';
    final teacher = slot['teacher']?['name'] ?? slot['teacherName'] ?? '';
    final room = slot['room'] ?? slot['roomName'] ?? '';
    final className = slot['class']?['name'] ?? slot['className'] ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onLongPress: isAdmin ? onDelete : null,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [

              Container(
                width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(
                  'T$period',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onPrimaryContainer,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    subject,
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      if (className.isNotEmpty) ...[
                        Icon(Icons.class_outlined, size: 14, color: colorScheme.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text(className, style: TextStyle(fontSize: 12, color: colorScheme.onSurfaceVariant)),
                        const SizedBox(width: 12),
                      ],
                      if (teacher.isNotEmpty) ...[
                        Icon(Icons.person_outlined, size: 14, color: colorScheme.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(teacher, style: TextStyle(fontSize: 12, color: colorScheme.onSurfaceVariant),
                            overflow: TextOverflow.ellipsis),
                        ),
                      ],
                    ],
                  ),
                  if (room.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        children: [
                          Icon(Icons.room_outlined, size: 14, color: colorScheme.onSurfaceVariant),
                          const SizedBox(width: 4),
                          Text('Phòng $room', style: TextStyle(fontSize: 12, color: colorScheme.onSurfaceVariant)),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
      ),
    );
  }
}
