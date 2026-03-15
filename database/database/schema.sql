-- =============================================
-- ReilferEDUV - Database Schema
-- PostgreSQL 16
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. SCHOOLS (Tenant Table)
-- =============================================
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo_url VARCHAR(500),
    subscription_plan VARCHAR(50) DEFAULT 'free',  -- free, basic, premium, enterprise
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    max_students INTEGER DEFAULT 100,
    max_teachers INTEGER DEFAULT 20,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. USERS
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'principal', 'teacher', 'parent', 'student', 'staff')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    last_login TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, email)
);

-- =============================================
-- 3. ACADEMIC YEARS
-- =============================================
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,         -- "2024-2025"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. GRADES (Khối lớp)
-- =============================================
CREATE TABLE grade_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,           -- "Khối 1", "Khối 2"
    level INTEGER NOT NULL,              -- 1, 2, 3...12
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. CLASSES
-- =============================================
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    grade_level_id UUID NOT NULL REFERENCES grade_levels(id),
    name VARCHAR(50) NOT NULL,            -- "1A1", "10B2"
    homeroom_teacher_id UUID REFERENCES users(id),
    max_students INTEGER DEFAULT 45,
    room VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. STUDENTS
-- =============================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    student_code VARCHAR(50) NOT NULL,    -- Mã học sinh
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    avatar_url VARCHAR(500),
    current_class_id UUID REFERENCES classes(id),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'transferred', 'suspended', 'expelled')),
    parent_ids UUID[] DEFAULT '{}',       -- Array of parent user IDs
    medical_notes TEXT,
    face_encoding BYTEA,                  -- Mã hóa khuôn mặt cho điểm danh
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, student_code)
);

-- =============================================
-- 7. TEACHERS
-- =============================================
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    teacher_code VARCHAR(50) NOT NULL,
    specialization VARCHAR(255),          -- Chuyên môn
    qualification VARCHAR(255),           -- Bằng cấp
    hire_date DATE,
    department VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, teacher_code)
);

-- =============================================
-- 8. SUBJECTS
-- =============================================
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,           -- "Toán", "Văn"
    code VARCHAR(50) NOT NULL,
    description TEXT,
    grade_level_id UUID REFERENCES grade_levels(id),
    credits DECIMAL(3,1) DEFAULT 1.0,
    subject_type VARCHAR(50) DEFAULT 'required',  -- required, elective
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, code)
);

-- =============================================
-- 9. ATTENDANCE SESSIONS
-- =============================================
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id),
    teacher_id UUID NOT NULL REFERENCES users(id),
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period INTEGER,                        -- Tiết học
    subject_id UUID REFERENCES subjects(id),
    type VARCHAR(20) DEFAULT 'manual' CHECK (type IN ('manual', 'face', 'qr')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, session_date, period)
);

-- =============================================
-- 10. ATTENDANCE RECORDS
-- =============================================
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    check_in_time TIMESTAMP WITH TIME ZONE,
    note TEXT,
    marked_by UUID REFERENCES users(id),
    method VARCHAR(20) DEFAULT 'manual',  -- manual, face, qr
    confidence DECIMAL(5,2),              -- Độ tin cậy nhận diện khuôn mặt
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- =============================================
-- 11. SCORES (Điểm số)
-- =============================================
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
    score_type VARCHAR(50) NOT NULL,       -- 'mieng', 'phut15', 'tiet', 'giuaki', 'cuoiki'
    score DECIMAL(4,2) NOT NULL CHECK (score >= 0 AND score <= 10),
    weight DECIMAL(3,2) DEFAULT 1.0,
    graded_by UUID REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 12. INVOICES (Hóa đơn)
-- =============================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    semester INTEGER,
    total_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    final_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'partial', 'paid', 'overdue', 'cancelled')),
    due_date DATE NOT NULL,
    issued_date DATE DEFAULT CURRENT_DATE,
    paid_date DATE,
    description TEXT,
    items JSONB NOT NULL DEFAULT '[]',     -- [{name, quantity, unit_price, amount}]
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, invoice_number)
);

-- =============================================
-- 13. PAYMENTS (Thanh toán)
-- =============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount DECIMAL(12,2) NOT NULL,
    method VARCHAR(20) NOT NULL CHECK (method IN ('cash', 'bank_transfer', 'vnpay', 'momo', 'zalopay')),
    transaction_id VARCHAR(255),
    gateway_response JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    paid_at TIMESTAMP WITH TIME ZONE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 14. NOTIFICATIONS
