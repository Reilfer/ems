-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "logo_url" VARCHAR(500),
    "subscription_plan" VARCHAR(50) NOT NULL DEFAULT 'free',
    "subscription_expires_at" TIMESTAMP(3),
    "max_students" INTEGER NOT NULL DEFAULT 100,
    "max_teachers" INTEGER NOT NULL DEFAULT 20,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "avatar_url" VARCHAR(500),
    "role" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "last_login" TIMESTAMP(3),
    "password_changed_at" TIMESTAMP(3),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_levels" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "level" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "grade_level_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "homeroom_teacher_id" TEXT,
    "max_students" INTEGER NOT NULL DEFAULT 45,
    "room" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "user_id" TEXT,
    "student_code" VARCHAR(50) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE,
    "gender" VARCHAR(10),
    "address" TEXT,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "avatar_url" VARCHAR(500),
    "current_class_id" TEXT,
    "enrollment_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "parent_ids" TEXT[],
    "medical_notes" TEXT,
    "face_encoding" BYTEA,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "teacher_code" VARCHAR(50) NOT NULL,
    "specialization" VARCHAR(255),
    "qualification" VARCHAR(255),
    "hire_date" DATE,
    "department" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "grade_level_id" TEXT,
    "credits" DECIMAL(3,1) NOT NULL DEFAULT 1.0,
    "subject_type" VARCHAR(50) NOT NULL DEFAULT 'required',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "session_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" INTEGER,
    "subject_id" TEXT,
    "type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "check_in_time" TIMESTAMP(3),
    "note" TEXT,
    "marked_by" TEXT,
    "method" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "confidence" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scores" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "score_type" VARCHAR(50) NOT NULL,
    "score" DECIMAL(4,2) NOT NULL,
    "weight" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "graded_by" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "semester" INTEGER,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "final_amount" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "due_date" DATE NOT NULL,
    "issued_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_date" DATE,
    "description" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" VARCHAR(20) NOT NULL,
    "transaction_id" VARCHAR(255),
    "gateway_response" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "sender_id" TEXT,
    "recipient_id" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "channels" TEXT[] DEFAULT ARRAY['in_app']::TEXT[],
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "attachment_url" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_code_key" ON "schools"("code");

-- CreateIndex
CREATE INDEX "users_school_id_idx" ON "users"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_school_id_email_key" ON "users"("school_id", "email");

-- CreateIndex
CREATE INDEX "classes_school_id_academic_year_id_idx" ON "classes"("school_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "students_school_id_idx" ON "students"("school_id");

-- CreateIndex
CREATE INDEX "students_current_class_id_idx" ON "students"("current_class_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_school_id_student_code_key" ON "students"("school_id", "student_code");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- CreateIndex
CREATE INDEX "teachers_school_id_idx" ON "teachers"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_school_id_teacher_code_key" ON "teachers"("school_id", "teacher_code");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_school_id_code_key" ON "subjects"("school_id", "code");

-- CreateIndex
CREATE INDEX "attendance_sessions_class_id_session_date_idx" ON "attendance_sessions"("class_id", "session_date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sessions_class_id_session_date_period_key" ON "attendance_sessions"("class_id", "session_date", "period");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_session_id_student_id_key" ON "attendance_records"("session_id", "student_id");

-- CreateIndex
CREATE INDEX "scores_student_id_subject_id_academic_year_id_idx" ON "scores"("student_id", "subject_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "scores_class_id_subject_id_semester_idx" ON "scores"("class_id", "subject_id", "semester");

-- CreateIndex
CREATE INDEX "invoices_student_id_status_idx" ON "invoices"("student_id", "status");

-- CreateIndex
CREATE INDEX "invoices_school_id_status_idx" ON "invoices"("school_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_school_id_invoice_number_key" ON "invoices"("school_id", "invoice_number");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_is_read_idx" ON "notifications"("recipient_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_school_id_idx" ON "notifications"("school_id");

-- CreateIndex
CREATE INDEX "leave_requests_student_id_status_idx" ON "leave_requests"("student_id", "status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_levels" ADD CONSTRAINT "grade_levels_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_grade_level_id_fkey" FOREIGN KEY ("grade_level_id") REFERENCES "grade_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_current_class_id_fkey" FOREIGN KEY ("current_class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_grade_level_id_fkey" FOREIGN KEY ("grade_level_id") REFERENCES "grade_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
