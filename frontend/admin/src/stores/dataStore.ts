import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
}

export interface Assignment {
    id: string;
    title: string;
    description: string;
    type: 'quiz' | 'essay';
    subject: string;
    className: string;
    dueDate: string;
    questions?: QuizQuestion[];
    answerKey?: string;
    useAiGrading: boolean;
    maxScore: number;
    status: 'draft' | 'published' | 'closed';
    createdAt: string;
    createdBy: string;
    submissionCount: number;
    gradedCount: number;
}

export interface Submission {
    id: string;
    assignmentId: string;
    studentId: string;
    studentName: string;
    quizAnswers?: number[];
    essayAnswer?: string;
    score: number | null;
    maxScore: number;
    feedback: string;
    gradedBy: 'ai' | 'teacher' | null;
    submittedAt: string;
    gradedAt: string | null;
}

export interface ScoreRow {
    key: string;
    studentCode: string;
    studentName: string;
    subject: string;
    oral: number | null;
    fifteenMin: number | null;
    fortyFiveMin: number | null;
    midterm: number | null;
    final: number | null;
    average: number | null;
}

export interface AttendanceRecord {
    id: string;
    studentCode: string;
    studentName: string;
    className: string;
    date: string;
    time: string;
    status: 'PRESENT' | 'LATE' | 'ABSENT';
    method: 'QR' | 'MANUAL' | 'OFFLINE_QR';
    synced: boolean;
}

export interface AttendanceSession {
    classId: string;
    className: string;
    active: boolean;
    sessionId: string | null;
    activatedAt: number | null;
    scannedStudents: string[];
}

export interface ScheduleEntry {
    id: string;
    day: string;
    period: number;
    className: string;
    teacherId: string;
    teacherName: string;
    subject: string;
    room: string;
}

export interface SchoolEvent {
    id: string;
    title: string;
    date: string;
    type: 'ACADEMIC' | 'HOLIDAY' | 'EXAM' | 'EVENT';
    description: string;
}

export interface AppNotification {
    id: string;
    title: string;
    content: string;
    date: string;
    type: 'school' | 'assignment' | 'grade' | 'finance' | 'attendance';
    icon: string;
}

interface DataStore {

    assignments: Assignment[];
    submissions: Submission[];
    grades: ScoreRow[];
    attendanceRecords: AttendanceRecord[];
    attendanceSessions: AttendanceSession[];
    scheduleEntries: ScheduleEntry[];
    schoolEvents: SchoolEvent[];
    notifications: AppNotification[];
    demoLoaded: boolean;

    addAssignment: (a: Assignment) => void;
    deleteAssignment: (id: string) => void;
    addSubmission: (s: Submission) => void;
    updateSubmission: (id: string, updates: Partial<Submission>) => void;

    setGrades: (grades: ScoreRow[]) => void;
    updateGrade: (key: string, subject: string, field: keyof ScoreRow, value: any) => void;

    addAttendanceRecord: (r: AttendanceRecord) => void;
    setAttendanceSessions: (sessions: AttendanceSession[]) => void;
    activateSession: (classId: string) => void;
    deactivateSession: (classId: string) => void;
    markStudentScanned: (classId: string, studentCode: string) => void;

    addScheduleEntry: (e: ScheduleEntry) => void;
    deleteScheduleEntry: (id: string) => void;

    addNotification: (n: AppNotification) => void;

    loadDemoData: () => void;
    clearAllData: () => void;
}

function calcAvg(row: Pick<ScoreRow, 'oral' | 'fifteenMin' | 'fortyFiveMin' | 'midterm' | 'final'>): number | null {
    const { oral, fifteenMin, fortyFiveMin, midterm, final: f } = row;
    let sum = 0, weight = 0;
    if (oral != null) { sum += oral * 1; weight += 1; }
    if (fifteenMin != null) { sum += fifteenMin * 1; weight += 1; }
    if (fortyFiveMin != null) { sum += fortyFiveMin * 2; weight += 2; }
    if (midterm != null) { sum += midterm * 2; weight += 2; }
    if (f != null) { sum += f * 3; weight += 3; }
    return weight > 0 ? Math.round((sum / weight) * 100) / 100 : null;
}

