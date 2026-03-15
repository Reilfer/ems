class User {
  final String id;
  final String schoolId;
  final String email;
  final String firstName;
  final String lastName;
  final String? phone;
  final String role;
  final String status;
  final DateTime? lastLogin;
  final DateTime createdAt;
  final School? school;

  User({
    required this.id,
    required this.schoolId,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phone,
    required this.role,
    required this.status,
    this.lastLogin,
    required this.createdAt,
    this.school,
  });

  String get fullName => '$firstName $lastName';

  String get roleDisplay {
    switch (role) {
      case 'SUPER_ADMIN': return 'Quản trị viên';
      case 'SCHOOL_ADMIN': return 'Admin trường';
      case 'PRINCIPAL': return 'Hiệu trưởng';
      case 'TEACHER': return 'Giáo viên';
      case 'STUDENT': return 'Học sinh';
      case 'PARENT': return 'Phụ huynh';
      default: return role;
    }
  }

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      schoolId: json['schoolId'] ?? '',
      email: json['email'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      phone: json['phone'],
      role: json['role'] ?? '',
      status: json['status'] ?? 'active',
      lastLogin: json['lastLogin'] != null
          ? DateTime.tryParse(json['lastLogin'])
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      school: json['school'] != null ? School.fromJson(json['school']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'schoolId': schoolId,
    'email': email,
    'firstName': firstName,
    'lastName': lastName,
    'phone': phone,
    'role': role,
    'status': status,
    'lastLogin': lastLogin?.toIso8601String(),
    'createdAt': createdAt.toIso8601String(),
    'school': school?.toJson(),
  };
}

class School {
  final String id;
  final String name;
  final String code;

  School({required this.id, required this.name, required this.code});

  factory School.fromJson(Map<String, dynamic> json) {
    return School(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'code': code};
}

class LoginResponse {
  final User user;
  final String accessToken;
  final String refreshToken;

  LoginResponse({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      user: User.fromJson(json['user']),
      accessToken: json['accessToken'] ?? '',
      refreshToken: json['refreshToken'] ?? '',
    );
  }
}
