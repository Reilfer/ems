
export type UserRole = 'admin' | 'principal' | 'teacher' | 'parent' | 'student' | 'staff';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface JwtPayload {
    sub: string;
    schoolId: string;
    role: UserRole;
    email: string;
    iat?: number;
    exp?: number;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export type StudentStatus = 'active' | 'graduated' | 'transferred' | 'suspended' | 'expelled';
export type Gender = 'male' | 'female' | 'other';

export interface StudentBasic {
    id: string;
    studentCode: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: Gender;
    currentClassId?: string;
    status: StudentStatus;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type AttendanceMethod = 'manual' | 'face' | 'qr';

export interface AttendanceRecord {
    studentId: string;
    status: AttendanceStatus;
    checkInTime?: string;
    method: AttendanceMethod;
    confidence?: number;
}

export type ScoreType = 'mieng' | 'phut15' | 'tiet' | 'giuaki' | 'cuoiki';
export type Semester = 1 | 2;

export interface ScoreEntry {
    studentId: string;
    subjectId: string;
    scoreType: ScoreType;
    score: number;
    semester: Semester;
}

export type InvoiceStatus = 'draft' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'vnpay' | 'momo' | 'zalopay';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface InvoiceItem {
    name: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export type NotificationType = 'attendance' | 'grade' | 'fee' | 'announcement' | 'system';
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type EventType = 'exam' | 'holiday' | 'meeting' | 'activity' | 'sport' | 'other';
export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface TimetableSlot {
    classId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: DayOfWeek;
    period: number;
    room?: string;
    startTime?: string;
    endTime?: string;
}

export type TimekeepingMethod = 'manual' | 'face' | 'qr' | 'gps';
export type TimekeepingStatus = 'present' | 'absent' | 'late' | 'leave' | 'half_day';
export type PayrollStatus = 'draft' | 'calculated' | 'approved' | 'paid';
export type ContractType = 'probation' | 'fixed_term' | 'indefinite' | 'part_time';
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated';

export interface PayrollEntry {
    userId: string;
    month: number;
    year: number;
    baseSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
}

export type ApplicationStatus = 'submitted' | 'reviewing' | 'interview' | 'testing' | 'accepted' | 'rejected' | 'enrolled' | 'withdrawn';
export type LeadStatus = 'new' | 'contacted' | 'interested' | 'visiting' | 'applied' | 'enrolled' | 'lost';
export type LeadSource = 'website' | 'referral' | 'event' | 'social_media';

export interface EnrollmentApplication {
    studentFirstName: string;
    studentLastName: string;
    parentName: string;
    parentPhone: string;
    gradeLevelApplying: number;
    status: ApplicationStatus;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'essay' | 'matching';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ExamType = 'quiz' | 'midterm' | 'final' | 'practice' | 'placement';
export type ExamStatus = 'draft' | 'published' | 'active' | 'closed' | 'archived';
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded' | 'flagged';

export interface QuestionOption {
    label: string;
    text: string;
    isCorrect: boolean;
}

export interface ExamAnswer {
    questionId: string;
    answer: string | string[];
    isCorrect?: boolean;
    points?: number;
}

export type AssignmentType = 'homework' | 'project' | 'lab' | 'essay' | 'presentation';
export type AssignmentStatus = 'draft' | 'active' | 'closed' | 'archived';
export type SubmissionStatus = 'draft' | 'submitted' | 'graded' | 'returned' | 'resubmitted';

export interface AssignmentBasic {
    id: string;
    title: string;
    subjectId: string;
    classId: string;
    dueDate: string;
    type: AssignmentType;
    status: AssignmentStatus;
}

export type AssetCategory = 'furniture' | 'electronics' | 'lab_equipment' | 'sports' | 'vehicle' | 'other';
export type AssetCondition = 'new' | 'good' | 'fair' | 'poor' | 'broken' | 'disposed';
export type RoomType = 'classroom' | 'lab' | 'library' | 'gym' | 'auditorium' | 'office' | 'storage' | 'other';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface AssetBasic {
    id: string;
    assetCode: string;
    name: string;
    category: AssetCategory;
    condition: AssetCondition;
    location?: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';

export interface PlanLimits {
    maxStudents: number;
    maxTeachers: number;
    features: string[];
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
    free: { maxStudents: 50, maxTeachers: 5, features: ['attendance', 'grades'] },
    basic: { maxStudents: 200, maxTeachers: 20, features: ['attendance', 'grades', 'finance', 'notifications'] },
    premium: { maxStudents: 500, maxTeachers: 50, features: ['attendance', 'grades', 'finance', 'notifications', 'ai', 'analytics', 'exam', 'assignment'] },
    enterprise: { maxStudents: -1, maxTeachers: -1, features: ['*'] },
};
