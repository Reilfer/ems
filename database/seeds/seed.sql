-- =============================================
-- ReilferEDUV - Seed Data (Development)
-- =============================================

-- Demo School
INSERT INTO schools (id, name, code, address, phone, email, subscription_plan, max_students, max_teachers)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Trường THPT Demo ReilferEDUV',
    'DEMO001',
    '123 Nguyễn Huệ, Quận 1, TP.HCM',
    '028-1234-5678',
    'demo@reilfereduv.vn',
    'premium',
    500,
    50
);

-- Admin User (password: Admin@123)
INSERT INTO users (id, school_id, email, password_hash, first_name, last_name, role, status)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'admin@demo.reilfereduv.vn',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Admin',
    'Demo',
    'admin',
    'active'
);

-- Demo Academic Year
INSERT INTO academic_years (id, school_id, name, start_date, end_date, is_current)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '2024-2025',
    '2024-09-05',
    '2025-05-31',
    true
);

-- Demo Grade Levels
INSERT INTO grade_levels (school_id, name, level) VALUES
('a0000000-0000-0000-0000-000000000001', 'Khối 10', 10),
('a0000000-0000-0000-0000-000000000001', 'Khối 11', 11),
('a0000000-0000-0000-0000-000000000001', 'Khối 12', 12);

-- Demo Subjects
INSERT INTO subjects (school_id, name, code) VALUES
('a0000000-0000-0000-0000-000000000001', 'Toán', 'MATH'),
('a0000000-0000-0000-0000-000000000001', 'Ngữ văn', 'VIET'),
('a0000000-0000-0000-0000-000000000001', 'Tiếng Anh', 'ENG'),
('a0000000-0000-0000-0000-000000000001', 'Vật lý', 'PHYS'),
('a0000000-0000-0000-0000-000000000001', 'Hóa học', 'CHEM'),
('a0000000-0000-0000-0000-000000000001', 'Sinh học', 'BIO'),
('a0000000-0000-0000-0000-000000000001', 'Lịch sử', 'HIST'),
('a0000000-0000-0000-0000-000000000001', 'Địa lý', 'GEO'),
('a0000000-0000-0000-0000-000000000001', 'Tin học', 'IT'),
('a0000000-0000-0000-0000-000000000001', 'Giáo dục công dân', 'GDCD');
