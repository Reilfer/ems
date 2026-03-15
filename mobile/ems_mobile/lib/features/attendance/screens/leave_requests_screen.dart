import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/network/api_client.dart';
import '../../auth/providers/auth_provider.dart';
import 'package:intl/intl.dart';

class LeaveRequestsScreen extends StatefulWidget {
  const LeaveRequestsScreen({super.key});

  @override
  State<LeaveRequestsScreen> createState() => _LeaveRequestsScreenState();
}

class _LeaveRequestsScreenState extends State<LeaveRequestsScreen> {
  final ApiClient _api = ApiClient();
  bool _isLoading = true;
  List<dynamic> _requests = [];
  String _activeTab = 'student'; 

  @override
  void initState() {
    super.initState();
    _fetchRequests();
  }

  Future<void> _fetchRequests() async {
    setState(() => _isLoading = true);
    try {
      final user = context.read<AuthProvider>().user;
      final isAdmin = user?.role == 'SUPER_ADMIN' || user?.role == 'SCHOOL_ADMIN';

      final url = isAdmin 
          ? '/api/v1/attendance/leave-requests?type=$_activeTab' 
          : '/api/v1/attendance/leave-requests';

      final res = await _api.get(url);
      setState(() {
        _requests = res.data is Map ? (res.data['data'] ?? []) : res.data;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lỗi tải danh sách đơn xin nghỉ')),
      );
    }
  }

  void _showCreateModal() {
    showDialog(
      context: context,
      builder: (ctx) => const _CreateLeaveRequestForm(),
    ).then((val) {
      if (val == true) _fetchRequests();
    });
  }

  Future<void> _updateStatus(String id, String status) async {
    try {
      await _api.patch('/api/v1/attendance/leave-requests/$id/status', data: {'status': status});
      _fetchRequests();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Đã ${status == 'approved' ? 'duyệt' : 'từ chối'} đơn')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lỗi cập nhật')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final isAdmin = user?.role == 'SUPER_ADMIN' || user?.role == 'SCHOOL_ADMIN';
    final isTeacher = user?.role == 'TEACHER'; 
    final canApprove = isAdmin || isTeacher;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFD),
      appBar: AppBar(
        title: const Text('Đơn xin nghỉ', style: TextStyle(fontWeight: FontWeight.w500, color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        actions: [
          if (!isAdmin)
             TextButton(
               onPressed: _showCreateModal,
               child: const Text('TẠO ĐƠN', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1A73E8))),
             )
        ],
      ),
      body: Column(
        children: [
          if (isAdmin)
             Container(
               color: Colors.white,
               padding: const EdgeInsets.symmetric(horizontal: 16),
               child: Row(
                 mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                 children: [
                   _TabItem(
                     title: 'Học sinh',
                     isActive: _activeTab == 'student',
                     onTap: () {
                       setState(() => _activeTab = 'student');
                       _fetchRequests();
                     },
                   ),
                   _TabItem(
                     title: 'Giáo viên',
                     isActive: _activeTab == 'staff',
                     onTap: () {
                       setState(() => _activeTab = 'staff');
                       _fetchRequests();
                     },
                   ),
                 ],
               ),
             ),

          Expanded(
            child: _isLoading 
                ? const Center(child: CircularProgressIndicator())
                : _requests.isEmpty 
                    ? const Center(child: Text('Không có đơn xin nghỉ nào', style: TextStyle(color: Colors.grey)))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _requests.length,
                        itemBuilder: (ctx, i) {
                          final req = _requests[i];
                          final status = req['status'] ?? 'pending';

                          Color statusColor = Colors.grey;
                          String statusText = 'Chờ duyệt';
                          if (status == 'approved') {
                            statusColor = const Color(0xFF188038);
                            statusText = 'Đã duyệt';
                          } else if (status == 'rejected') {
                            statusColor = const Color(0xFFD93025);
                            statusText = 'Từ chối';
                          }

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFDADCE0)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(req['requestedBy'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: statusColor.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(statusText, style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.bold)),
                                    )
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text('Từ: ${DateFormat('dd/MM/yyyy').format(DateTime.parse(req['startDate']))} - Đến: ${DateFormat('dd/MM/yyyy').format(DateTime.parse(req['endDate']))}', style: const TextStyle(color: Colors.black87)),
                                const SizedBox(height: 8),
                                Text('Lý do: ${req['reason']}', style: const TextStyle(color: Colors.black54)),

                                if (canApprove && status == 'pending') ...[
                                  const SizedBox(height: 16),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      TextButton(
                                        onPressed: () => _updateStatus(req['id'], 'rejected'),
                                        child: const Text('TỪ CHỐI', style: TextStyle(color: Color(0xFFD93025), fontWeight: FontWeight.bold)),
                                      ),
                                      const SizedBox(width: 8),
                                      FilledButton(
                                        onPressed: () => _updateStatus(req['id'], 'approved'),
                                        style: FilledButton.styleFrom(
                                          backgroundColor: const Color(0xFF188038),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                          elevation: 0,
                                        ),
                                        child: const Text('DUYỆT ĐƠN', style: TextStyle(fontWeight: FontWeight.bold)),
                                      )
                                    ],
                                  )
                                ]
                              ],
                            ),
                          );
                        },
                    ),
          )
        ],
      ),
    );
  }
}

