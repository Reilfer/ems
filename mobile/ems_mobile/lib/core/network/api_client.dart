import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../constants/app_constants.dart';
import '../storage/secure_storage.dart';
import 'api_exceptions.dart';

class ApiClient {
  static ApiClient? _instance;
  late final Dio _dio;

  ApiClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(milliseconds: AppConstants.connectTimeout),
        receiveTimeout: const Duration(milliseconds: AppConstants.receiveTimeout),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.addAll([
      _AuthInterceptor(),
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (obj) {}, 
      ),
    ]);
  }

  factory ApiClient() {
    _instance ??= ApiClient._();
    return _instance!;
  }

  Dio get dio => _dio;

  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      return await _dio.get(path, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      return await _dio.post(path, data: data, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response> patch(
    String path, {
    dynamic data,
  }) async {
    try {
      return await _dio.patch(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response> delete(String path) async {
    try {
      return await _dio.delete(path);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  ApiException _handleError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      return ApiException(message: 'Kết nối timeout');
    }

    if (e.type == DioExceptionType.connectionError) {
      return ApiException(message: 'Không thể kết nối máy chủ');
    }

    final response = e.response;
    if (response != null) {
      final data = response.data;
      String message = 'Lỗi không xác định';
      if (data is Map) {
        message = data['message']?.toString() ?? message;
      }
      return ApiException(
        message: message,
        statusCode: response.statusCode,
        data: data,
      );
    }

    return ApiException(message: e.message ?? 'Lỗi không xác định');
  }
}

class _AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {

    final noAuthPaths = [
      ApiConstants.login,
      ApiConstants.register,
      ApiConstants.refreshToken,
    ];

    if (!noAuthPaths.contains(options.path)) {
      final token = await SecureStorage.getAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {

      final refreshed = await _tryRefreshToken();
      if (refreshed) {

        final token = await SecureStorage.getAccessToken();
        err.requestOptions.headers['Authorization'] = 'Bearer $token';
        try {
          final response = await Dio().fetch(err.requestOptions);
          handler.resolve(response);
          return;
        } catch (_) {}
      }
    }
    handler.next(err);
  }

  Future<bool> _tryRefreshToken() async {
    try {
      final refreshToken = await SecureStorage.getRefreshToken();
      if (refreshToken == null) return false;

      final dio = Dio(BaseOptions(baseUrl: ApiConstants.baseUrl));
      final response = await dio.post(
        ApiConstants.refreshToken,
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200) {
        final data = response.data;
        await SecureStorage.saveTokens(
          accessToken: data['accessToken'],
          refreshToken: data['refreshToken'],
        );
        return true;
      }
    } catch (_) {}
    return false;
  }
}
