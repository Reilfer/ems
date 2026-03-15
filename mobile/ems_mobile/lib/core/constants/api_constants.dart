class ApiConstants {
  ApiConstants._();

  static const String baseUrl = 'http://192.168.1.3:3000';

  static const String login = '/api/v1/auth/login';
  static const String register = '/api/v1/auth/register';
  static const String me = '/api/v1/auth/me';
  static const String updateProfile = '/api/v1/auth/me';
  static const String refreshToken = '/api/v1/auth/refresh-token';
  static const String logout = '/api/v1/auth/logout';
  static const String changePassword = '/api/v1/auth/change-password';

  static const String users = '/api/v1/auth/users';

  static const String students = '/api/v1/students';

  static const String attendanceSessions = '/api/v1/attendance/sessions';
  static const String attendanceRecords = '/api/v1/attendance/records';
  static const String attendanceScan = '/api/v1/attendance/records/scan';
  static const String attendanceStats = '/api/v1/attendance/stats';

  static const String timetable = '/api/v1/schedule/timetable';
  static const String events = '/api/v1/schedule/events';

  static const String grades = '/api/v1/grades';

  static const String invoices = '/api/v1/finance/invoices';
  static const String payments = '/api/v1/finance/payments';

  static const String teachers = '/api/v1/hr/teachers';

  static const String notifications = '/api/v1/notifications';

  static const String assignments = '/api/v1/homework/homework';
  static const String homework = '/api/v1/homework/homework';

  static const String aiChat = '/api/v1/ai/chat';
  static const String aiChatStream = '/api/v1/ai/chat/stream';
  static const String aiCounseling = '/api/v1/ai/counseling';

  static const String enrollmentApplications = '/api/v1/enrollment/applications';
  static const String enrollmentLeads = '/api/v1/enrollment/leads';

  static const String analytics = '/api/v1/analytics';

  static const String leaveRequests = '/api/v1/students';
}