-- =============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,             -- 'attendance', 'grade', 'fee', 'announcement', 'system'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    channels VARCHAR(50)[] DEFAULT '{"in_app"}',  -- in_app, email, sms, push
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 15. LEAVE REQUESTS (Đơn xin nghỉ)
-- =============================================
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    requested_by UUID NOT NULL REFERENCES users(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    attachment_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 16. TIMETABLE SLOTS (Thời khóa biểu)
-- =============================================
CREATE TABLE timetable_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    teacher_id UUID NOT NULL REFERENCES users(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Mon
    period INTEGER NOT NULL,
    room VARCHAR(50),
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, day_of_week, period, academic_year_id)
);

-- =============================================
-- 17. EVENTS (Sự kiện)
-- =============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('exam', 'holiday', 'meeting', 'activity', 'sport', 'other')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    all_day BOOLEAN DEFAULT false,
    recurrence_rule TEXT,               -- iCal RRULE
    target_roles VARCHAR(50)[] DEFAULT '{}',
    target_classes UUID[] DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 18. ROOM BOOKINGS (Đặt phòng)
-- =============================================
CREATE TABLE room_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    room_name VARCHAR(100) NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    booked_by UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 19. TIMEKEEPING (Chấm công GV)
-- =============================================
CREATE TABLE timekeeping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    method VARCHAR(20) DEFAULT 'manual' CHECK (method IN ('manual', 'face', 'qr', 'gps')),
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'leave', 'half_day')),
    work_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- =============================================
-- 20. PAYROLL (Bảng lương)
-- =============================================
CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL,
    allowances DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    insurance DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    net_salary DECIMAL(12,2) NOT NULL,
    work_days INTEGER DEFAULT 0,
    absent_days INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid')),
    paid_at TIMESTAMP WITH TIME ZONE,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month, year)
);

-- =============================================
-- 21. CONTRACTS (Hợp đồng lao động)
-- =============================================
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    contract_number VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('probation', 'fixed_term', 'indefinite', 'part_time')),
    start_date DATE NOT NULL,
    end_date DATE,
    base_salary DECIMAL(12,2) NOT NULL,
    position VARCHAR(100),
    department VARCHAR(100),
    signed_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
    attachment_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, contract_number)
);

-- =============================================
-- 22. ENROLLMENT APPLICATIONS (Hồ sơ tuyển sinh)
-- =============================================
CREATE TABLE enrollment_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    application_code VARCHAR(50) NOT NULL,
    student_first_name VARCHAR(100) NOT NULL,
    student_last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    parent_name VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    parent_email VARCHAR(255),
    address TEXT,
    previous_school VARCHAR(255),
    grade_level_applying INTEGER NOT NULL,
    documents JSONB DEFAULT '[]',
    status VARCHAR(30) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'interview', 'testing', 'accepted', 'rejected', 'enrolled', 'withdrawn')),
    notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    source VARCHAR(50),                   -- website, referral, event, social_media
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, application_code)
);

-- =============================================
-- 23. CRM LEADS (Tracking tuyển sinh)
-- =============================================
CREATE TABLE crm_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    parent_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    student_name VARCHAR(255),
    grade_interest INTEGER,
    source VARCHAR(50),
    status VARCHAR(30) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'visiting', 'applied', 'enrolled', 'lost')),
    assigned_to UUID REFERENCES users(id),
    last_contact_date DATE,
    notes TEXT,
    tags VARCHAR(255)[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 24. QUESTION BANKS (Ngân hàng câu hỏi)
-- =============================================
CREATE TABLE question_banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    name VARCHAR(255) NOT NULL,
    grade_level INTEGER,
    created_by UUID REFERENCES users(id),
    question_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_id UUID NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'fill_blank', 'essay', 'matching')),
    content TEXT NOT NULL,
    options JSONB,                        -- [{label, text, isCorrect}]
    correct_answer TEXT,
    explanation TEXT,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    points DECIMAL(4,1) DEFAULT 1.0,
    tags VARCHAR(255)[] DEFAULT '{}',
    media_urls VARCHAR(500)[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 25. EXAMS (Bài thi)
-- =============================================
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    class_ids UUID[] DEFAULT '{}',
    type VARCHAR(30) NOT NULL CHECK (type IN ('quiz', 'midterm', 'final', 'practice', 'placement')),
    duration_minutes INTEGER NOT NULL,
    total_points DECIMAL(6,1),
    question_ids UUID[] DEFAULT '{}',
    shuffle_questions BOOLEAN DEFAULT false,
    shuffle_options BOOLEAN DEFAULT false,
    show_result_after BOOLEAN DEFAULT true,
    max_attempts INTEGER DEFAULT 1,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    password VARCHAR(100),
    anti_cheat_enabled BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'closed', 'archived')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE exam_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    answers JSONB DEFAULT '{}',           -- {questionId: {answer, isCorrect, points}}
    total_score DECIMAL(6,1),
    is_auto_graded BOOLEAN DEFAULT false,
    tab_switch_count INTEGER DEFAULT 0,
    ip_address VARCHAR(50),
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'flagged')),
    grade_notes TEXT,
    graded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 26. ASSIGNMENTS (Bài tập)
