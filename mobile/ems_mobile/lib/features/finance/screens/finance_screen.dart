import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_exceptions.dart';
import '../../auth/providers/auth_provider.dart';

class FinanceScreen extends StatefulWidget {
  const FinanceScreen({super.key});

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> {
  final ApiClient _api = ApiClient();
  List<Map<String, dynamic>> _invoices = [];
  bool _isLoading = true;
  String? _error;
  String _filter = 'all'; 

  @override
  void initState() {
    super.initState();
    _loadInvoices();
  }

  Future<void> _loadInvoices() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final params = <String, String>{};
      if (_filter != 'all') params['status'] = _filter.toUpperCase();

      final response =
          await _api.get(ApiConstants.invoices, queryParameters: params);
      final data = response.data;
      if (data is Map && data['data'] is List) {
        _invoices = List<Map<String, dynamic>>.from(data['data']);
      } else if (data is List) {
        _invoices = List<Map<String, dynamic>>.from(data);
      }
    } on ApiException catch (e) {
      _error = e.userMessage;
    } catch (_) {
      _error = 'Không thể tải hóa đơn';
    }
    setState(() => _isLoading = false);
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PAID':
        return Colors.green;
      case 'PENDING':
        return Colors.orange;
      case 'OVERDUE':
        return Colors.red;
      case 'PARTIAL':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  String _statusText(String status) {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'Đã thanh toán';
      case 'PENDING':
        return 'Chờ thanh toán';
      case 'OVERDUE':
        return 'Quá hạn';
      case 'PARTIAL':
        return 'Thanh toán một phần';
      default:
        return status;
    }
  }

  bool get _isAdmin {
    final role = context.read<AuthProvider>().user?.role ?? '';
    return role == 'SUPER_ADMIN' || role == 'SCHOOL_ADMIN' || role == 'PRINCIPAL';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Tài chính')),
      floatingActionButton: _isAdmin
          ? FloatingActionButton(
              onPressed: () => _showCreateInvoiceSheet(context),
              child: const Icon(Icons.receipt_outlined),
            )
          : null,
      body: Column(
        children: [

          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _FilterChip(
                    label: 'Tất cả',
                    selected: _filter == 'all',
                    onTap: () {
                      _filter = 'all';
                      _loadInvoices();
                    }),
                const SizedBox(width: 8),
                _FilterChip(
                    label: 'Chờ TT',
                    selected: _filter == 'pending',
                    onTap: () {
                      _filter = 'pending';
                      _loadInvoices();
                    }),
                const SizedBox(width: 8),
                _FilterChip(
                    label: 'Đã TT',
                    selected: _filter == 'paid',
                    onTap: () {
                      _filter = 'paid';
                      _loadInvoices();
                    }),
                const SizedBox(width: 8),
                _FilterChip(
                    label: 'Quá hạn',
                    selected: _filter == 'overdue',
                    onTap: () {
                      _filter = 'overdue';
                      _loadInvoices();
                    }),
              ],
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.error_outline,
                                size: 48, color: colorScheme.error),
                            const SizedBox(height: 8),
                            Text(_error!),
                            const SizedBox(height: 8),
                            OutlinedButton(
                                onPressed: _loadInvoices,
                                child: const Text('Thử lại')),
                          ],
                        ),
                      )
                    : _invoices.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.receipt_long_outlined,
                                    size: 64,
                                    color: colorScheme.onSurfaceVariant
                                        .withOpacity(0.4)),
                                const SizedBox(height: 12),
                                Text('Chưa có hóa đơn nào',
                                    style: TextStyle(
                                        color: colorScheme.onSurfaceVariant)),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _loadInvoices,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _invoices.length,
                              itemBuilder: (ctx, i) => _InvoiceCard(
                                invoice: _invoices[i],
                                statusColor: _statusColor,
                                statusText: _statusText,
                                isAdmin: _isAdmin,
                                onPayment: () => _showPaymentSheet(context, _invoices[i]),
                              ),
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  void _showCreateInvoiceSheet(BuildContext context) {
    final studentNameCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String feeType = 'tuition';

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
                  Text('Tạo hóa đơn', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 16),
                  TextField(
                    controller: studentNameCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Tên học sinh',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'tuition', label: Text('Học phí')),
                      ButtonSegment(value: 'meal', label: Text('Ăn trưa')),
                      ButtonSegment(value: 'transport', label: Text('Xe bus')),
                    ],
                    selected: {feeType},
                    onSelectionChanged: (v) => setSheetState(() => feeType = v.first),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: amountCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Số tiền (VNĐ)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: descCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Ghi chú',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () async {
                        final amount = double.tryParse(amountCtrl.text);
                        if (studentNameCtrl.text.isEmpty || amount == null) return;
                        try {
                          await _api.post(ApiConstants.invoices, data: {
                            'studentName': studentNameCtrl.text,
                            'feeType': feeType,
                            'totalAmount': amount,
                            'description': descCtrl.text,
                            'status': 'PENDING',
                          });
                          if (ctx2.mounted) Navigator.pop(ctx2);
                          _loadInvoices();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Đã tạo hóa đơn')),
                            );
                          }
                        } catch (_) {
                          if (ctx2.mounted) {
                            ScaffoldMessenger.of(ctx2).showSnackBar(
                              const SnackBar(content: Text('Tạo hóa đơn thất bại')),
                            );
                          }
                        }
                      },
                      child: const Text('Tạo hóa đơn'),
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

  void _showPaymentSheet(BuildContext context, Map<String, dynamic> invoice) {
    final amountCtrl = TextEditingController();
    final totalAmount = (invoice['totalAmount'] ?? invoice['finalAmount'] ?? 0) as num;
    final paidAmount = (invoice['paidAmount'] ?? 0) as num;
    final remaining = totalAmount - paidAmount;
    amountCtrl.text = remaining.toStringAsFixed(0);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) {
        final theme = Theme.of(ctx);
        return Padding(
          padding: EdgeInsets.only(
            left: 24, right: 24, top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Xác nhận thanh toán', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              Text('Hóa đơn: ${invoice['invoiceCode'] ?? invoice['invoiceNumber'] ?? ''}'),
              Text('Còn lại: ${remaining.toStringAsFixed(0)}₫'),
              const SizedBox(height: 16),
              TextField(
                controller: amountCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Số tiền thanh toán (VNĐ)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () async {
                    final amount = double.tryParse(amountCtrl.text);
                    if (amount == null || amount <= 0) return;
                    try {
                      final invoiceId = invoice['id'] ?? '';
                      await _api.patch('${ApiConstants.invoices}/$invoiceId/pay', data: {
                        'amount': amount,
                        'paymentMethod': 'cash',
                      });
                      if (ctx.mounted) Navigator.pop(ctx);
                      _loadInvoices();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Thanh toán thành công')),
                        );
                      }
                    } catch (_) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          const SnackBar(content: Text('Thanh toán thất bại')),
                        );
                      }
                    }
                  },
                  child: const Text('Thanh toán'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip(
      {required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
    );
  }
}

