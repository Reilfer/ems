import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssignmentDto, UpdateAssignmentDto, SubmitAssignmentDto, GradeSubmissionDto } from './assignments.dto';

export interface AssignRecord {
    id: string; schoolId: string; classId: string; className: string;
    subjectId: string; subjectName: string; title: string; description: string;
    type: string; dueDate: string; maxScore: number; status: string;
    submissionCount: number; gradedCount: number;
    createdAt: string; updatedAt: string;
}

export interface SubRecord {
    id: string; assignmentId: string; studentId: string; studentName: string;
    content: string; score: number | null; feedback: string | null;
    status: string; submittedAt: string; gradedAt: string | null;
}

const demoAssignments: AssignRecord[] = [
    { id: 'a1', schoolId: 'school1', classId: 'c1', className: '10A1', subjectId: 'sub1', subjectName: 'Toán', title: 'Bài tập đạo hàm', description: 'Làm bài 1-10 trang 45 SGK', type: 'homework', dueDate: '2026-02-20', maxScore: 10, status: 'ACTIVE', submissionCount: 3, gradedCount: 1, createdAt: '2026-02-10T00:00:00Z', updatedAt: '2026-02-10T00:00:00Z' },
    { id: 'a2', schoolId: 'school1', classId: 'c1', className: '10A1', subjectId: 'sub2', subjectName: 'Ngữ văn', title: 'Phân tích bài thơ Tây Tiến', description: 'Viết bài phân tích 500-800 chữ', type: 'homework', dueDate: '2026-02-22', maxScore: 10, status: 'ACTIVE', submissionCount: 2, gradedCount: 0, createdAt: '2026-02-11T00:00:00Z', updatedAt: '2026-02-11T00:00:00Z' },
    { id: 'a3', schoolId: 'school1', classId: 'c2', className: '10A2', subjectId: 'sub3', subjectName: 'Tiếng Anh', title: 'Write essay about environment', description: 'Write 200-300 words about environmental protection', type: 'project', dueDate: '2026-02-25', maxScore: 10, status: 'ACTIVE', submissionCount: 1, gradedCount: 0, createdAt: '2026-02-12T00:00:00Z', updatedAt: '2026-02-12T00:00:00Z' },
    { id: 'a4', schoolId: 'school1', classId: 'c1', className: '10A1', subjectId: 'sub4', subjectName: 'Vật lý', title: 'Thí nghiệm đo gia tốc', description: 'Làm báo cáo thí nghiệm theo mẫu', type: 'lab', dueDate: '2026-02-18', maxScore: 10, status: 'CLOSED', submissionCount: 4, gradedCount: 4, createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-18T00:00:00Z' },
];

const demoSubmissions: SubRecord[] = [
    { id: 'sub1', assignmentId: 'a1', studentId: 's1', studentName: 'Trần Văn An', content: 'Bài giải: 1) f\'(x) = 6x + 2...', score: 8.5, feedback: 'Tốt, bài 5 sai cách giải', status: 'GRADED', submittedAt: '2026-02-15T10:00:00Z', gradedAt: '2026-02-16T08:00:00Z' },
    { id: 'sub2', assignmentId: 'a1', studentId: 's2', studentName: 'Lê Thị Bình', content: 'Bài làm: ...', score: null, feedback: null, status: 'SUBMITTED', submittedAt: '2026-02-16T14:00:00Z', gradedAt: null },
    { id: 'sub3', assignmentId: 'a1', studentId: 's3', studentName: 'Phạm Minh Châu', content: 'Bài giải: ...', score: null, feedback: null, status: 'SUBMITTED', submittedAt: '2026-02-17T09:00:00Z', gradedAt: null },
    { id: 'sub4', assignmentId: 'a2', studentId: 's1', studentName: 'Trần Văn An', content: 'Bài phân tích Tây Tiến...', score: null, feedback: null, status: 'SUBMITTED', submittedAt: '2026-02-18T20:00:00Z', gradedAt: null },
    { id: 'sub5', assignmentId: 'a2', studentId: 's4', studentName: 'Hoàng Đức Dũng', content: 'Phân tích...', score: null, feedback: null, status: 'SUBMITTED', submittedAt: '2026-02-19T15:00:00Z', gradedAt: null },
    { id: 'sub6', assignmentId: 'a3', studentId: 's5', studentName: 'Ngô Thùy Em', content: 'Environmental protection is...', score: null, feedback: null, status: 'SUBMITTED', submittedAt: '2026-02-20T11:00:00Z', gradedAt: null },
];
let assignCounter = demoAssignments.length;
let subCounter = demoSubmissions.length;

@Injectable()
export class AssignmentsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters: { classId?: string; subjectId?: string; status?: string; search?: string } = {}) {
        let result = [...demoAssignments];
        if (filters.classId) result = result.filter(a => a.classId === filters.classId);
        if (filters.subjectId) result = result.filter(a => a.subjectId === filters.subjectId);
        if (filters.status) result = result.filter(a => a.status === filters.status);
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(a => a.title.toLowerCase().includes(q) || a.subjectName.toLowerCase().includes(q));
        }
        return { data: result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), meta: { total: result.length } };
    }

    async findById(id: string) {
        const assign = demoAssignments.find(a => a.id === id);
        if (!assign) throw new NotFoundException('Không tìm thấy bài tập');
        const submissions = demoSubmissions.filter(s => s.assignmentId === id);
        return { ...assign, submissions };
    }

    async create(dto: CreateAssignmentDto) {
        assignCounter++;
        const assign: AssignRecord = {
            id: `a${assignCounter}`, schoolId: dto.schoolId,
            classId: dto.classId, className: 'Class',
            subjectId: dto.subjectId, subjectName: 'Subject',
            title: dto.title, description: dto.description || '',
            type: dto.type || 'homework', dueDate: dto.dueDate,
            maxScore: dto.maxScore || 10, status: 'ACTIVE',
            submissionCount: 0, gradedCount: 0,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        demoAssignments.push(assign);
        return assign;
    }

    async update(id: string, dto: UpdateAssignmentDto) {
        const idx = demoAssignments.findIndex(a => a.id === id);
        if (idx === -1) throw new NotFoundException('Không tìm thấy bài tập');
        demoAssignments[idx] = { ...demoAssignments[idx], ...dto, updatedAt: new Date().toISOString() } as any;
        return demoAssignments[idx];
    }

    async submit(dto: SubmitAssignmentDto) {
        const assign = demoAssignments.find(a => a.id === dto.assignmentId);
        if (!assign) throw new NotFoundException('Không tìm thấy bài tập');
        if (assign.status !== 'ACTIVE') throw new BadRequestException('Bài tập đã đóng');

        const existing = demoSubmissions.find(s => s.assignmentId === dto.assignmentId && s.studentId === dto.studentId);
        if (existing) {
            existing.content = dto.content || existing.content;
            existing.submittedAt = new Date().toISOString();
            existing.status = 'SUBMITTED';
            return existing;
        }

        subCounter++;
        const sub: SubRecord = {
            id: `sub${subCounter}`, assignmentId: dto.assignmentId,
            studentId: dto.studentId, studentName: dto.studentName || 'Student',
            content: dto.content || '', score: null, feedback: null,
            status: 'SUBMITTED', submittedAt: new Date().toISOString(), gradedAt: null,
        };
        demoSubmissions.push(sub);
        assign.submissionCount++;
        return sub;
    }

    async grade(submissionId: string, dto: GradeSubmissionDto) {
        const sub = demoSubmissions.find(s => s.id === submissionId);
        if (!sub) throw new NotFoundException('Không tìm thấy bài nộp');
        sub.score = dto.score;
        sub.feedback = dto.feedback || null;
        sub.status = 'GRADED';
        sub.gradedAt = new Date().toISOString();

        const assign = demoAssignments.find(a => a.id === sub.assignmentId);
        if (assign) assign.gradedCount++;
        return sub;
    }

    async getSubmissions(assignmentId: string) {
        return demoSubmissions.filter(s => s.assignmentId === assignmentId);
    }

    async getStats() {
        const total = demoAssignments.length;
        const active = demoAssignments.filter(a => a.status === 'ACTIVE').length;
        const totalSubs = demoSubmissions.length;
        const graded = demoSubmissions.filter(s => s.status === 'GRADED').length;
        const avgScore = graded > 0
            ? Math.round(demoSubmissions.filter(s => s.score !== null).reduce((s, sub) => s + (sub.score || 0), 0) / graded * 10) / 10
            : 0;
        return { totalAssignments: total, active, totalSubmissions: totalSubs, graded, pending: totalSubs - graded, avgScore };
    }
}