-- =============================================
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    teacher_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(30) DEFAULT 'homework' CHECK (type IN ('homework', 'project', 'lab', 'essay', 'presentation')),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_score DECIMAL(5,1) DEFAULT 10,
    attachment_urls VARCHAR(500)[] DEFAULT '{}',
    allow_late_submission BOOLEAN DEFAULT false,
    late_penalty_percent INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    content TEXT,
    attachment_urls VARCHAR(500)[] DEFAULT '{}',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_late BOOLEAN DEFAULT false,
    score DECIMAL(5,1),
    feedback TEXT,
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned', 'resubmitted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- =============================================
-- 27. ASSETS (Tài sản)
-- =============================================
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    asset_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('furniture', 'electronics', 'lab_equipment', 'sports', 'vehicle', 'other')),
    location VARCHAR(100),
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    current_value DECIMAL(12,2),
    depreciation_rate DECIMAL(5,2),       -- % / năm
    condition VARCHAR(30) DEFAULT 'good' CHECK (condition IN ('new', 'good', 'fair', 'poor', 'broken', 'disposed')),
    serial_number VARCHAR(100),
    warranty_expires DATE,
    assigned_to VARCHAR(255),             -- Phòng/bộ phận
    photo_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, asset_code)
);

-- =============================================
-- 28. ROOMS (Phòng học)
-- =============================================
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('classroom', 'lab', 'library', 'gym', 'auditorium', 'office', 'storage', 'other')),
    building VARCHAR(100),
    floor INTEGER,
    capacity INTEGER,
    equipment JSONB DEFAULT '[]',         -- [{name, quantity}]
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, name)
);

-- =============================================
-- 29. MAINTENANCE REQUESTS (Yêu cầu bảo trì)
-- =============================================
CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id),
    room_id UUID REFERENCES rooms(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
    requested_by UUID NOT NULL REFERENCES users(id),
    assigned_to VARCHAR(255),
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 30. DISCIPLINE RECORDS (Kỷ luật)
-- =============================================
CREATE TABLE discipline_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    reported_by UUID NOT NULL REFERENCES users(id),
    type VARCHAR(30) NOT NULL CHECK (type IN ('warning', 'minor', 'major', 'severe')),
    description TEXT NOT NULL,
    incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
    action_taken TEXT,
    merit_points INTEGER DEFAULT 0,      -- Positive/negative points
    parent_notified BOOLEAN DEFAULT false,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'appealed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 31. AWARDS (Khen thưởng)
-- =============================================
CREATE TABLE awards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('academic', 'sports', 'arts', 'behavior', 'community', 'special')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    awarded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    academic_year_id UUID REFERENCES academic_years(id),
    certificate_url VARCHAR(500),
    awarded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 32. AUDIT LOGS (Nhật ký bảo mật)
-- =============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,      -- auth.login, data.export, etc.
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(100),
    resource_id VARCHAR(100),
    ip_address VARCHAR(50),
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    previous_hash VARCHAR(128) NOT NULL,  -- Hash-chain for tamper detection
    hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 33. SSO PROVIDERS
-- =============================================
CREATE TABLE sso_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'microsoft', 'apple', 'saml')),
    display_name VARCHAR(100) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    client_secret_encrypted BYTEA NOT NULL,  -- PQC-encrypted
    metadata_url VARCHAR(500),
    callback_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, provider)
);

-- =============================================
-- 34. BUDGETS (Ngân sách)
-- =============================================
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    total_amount DECIMAL(14,2) NOT NULL,
    spent_amount DECIMAL(14,2) DEFAULT 0,
    remaining_amount DECIMAL(14,2),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'active', 'closed')),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 35. JOURNAL ENTRIES (Bút toán kế toán)
-- =============================================
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    debit_account VARCHAR(50) NOT NULL,
    credit_account VARCHAR(50) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    reference_type VARCHAR(50),          -- payment, invoice, payroll, manual
    reference_id UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, entry_number)
);