class _TabItem extends StatelessWidget {
  final String title;
  final bool isActive;
  final VoidCallback onTap;

  const _TabItem({required this.title, required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isActive ? const Color(0xFF1A73E8) : Colors.transparent,
              width: 3,
            )
          )
        ),
        child: Text(
          title,
          style: TextStyle(
            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
            color: isActive ? const Color(0xFF1A73E8) : Colors.grey.shade600,
          ),
        ),
      ),
    );
  }
}

class _CreateLeaveRequestForm extends StatefulWidget {
  const _CreateLeaveRequestForm();

  @override
  State<_CreateLeaveRequestForm> createState() => _CreateLeaveRequestFormState();
}

class _CreateLeaveRequestFormState extends State<_CreateLeaveRequestForm> {
  final ApiClient _api = ApiClient();
  final _reasonCtrl = TextEditingController();
  DateTime? _startDate;
  DateTime? _endDate;
  bool _isSaving = false;

  Future<void> _submit() async {
    if (_startDate == null || _endDate == null || _reasonCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng nhập đủ thông tin')));
      return;
    }

    setState(() => _isSaving = true);
    try {
      final user = context.read<AuthProvider>().user;
      final isStaff = user?.role == 'TEACHER' || user?.role == 'SCHOOL_ADMIN';

      await _api.post('/api/v1/attendance/leave-requests', data: {
        'type': isStaff ? 'staff' : 'student',
        'startDate': _startDate!.toIso8601String(),
        'endDate': _endDate!.toIso8601String(),
        'reason': _reasonCtrl.text,
      });

      if (!mounted) return;
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gửi đơn thành công')));
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lỗi gửi đơn')));
    }
  }

  Future<void> _pickDate(bool isStart) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
             colorScheme: const ColorScheme.light(primary: Color(0xFF1A73E8)),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        if (isStart) _startDate = picked;
        else _endDate = picked;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      titlePadding: EdgeInsets.zero,
      contentPadding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
      actionsPadding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
      title: Container(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: Color(0xFFE8EAED), width: 1)),
        ),
        child: const Text(
          'Tạo đơn xin nghỉ',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF202124)),
        ),
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 20),
            const Text('Thời gian', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF5F6368))),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => _pickDate(true),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: _startDate != null ? const Color(0xFF1A73E8) : const Color(0xFFDADCE0)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.calendar_today, size: 16, color: _startDate != null ? const Color(0xFF1A73E8) : const Color(0xFF9AA0A6)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _startDate == null ? 'Từ ngày' : DateFormat('dd/MM/yyyy').format(_startDate!),
                              style: TextStyle(
                                fontSize: 14,
                                color: _startDate != null ? const Color(0xFF202124) : const Color(0xFF9AA0A6),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Text('—', style: TextStyle(color: Color(0xFF9AA0A6))),
                ),
                Expanded(
                  child: InkWell(
                    onTap: () => _pickDate(false),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: _endDate != null ? const Color(0xFF1A73E8) : const Color(0xFFDADCE0)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.calendar_today, size: 16, color: _endDate != null ? const Color(0xFF1A73E8) : const Color(0xFF9AA0A6)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _endDate == null ? 'Đến ngày' : DateFormat('dd/MM/yyyy').format(_endDate!),
                              style: TextStyle(
                                fontSize: 14,
                                color: _endDate != null ? const Color(0xFF202124) : const Color(0xFF9AA0A6),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Text('Lý do', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF5F6368))),
            const SizedBox(height: 8),
            TextField(
              controller: _reasonCtrl,
              maxLines: 3,
              style: const TextStyle(fontSize: 14, color: Color(0xFF202124)),
              decoration: InputDecoration(
                hintText: 'Nhập lý do xin nghỉ...',
                hintStyle: const TextStyle(color: Color(0xFF9AA0A6), fontSize: 14),
                filled: true,
                fillColor: const Color(0xFFF8F9FA),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFFDADCE0)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFFDADCE0)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF1A73E8), width: 2),
                ),
                contentPadding: const EdgeInsets.all(14),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: const Text('Hủy', style: TextStyle(color: Color(0xFF5F6368), fontWeight: FontWeight.w500, fontSize: 14)),
        ),
        const SizedBox(width: 8),
        ElevatedButton(
          onPressed: _isSaving ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF1A73E8),
            foregroundColor: Colors.white,
            disabledBackgroundColor: const Color(0xFF1A73E8).withOpacity(0.5),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          ),
          child: _isSaving
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text('Gửi đơn', style: TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
        ),
      ],
    );
  }
}
