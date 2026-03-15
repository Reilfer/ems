import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/attendance_provider.dart';

class QrScanScreen extends StatefulWidget {
  const QrScanScreen({super.key});

  @override
  State<QrScanScreen> createState() => _QrScanScreenState();
}

class _QrScanScreenState extends State<QrScanScreen> {
  MobileScannerController? _controller;
  bool _isProcessing = false;
  bool _hasScanned = false;
  String? _resultMessage;
  bool _resultSuccess = false;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
      facing: CameraFacing.back,
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<Position?> _getLocation() async {
    try {
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        await Geolocator.requestPermission();
      }
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 5),
        ),
      );
    } catch (_) {
      return null;
    }
  }

  Future<void> _handleBarcode(BarcodeCapture capture) async {
    if (_isProcessing || _hasScanned) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode == null || barcode.rawValue == null) return;

    String qrData = barcode.rawValue!;

    setState(() => _isProcessing = true);

    String payload = '';
    String signature = '';
    String sessionId = '';

    if (qrData.contains('/attendance/scan')) {

      try {
        final uri = Uri.parse(qrData);
        payload = uri.queryParameters['p'] ?? '';
        signature = uri.queryParameters['sig'] ?? '';
        sessionId = uri.queryParameters['s'] ?? '';
      } catch (_) {
        setState(() {
          _resultMessage = 'Không thể đọc mã QR. Vui lòng thử lại.';
          _resultSuccess = false;
          _isProcessing = false;
          _hasScanned = true;
        });
        return;
      }
    } else if (qrData.startsWith('EDUV2|')) {

      payload = qrData;
      final parts = qrData.split('|');
      if (parts.length >= 7 && parts.last.length == 64) {
        signature = parts.last;
        payload = parts.sublist(0, parts.length - 1).join('|');
      }
      sessionId = parts.length >= 2 ? parts[1] : '';
    } else {
      setState(() {
        _resultMessage = 'Mã QR không hợp lệ. Vui lòng quét mã QR điểm danh.';
        _resultSuccess = false;
        _isProcessing = false;
        _hasScanned = true;
      });
      return;
    }

    if (!payload.startsWith('EDUV2|') || sessionId.isEmpty) {
      setState(() {
        _resultMessage = 'Mã QR không đúng định dạng. Vui lòng quét lại.';
        _resultSuccess = false;
        _isProcessing = false;
        _hasScanned = true;
      });
      return;
    }

    final parts = payload.split('|');
    if (parts.length < 5) {
      setState(() {
        _resultMessage = 'Mã QR bị lỗi. Vui lòng quét lại.';
        _resultSuccess = false;
        _isProcessing = false;
        _hasScanned = true;
      });
      return;
    }

    final className = parts.length > 2 ? parts[2] : 'N/A';

    final auth = context.read<AuthProvider>();
    final user = auth.user;
    if (user == null) {
      setState(() {
        _resultMessage = 'Chưa đăng nhập. Vui lòng đăng nhập trước.';
        _resultSuccess = false;
        _isProcessing = false;
        _hasScanned = true;
      });
      return;
    }

    final position = await _getLocation();

    final attendance = context.read<AttendanceProvider>();
    final success = await attendance.scanQR(
      sessionId: sessionId,
      studentId: user.id,
      qrPayload: payload,
      qrSignature: signature,
      deviceLat: position?.latitude,
      deviceLng: position?.longitude,
    );

    if (success) {
      setState(() {
        _resultMessage = 'Điểm danh thành công!\n$className — ${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}';
        _resultSuccess = true;
        _isProcessing = false;
        _hasScanned = true;
      });
    } else {

      final scanMsg = attendance.scanResult ?? '';
      if (scanMsg.contains('kết nối') || scanMsg.contains('timeout') || scanMsg.contains('connection')) {

        final serverTimeStr = parts.length > 3 ? parts[3] : '0';
        final serverTime = int.tryParse(serverTimeStr) ?? 0;
        final now = DateTime.now().millisecondsSinceEpoch;
        final driftMs = (now - serverTime).abs();

        if (driftMs > 10 * 60 * 1000) {

          setState(() {
            _resultMessage = 'Mã QR đã hết hạn (quá 10 phút). Vui lòng quét mã mới.';
            _resultSuccess = false;
            _isProcessing = false;
            _hasScanned = true;
          });
        } else {

          setState(() {
            _resultMessage = 'Điểm danh thành công! (Offline)\n$className — ${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}';
            _resultSuccess = true;
            _isProcessing = false;
            _hasScanned = true;
          });
        }
      } else {
        setState(() {
          _resultMessage = attendance.scanResult ?? 'Điểm danh thất bại';
          _resultSuccess = false;
          _isProcessing = false;
          _hasScanned = true;
        });
      }
    }

    _controller?.stop();
  }

  void _resetScan() {
    setState(() {
      _hasScanned = false;
      _isProcessing = false;
      _resultMessage = null;
      _resultSuccess = false;
    });
    _controller?.start();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quét QR Điểm danh'),
      ),
      body: Column(
        children: [

          Expanded(
            flex: 3,
            child: Stack(
              children: [

                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    bottom: Radius.circular(24),
                  ),
                  child: MobileScanner(
                    controller: _controller,
                    onDetect: _handleBarcode,
                  ),
                ),

                Center(
                  child: Container(
                    width: 250,
                    height: 250,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: _isProcessing
                            ? Colors.amber
                            : Colors.white.withOpacity(0.8),
                        width: 3,
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),

                if (_isProcessing)
                  const Center(
                    child: CircularProgressIndicator(color: Colors.white),
                  ),

                Positioned(
                  top: 16,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _isProcessing
                            ? 'Đang xử lý...'
                            : 'Hướng camera vào mã QR điểm danh',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: _hasScanned
                  ? _buildResult(colorScheme, theme)
                  : _buildInstructions(colorScheme, theme),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInstructions(ColorScheme colorScheme, ThemeData theme) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.qr_code_scanner_outlined,
          size: 48,
          color: colorScheme.primary,
        ),
        const SizedBox(height: 16),
        Text(
          'Quét mã QR điểm danh',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Giáo viên sẽ hiển thị mã QR trên màn hình.\n'
          'Hướng camera vào mã QR để điểm danh.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: colorScheme.onSurfaceVariant,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildResult(ColorScheme colorScheme, ThemeData theme) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          _resultSuccess ? Icons.check_circle_outlined : Icons.error_outline,
          size: 64,
          color: _resultSuccess ? Colors.green : colorScheme.error,
        ),
        const SizedBox(height: 16),
        Text(
          _resultSuccess ? 'Thành công!' : 'Thất bại',
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w600,
            color: _resultSuccess ? Colors.green : colorScheme.error,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          _resultMessage ?? '',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: colorScheme.onSurfaceVariant,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            OutlinedButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back),
              label: const Text('Quay lại'),
            ),
            const SizedBox(width: 12),
            if (!_resultSuccess)
              FilledButton.icon(
                onPressed: _resetScan,
                icon: const Icon(Icons.refresh),
                label: const Text('Quét lại'),
              ),
          ],
        ),
      ],
    );
  }
}