-- =============================================
-- 36. SCHOLARSHIPS (Học bổng)
-- =============================================
CREATE TABLE scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('merit', 'need_based', 'sports', 'arts', 'sibling', 'staff', 'full')),
    discount_percent DECIMAL(5,2),
    discount_amount DECIMAL(12,2),
    academic_year_id UUID REFERENCES academic_years(id),
    student_id UUID REFERENCES students(id),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    criteria JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 37. LEARNING RESOURCES (Học liệu)
-- =============================================
CREATE TABLE resource_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES resource_categories(id),
    subject_id UUID REFERENCES subjects(id),
    grade_level INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE learning_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL CHECK (type IN ('document', 'video', 'audio', 'interactive', 'flashcard', 'link')),
    category_id UUID REFERENCES resource_categories(id),
    subject_id UUID REFERENCES subjects(id),
    grade_level INTEGER,
    file_url VARCHAR(500),
    file_size BIGINT,
    mime_type VARCHAR(100),
    thumbnail_url VARCHAR(500),
    tags VARCHAR(255)[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    uploaded_by UUID REFERENCES users(id),
    shared_with_classes UUID[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 38. WORKFLOWS (Quy trình phê duyệt)
-- =============================================
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('leave_request', 'expense', 'document', 'grade_change', 'enrollment', 'custom')),
    description TEXT,
    steps JSONB NOT NULL DEFAULT '[]',     -- [{order, role, action, auto_approve_after_days}]
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id),
    current_step INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    data JSONB NOT NULL DEFAULT '{}',      -- Request payload
    approvals JSONB DEFAULT '[]',          -- [{step, approver_id, action, comment, timestamp}]
    digital_signature TEXT,                -- ML-DSA signed approval chain
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 39. WEBHOOKS
-- =============================================
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    events VARCHAR(100)[] NOT NULL,        -- ['student.created', 'payment.completed', ...]
    secret_encrypted BYTEA NOT NULL,       -- PQC-encrypted webhook signing secret
    is_active BOOLEAN DEFAULT true,
    retry_count INTEGER DEFAULT 3,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES (All tables)

-- =============================================

-- Multi-tenancy: mọi query đều filter theo school_id
CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_users_email ON users(school_id, email);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_class ON students(current_class_id);
CREATE INDEX idx_students_code ON students(school_id, student_code);
CREATE INDEX idx_teachers_school ON teachers(school_id);
CREATE INDEX idx_classes_school ON classes(school_id, academic_year_id);
CREATE INDEX idx_attendance_session ON attendance_sessions(class_id, session_date);
CREATE INDEX idx_attendance_records ON attendance_records(session_id);
CREATE INDEX idx_scores_student ON scores(student_id, subject_id, academic_year_id);
CREATE INDEX idx_scores_class ON scores(class_id, subject_id, semester);
CREATE INDEX idx_invoices_student ON invoices(student_id, status);
CREATE INDEX idx_invoices_school ON invoices(school_id, status);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_school ON notifications(school_id, created_at DESC);
CREATE INDEX idx_leave_requests_student ON leave_requests(student_id, status);

-- New indexes for Phase 2 tables
CREATE INDEX idx_timetable_class ON timetable_slots(class_id, day_of_week);
CREATE INDEX idx_timetable_teacher ON timetable_slots(teacher_id);
CREATE INDEX idx_events_school ON events(school_id, start_date);
CREATE INDEX idx_room_bookings_school ON room_bookings(school_id, start_time);
CREATE INDEX idx_timekeeping_user ON timekeeping(user_id, date);
CREATE INDEX idx_payroll_user ON payroll(user_id, year, month);
CREATE INDEX idx_contracts_user ON contracts(user_id, status);
CREATE INDEX idx_enrollment_school ON enrollment_applications(school_id, status);
CREATE INDEX idx_crm_leads_school ON crm_leads(school_id, status);
CREATE INDEX idx_questions_bank ON questions(bank_id);
CREATE INDEX idx_exams_school ON exams(school_id, status);
CREATE INDEX idx_exam_attempts ON exam_attempts(exam_id, student_id);
CREATE INDEX idx_assignments_class ON assignments(class_id, due_date);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id, student_id);
CREATE INDEX idx_assets_school ON assets(school_id, category);
CREATE INDEX idx_rooms_school ON rooms(school_id);
CREATE INDEX idx_maintenance_school ON maintenance_requests(school_id, status);