class _InvoiceCard extends StatelessWidget {
  final Map<String, dynamic> invoice;
  final Color Function(String) statusColor;
  final String Function(String) statusText;
  final bool isAdmin;
  final VoidCallback? onPayment;

  const _InvoiceCard({
    required this.invoice,
    required this.statusColor,
    required this.statusText,
    this.isAdmin = false,
    this.onPayment,
  });

  String _formatCurrency(dynamic amount) {
    if (amount == null) return '0₫';
    final num value =
        amount is num ? amount : num.tryParse(amount.toString()) ?? 0;
    final formatted = value.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]}.',
        );
    return '${formatted}₫';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final status = (invoice['status'] ?? 'PENDING').toString();
    final code = invoice['invoiceCode'] ?? invoice['invoiceNumber'] ?? '';
    final studentName = invoice['studentName'] ?? '';
    final totalAmount = invoice['totalAmount'] ?? invoice['finalAmount'] ?? 0;
    final paidAmount = invoice['paidAmount'] ?? 0;
    final dueDate = invoice['dueDate'] ?? '';
    final description = invoice['description'] ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    code,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 15),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor(status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusText(status),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: statusColor(status),
                    ),
                  ),
                ),
              ],
            ),
            if (studentName.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(studentName,
                  style: TextStyle(
                      color: colorScheme.onSurfaceVariant, fontSize: 13)),
            ],
            if (description.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(description,
                  style: TextStyle(
                      color: colorScheme.onSurfaceVariant, fontSize: 12)),
            ],
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Tổng cộng',
                        style: TextStyle(
                            fontSize: 11, color: colorScheme.onSurfaceVariant)),
                    Text(_formatCurrency(totalAmount),
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 16)),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('Đã thanh toán',
                        style: TextStyle(
                            fontSize: 11, color: colorScheme.onSurfaceVariant)),
                    Text(
                      _formatCurrency(paidAmount),
                      style: TextStyle(
                          fontWeight: FontWeight.w500,
                          fontSize: 14,
                          color: Colors.green.shade700),
                    ),
                  ],
                ),
              ],
            ),
            if (dueDate.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.calendar_today_outlined,
                      size: 14, color: colorScheme.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Text(
                    'Hạn: $dueDate',
                    style: TextStyle(
                        fontSize: 12, color: colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            ],
            if (isAdmin && status.toUpperCase() != 'PAID') ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.tonal(
                  onPressed: onPayment,
                  child: const Text('Xác nhận thanh toán'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