const DEMO_QUIZ_QUESTIONS: QuizQuestion[] = [
    { id: 'q1', question: 'Thủ đô của Việt Nam là gì?', options: ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Huế'], correctAnswer: 1 },
    { id: 'q2', question: '1 + 1 = ?', options: ['1', '2', '3', '4'], correctAnswer: 1 },
    { id: 'q3', question: 'Sông dài nhất Việt Nam?', options: ['Sông Hồng', 'Sông Mekong', 'Sông Đà', 'Sông Đồng Nai'], correctAnswer: 1 },
];

function makeDemoAssignments(): Assignment[] {
    return [
        {
            id: 'hw1', title: 'Kiểm tra Địa lý - Chương 3', description: 'Bài kiểm tra trắc nghiệm về địa lý Việt Nam',
            type: 'quiz', subject: 'Địa lý', className: '10A1', dueDate: '2026-02-25',
            questions: DEMO_QUIZ_QUESTIONS, useAiGrading: false, maxScore: 10,
            status: 'published', createdAt: '2026-02-18', createdBy: 'user-t-00000001', submissionCount: 2, gradedCount: 2,
        },
        {
            id: 'hw2', title: 'Viết văn nghị luận xã hội', description: 'Viết bài văn nghị luận về chủ đề "Vai trò của giáo dục"',
            type: 'essay', subject: 'Ngữ văn', className: '10A1', dueDate: '2026-02-28',
            answerKey: 'Bài văn cần đề cập: (1) Giáo dục giúp phát triển con người toàn diện, (2) Nâng cao dân trí xã hội, (3) Tạo cơ hội bình đẳng, (4) Kết luận với liên hệ bản thân',
            useAiGrading: true, maxScore: 10,
            status: 'published', createdAt: '2026-02-18', createdBy: 'user-t-00000001', submissionCount: 1, gradedCount: 0,
        },
        {
            id: 'hw3', title: 'Bài tập Toán - Phương trình bậc 2', description: 'Giải các phương trình bậc 2 theo delta',
            type: 'quiz', subject: 'Toán', className: '10A2', dueDate: '2026-03-01',
            questions: [
                { id: 'q1', question: 'x² - 5x + 6 = 0, nghiệm là?', options: ['x=2,3', 'x=1,6', 'x=-2,-3', 'Vô nghiệm'], correctAnswer: 0 },
                { id: 'q2', question: 'Δ = b² - 4ac, khi Δ < 0 thì?', options: ['2 nghiệm', '1 nghiệm kép', 'Vô nghiệm', 'Vô số nghiệm'], correctAnswer: 2 },
            ],
            useAiGrading: false, maxScore: 10,
            status: 'published', createdAt: '2026-02-19', createdBy: 'user-t-00000001', submissionCount: 0, gradedCount: 0,
        },
        {
            id: 'hw4', title: 'English Essay - My Future', description: 'Write 200 words about your future career plan',
            type: 'essay', subject: 'Tiếng Anh', className: '11A1', dueDate: '2026-03-05',
            answerKey: 'Must include: career choice, reasons, preparation plan, conclusion',
            useAiGrading: true, maxScore: 10,
            status: 'published', createdAt: '2026-02-20', createdBy: 'user-t-00000001', submissionCount: 0, gradedCount: 0,
        },
    ];
}

function makeDemoSubmissions(): Submission[] {
    return [
        { id: 's1', assignmentId: 'hw1', studentId: 'stud-00000001', studentName: 'Trần Văn An', quizAnswers: [1, 1, 1], score: 10, maxScore: 10, feedback: 'Xuất sắc! Đúng hết 3/3 câu', gradedBy: 'ai', submittedAt: '2026-02-19T08:00:00', gradedAt: '2026-02-19T08:00:00' },
        { id: 's2', assignmentId: 'hw1', studentId: 'stud-00000002', studentName: 'Lê Thị Bình', quizAnswers: [1, 1, 0], score: 6.7, maxScore: 10, feedback: 'Đúng 2/3 câu', gradedBy: 'ai', submittedAt: '2026-02-19T08:30:00', gradedAt: '2026-02-19T08:30:00' },
        { id: 's3', assignmentId: 'hw2', studentId: 'stud-00000002', studentName: 'Lê Thị Bình', essayAnswer: 'Giáo dục rất quan trọng với mỗi người. Nó giúp chúng ta phát triển toàn diện và có tương lai tốt đẹp hơn...', score: null, maxScore: 10, feedback: '', gradedBy: null, submittedAt: '2026-02-19T11:00:00', gradedAt: null },
    ];
}

function makeDemoGrades(): ScoreRow[] {
    const students = [
        { key: '1', studentCode: 'HS20250001', studentName: 'Trần Văn An' },
        { key: '2', studentCode: 'HS20250002', studentName: 'Lê Thị Bình' },
        { key: '3', studentCode: 'HS20250003', studentName: 'Phạm Minh Châu' },
        { key: '4', studentCode: 'HS20250004', studentName: 'Hoàng Đức Dũng' },
        { key: '5', studentCode: 'HS20250005', studentName: 'Ngô Thùy Em' },
    ];
    const subjects = ['Toán', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lý'];
    const rows: ScoreRow[] = [];
    for (const st of students) {
        for (const sub of subjects) {
            const oral = Math.round((5 + Math.random() * 5) * 2) / 2;
            const fifteenMin = Math.round((5 + Math.random() * 5) * 2) / 2;
            const fortyFiveMin = Math.round((5 + Math.random() * 5) * 2) / 2;
            const midterm = Math.round((4 + Math.random() * 6) * 2) / 2;
            const final_ = Math.round((5 + Math.random() * 5) * 2) / 2;
            const avg = calcAvg({ oral, fifteenMin, fortyFiveMin, midterm, final: final_ });
            rows.push({
                key: `${st.key}-${sub}`,
                studentCode: st.studentCode,
                studentName: st.studentName,
                subject: sub,
                oral, fifteenMin, fortyFiveMin, midterm, final: final_, average: avg,
            });
        }
    }
    return rows;
}

function makeDemoAttendance(): AttendanceRecord[] {
    const students = [
        { code: 'HS20250001', name: 'Trần Văn An', className: '10A1' },
        { code: 'HS20250002', name: 'Lê Thị Bình', className: '10A1' },
        { code: 'HS20250003', name: 'Phạm Minh Châu', className: '10A1' },
        { code: 'HS20250004', name: 'Hoàng Đức Dũng', className: '10A2' },
        { code: 'HS20250005', name: 'Ngô Thùy Em', className: '10A2' },
    ];
    const records: AttendanceRecord[] = [];
    const today = new Date();
    let id = 0;
    for (let d = 1; d <= 10; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        const dateStr = date.toISOString().slice(0, 10);
        for (const st of students) {
            id++;
            const rand = Math.random();
            let status: 'PRESENT' | 'LATE' | 'ABSENT' = 'PRESENT';
            if (rand > 0.92) status = 'ABSENT';
            else if (rand > 0.85) status = 'LATE';
            records.push({
                id: `att-${id}`, studentCode: st.code, studentName: st.name, className: st.className,
                date: dateStr, time: status === 'ABSENT' ? '' : `07:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}`,
                status, method: rand > 0.5 ? 'QR' : 'MANUAL', synced: true,
            });
        }
    }
    return records;
}

function makeDemoSchedule(): ScheduleEntry[] {
    return [
        { id: 's1', day: 'T2', period: 1, className: '10A1', teacherId: 't1', teacherName: 'Nguyễn Văn Tùng', subject: 'math', room: 'P.101' },
        { id: 's2', day: 'T2', period: 2, className: '10A1', teacherId: 't2', teacherName: 'Trần Thị Mai', subject: 'literature', room: 'P.101' },
        { id: 's3', day: 'T2', period: 3, className: '10A1', teacherId: 't3', teacherName: 'Lê Hồng Phúc', subject: 'english', room: 'P.101' },
        { id: 's4', day: 'T3', period: 1, className: '10A1', teacherId: 't5', teacherName: 'Vũ Thị Lan', subject: 'chemistry', room: 'Lab 1' },
        { id: 's5', day: 'T3', period: 2, className: '10A1', teacherId: 't1', teacherName: 'Nguyễn Văn Tùng', subject: 'math', room: 'P.101' },
        { id: 's6', day: 'T4', period: 1, className: '10A1', teacherId: 't4', teacherName: 'Phạm Văn Đức', subject: 'physics', room: 'Lab 2' },
        { id: 's7', day: 'T4', period: 2, className: '10A1', teacherId: 't6', teacherName: 'Hoàng Minh Tâm', subject: 'biology', room: 'P.101' },
        { id: 's8', day: 'T5', period: 1, className: '10A1', teacherId: 't1', teacherName: 'Nguyễn Văn Tùng', subject: 'math', room: 'P.101' },
        { id: 's9', day: 'T5', period: 3, className: '10A1', teacherId: 't2', teacherName: 'Trần Thị Mai', subject: 'literature', room: 'P.101' },
    ];
}

function makeDemoEvents(): SchoolEvent[] {
    return [
        { id: 'e1', title: 'Khai giảng năm học', date: '2025-09-05', type: 'ACADEMIC', description: 'Lễ khai giảng năm học 2025-2026' },
        { id: 'e2', title: 'Thi giữa kỳ 1', date: '2025-10-20', type: 'EXAM', description: 'Tuần thi giữa HK1' },
        { id: 'e3', title: 'Ngày Nhà giáo VN', date: '2025-11-20', type: 'HOLIDAY', description: 'Kỷ niệm ngày Nhà giáo Việt Nam' },
        { id: 'e4', title: 'Thi cuối kỳ 1', date: '2025-12-15', type: 'EXAM', description: 'Tuần thi cuối HK1' },
    ];
}

function makeDemoNotifications(): AppNotification[] {
    return [
        { id: 'n1', title: 'Thông báo lịch thi giữa kỳ HK2', content: 'Lịch thi giữa kỳ bắt đầu từ 10/03/2026.', date: '2026-02-18', type: 'school', icon: 'campaign' },
        { id: 'n2', title: 'Bài tập mới: Viết văn nghị luận xã hội', content: 'Hạn nộp: 28/02/2026.', date: '2026-02-18', type: 'assignment', icon: 'assignment' },
        { id: 'n3', title: 'Kết quả bài kiểm tra Địa lý', content: 'Bạn đạt 10/10 điểm.', date: '2026-02-19', type: 'grade', icon: 'emoji_events' },
    ];
}

export const useDataStore = create<DataStore>()(
    persist(
        (set) => ({
            assignments: [],
            submissions: [],
            grades: [],
            attendanceRecords: [],
            attendanceSessions: [
                { classId: '1', className: '10A1', active: false, sessionId: null, activatedAt: null, scannedStudents: [] },
                { classId: '2', className: '10A2', active: false, sessionId: null, activatedAt: null, scannedStudents: [] },
                { classId: '3', className: '11A1', active: false, sessionId: null, activatedAt: null, scannedStudents: [] },
            ],
            scheduleEntries: [],
            schoolEvents: [],
            notifications: [],
            demoLoaded: false,

            addAssignment: (a) => set(s => {
                const notif: AppNotification = {
                    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    title: `Bài tập mới: ${a.title}`,
                    content: `${a.subject} — ${a.className} — Hạn: ${dayjs(a.dueDate).format('DD/MM/YYYY')}`,
                    date: new Date().toISOString().slice(0, 10), type: 'assignment', icon: 'assignment',
                };
                return { assignments: [a, ...s.assignments], notifications: [notif, ...s.notifications] };
            }),
            deleteAssignment: (id) => set(s => ({
                assignments: s.assignments.filter(a => a.id !== id),
                submissions: s.submissions.filter(sub => sub.assignmentId !== id),
            })),
            addSubmission: (sub) => set(s => ({
                submissions: [...s.submissions, sub],
                assignments: s.assignments.map(a =>
                    a.id === sub.assignmentId ? { ...a, submissionCount: a.submissionCount + 1 } : a
                ),
            })),
            updateSubmission: (id, updates) => set(s => ({
                submissions: s.submissions.map(sub => sub.id === id ? { ...sub, ...updates } : sub),
                assignments: updates.score !== undefined ? s.assignments.map(a => {
                    const subs = s.submissions.filter(sub => sub.assignmentId === a.id);
                    const thisSub = subs.find(sub => sub.id === id);
                    if (!thisSub) return a;
                    return { ...a, gradedCount: subs.filter(sub => sub.id === id ? updates.score !== null : sub.score !== null).length };
                }) : s.assignments,
            })),

            setGrades: (grades) => set({ grades }),
            updateGrade: (key, subject, field, value) => set(s => ({
                grades: s.grades.map(g => {
                    if (g.key !== key || g.subject !== subject) return g;
                    const updated = { ...g, [field]: value };
                    updated.average = calcAvg(updated);
                    return updated;
                }),
            })),

            addAttendanceRecord: (r) => set(s => ({ attendanceRecords: [r, ...s.attendanceRecords] })),
            setAttendanceSessions: (sessions) => set({ attendanceSessions: sessions }),
            activateSession: (classId) => set(s => ({
                attendanceSessions: s.attendanceSessions.map(sess =>
                    sess.classId === classId
                        ? { ...sess, active: true, sessionId: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, activatedAt: Date.now(), scannedStudents: [] }
                        : sess
                ),
            })),
            deactivateSession: (classId) => set(s => ({
                attendanceSessions: s.attendanceSessions.map(sess =>
                    sess.classId === classId
                        ? { ...sess, active: false, sessionId: null, activatedAt: null, scannedStudents: [] }
                        : sess
                ),
            })),
            markStudentScanned: (classId, studentCode) => set(s => ({
                attendanceSessions: s.attendanceSessions.map(sess =>
                    sess.classId === classId
                        ? { ...sess, scannedStudents: [...new Set([...sess.scannedStudents, studentCode])] }
                        : sess
                ),
            })),

            addScheduleEntry: (e) => set(s => ({ scheduleEntries: [...s.scheduleEntries, e] })),
            deleteScheduleEntry: (id) => set(s => ({ scheduleEntries: s.scheduleEntries.filter(e => e.id !== id) })),

            addNotification: (n) => set(s => ({ notifications: [n, ...s.notifications] })),

            loadDemoData: () => set((s) => {
                if (s.demoLoaded) return {}; 
                return {
                    assignments: [...s.assignments, ...makeDemoAssignments()],
                    submissions: [...s.submissions, ...makeDemoSubmissions()],
                    grades: [...s.grades, ...makeDemoGrades()],
                    attendanceRecords: [...s.attendanceRecords, ...makeDemoAttendance()],
                    scheduleEntries: [...s.scheduleEntries, ...makeDemoSchedule()],
                    schoolEvents: [...s.schoolEvents, ...makeDemoEvents()],
                    notifications: [...s.notifications, ...makeDemoNotifications()],
                    demoLoaded: true,
                };
            }),
            clearAllData: () => set({
                assignments: [],
                submissions: [],
                grades: [],
                attendanceRecords: [],
                scheduleEntries: [],
                schoolEvents: [],
                notifications: [],
                demoLoaded: false,
                attendanceSessions: [
                    { classId: '1', className: '10A1', active: false, sessionId: null, activatedAt: null, scannedStudents: [] },
                    { classId: '2', className: '10A2', active: false, sessionId: null, activatedAt: null, scannedStudents: [] },
                    { classId: '3', className: '11A1', active: false, sessionId: null, activatedAt: null, scannedStudents: [] },
                ],
            }),
        }),
        {
            name: 'ems-demo-data',
            onRehydrateStorage: () => (state) => {

                if (state && !state.demoLoaded) {
                    state.loadDemoData();
                }
            },
        }
    )
);