-- Phase 3 indexes
CREATE INDEX idx_discipline_student ON discipline_records(student_id, incident_date);
CREATE INDEX idx_discipline_school ON discipline_records(school_id, type);
CREATE INDEX idx_awards_student ON awards(student_id, type);
CREATE INDEX idx_awards_school ON awards(school_id, awarded_date);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_event ON audit_logs(event_type, created_at DESC);
CREATE INDEX idx_audit_logs_school ON audit_logs(school_id, created_at DESC);
CREATE INDEX idx_sso_providers_school ON sso_providers(school_id, provider);
CREATE INDEX idx_budgets_school ON budgets(school_id, academic_year_id);
CREATE INDEX idx_journal_entries_school ON journal_entries(school_id, entry_date);
CREATE INDEX idx_scholarships_student ON scholarships(student_id, status);
CREATE INDEX idx_scholarships_school ON scholarships(school_id, academic_year_id);
CREATE INDEX idx_resource_categories_school ON resource_categories(school_id);
CREATE INDEX idx_learning_resources_school ON learning_resources(school_id, subject_id);
CREATE INDEX idx_learning_resources_type ON learning_resources(type, grade_level);
CREATE INDEX idx_workflows_school ON workflows(school_id, type);
CREATE INDEX idx_approval_requests_workflow ON approval_requests(workflow_id, status);
CREATE INDEX idx_approval_requests_school ON approval_requests(school_id, created_at DESC);
CREATE INDEX idx_webhooks_school ON webhooks(school_id, is_active);

-- =============================================
-- ROW LEVEL SECURITY (Multi-tenancy)
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE timekeeping ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Mỗi tenant chỉ thấy data của mình
CREATE POLICY tenant_isolation_users ON users
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_students ON students
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_teachers ON teachers
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_classes ON classes
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_scores ON scores
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_invoices ON invoices
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_notifications ON notifications
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_timetable ON timetable_slots
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_events ON events
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_room_bookings ON room_bookings
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_timekeeping ON timekeeping
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_payroll ON payroll
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_contracts ON contracts
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_enrollment ON enrollment_applications
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_crm ON crm_leads
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_exams ON exams
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_assignments ON assignments
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_assets ON assets
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_rooms ON rooms
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_maintenance ON maintenance_requests
    USING (school_id = current_setting('app.current_school_id')::UUID);

CREATE POLICY tenant_isolation_discipline ON discipline_records
    USING (school_id = current_setting('app.current_school_id')::UUID);
CREATE POLICY tenant_isolation_awards ON awards
    USING (school_id = current_setting('app.current_school_id')::UUID);
CREATE POLICY tenant_isolation_audit ON audit_logs
    USING (school_id = current_setting('app.current_school_id')::UUID);
CREATE POLICY tenant_isolation_sso ON sso_providers
    USING (school_id = current_setting('app.current_school_id')::UUID);
CREATE POLICY tenant_isolation_budgets ON budgets
    USING (school_id = current_setting('app.current_school_id')::UUID);
CREATE POLICY tenant_isolation_journal ON journal_entries
    USING (school_id = current_setting('app.current_school_id')::UUID);
CREATE POLICY tenant_isolation_scholarships ON scholarships
    USING (school_id = current_setting('app.current_school_id')::UUID);
CREATE POLICY tenant_isolation_resource_cat ON resource_categories
    USING (school_id = current_setting('app.current_school_id')::UUID);
CREATE POLICY tenant_isolation_resources ON learning_resources
    USING (school_id = current_setting('app.current_school_id')::UUID);
CREATE POLICY tenant_isolation_workflows ON workflows
    USING (school_id = current_setting('app.current_school_id')::UUID);
CREATE POLICY tenant_isolation_approvals ON approval_requests
    USING (school_id = current_setting('app.current_school_id')::UUID);
CREATE POLICY tenant_isolation_webhooks ON webhooks
    USING (school_id = current_setting('app.current_school_id')::UUID);

-- =============================================
-- TRIGGERS: Auto update updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_scores_updated_at BEFORE UPDATE ON scores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payroll_updated_at BEFORE UPDATE ON payroll FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_enrollment_updated_at BEFORE UPDATE ON enrollment_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_crm_leads_updated_at BEFORE UPDATE ON crm_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_maintenance_updated_at BEFORE UPDATE ON maintenance_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_discipline_updated_at BEFORE UPDATE ON discipline_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sso_updated_at BEFORE UPDATE ON sso_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_scholarships_updated_at BEFORE UPDATE ON scholarships FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_resources_updated_at BEFORE UPDATE ON learning_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_approvals_updated_at BEFORE UPDATE ON approval_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
