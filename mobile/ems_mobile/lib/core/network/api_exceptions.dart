class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  ApiException({
    required this.message,
    this.statusCode,
    this.data,
  });

  @override
  String toString() => 'ApiException($statusCode): $message';

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isConflict => statusCode == 409;
  bool get isServerError => statusCode != null && statusCode! >= 500;
  bool get isNetworkError => statusCode == null;

  String get userMessage {
    if (isNetworkError) return 'Không thể kết nối máy chủ. Kiểm tra mạng.';
    if (isServerError) return 'Lỗi máy chủ. Vui lòng thử lại sau.';

    return message;
  }
}
