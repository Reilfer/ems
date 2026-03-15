import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExamDto, SubmitAttemptDto } from './exams.dto';

export interface ExamRecord {
    id: string; schoolId: string; title: string; subjectName: string;
    duration: number; totalPoints: number; questionIds: string[];
    status: string; startTime: string | null; endTime: string | null;
    createdAt: string; updatedAt: string;
}

export interface AttemptRecord {
    id: string; examId: string; studentId: string; studentName: string;
    answers: Record<string, string>; score: number | null;
    autoGraded: boolean; startedAt: string; submittedAt: string | null;
}

const demoExams: ExamRecord[] = [
    { id: 'e1', schoolId: 'school1', title: 'Kiểm tra giữa kỳ Toán 10', subjectName: 'Toán', duration: 90, totalPoints: 10, questionIds: ['q1', 'q2', 'q3', 'q4', 'q5'], status: 'PUBLISHED', startTime: '2026-02-15T08:00:00Z', endTime: '2026-02-15T09:30:00Z', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
    { id: 'e2', schoolId: 'school1', title: 'Kiểm tra 15p Văn 10', subjectName: 'Ngữ văn', duration: 15, totalPoints: 10, questionIds: ['q7', 'q8'], status: 'DRAFT', startTime: null, endTime: null, createdAt: '2026-02-05T00:00:00Z', updatedAt: '2026-02-05T00:00:00Z' },
    { id: 'e3', schoolId: 'school1', title: 'English Test - Unit 5-8', subjectName: 'Tiếng Anh', duration: 45, totalPoints: 10, questionIds: ['q9', 'q10', 'q11', 'q12'], status: 'PUBLISHED', startTime: '2026-02-20T14:00:00Z', endTime: '2026-02-20T14:45:00Z', createdAt: '2026-02-08T00:00:00Z', updatedAt: '2026-02-08T00:00:00Z' },
];

const demoAttempts: AttemptRecord[] = [
    { id: 'att1', examId: 'e1', studentId: 's1', studentName: 'Trần Văn An', answers: { q1: '6x + 2', q2: 'x = 2, x = 3', q5: 'Đúng' }, score: 3, autoGraded: true, startedAt: '2026-02-15T08:00:00Z', submittedAt: '2026-02-15T09:10:00Z' },
    { id: 'att2', examId: 'e1', studentId: 's2', studentName: 'Lê Thị Bình', answers: { q1: '6x + 2', q2: 'x = -2, x = -3', q5: 'Đúng' }, score: 2, autoGraded: true, startedAt: '2026-02-15T08:00:00Z', submittedAt: '2026-02-15T09:25:00Z' },
];

const answerKey: Record<string, string> = {
    q1: '6x + 2', q2: 'x = 2, x = 3', q3: '1', q5: 'Đúng',
    q7: 'Quang Dũng', q8: 'Tiểu thuyết', q9: 'goes', q10: 'joyful', q11: 'I love Vietnam',
};
const pointsKey: Record<string, number> = {
    q1: 1, q2: 1, q3: 2, q4: 5, q5: 1, q6: 5, q7: 1, q8: 1, q9: 1, q10: 1, q11: 2, q12: 5,
};

let examCounter = demoExams.length;
let attemptCounter = demoAttempts.length;

@Injectable()
export class ExamsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters: { status?: string; search?: string } = {}) {
        let result = [...demoExams];
        if (filters.status) result = result.filter(e => e.status === filters.status);
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(e => e.title.toLowerCase().includes(q) || e.subjectName.toLowerCase().includes(q));
        }
        return { data: result, meta: { total: result.length } };
    }

    async findById(id: string) {
        const exam = demoExams.find(e => e.id === id);
        if (!exam) throw new NotFoundException('Không tìm thấy đề thi');
        const attempts = demoAttempts.filter(a => a.examId === id);
        return { ...exam, attempts, attemptCount: attempts.length };
    }

    async create(dto: CreateExamDto) {
        examCounter++;
        const exam: ExamRecord = {
            id: `e${examCounter}`, schoolId: dto.schoolId, title: dto.title,
            subjectName: dto.subjectName || '', duration: dto.duration,
            totalPoints: dto.totalPoints, questionIds: dto.questionIds || [],
            status: 'DRAFT', startTime: dto.startTime || null, endTime: dto.endTime || null,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        demoExams.push(exam);
        return exam;
    }

    async publish(id: string) {
        const exam = demoExams.find(e => e.id === id);
        if (!exam) throw new NotFoundException('Không tìm thấy đề thi');
        exam.status = 'PUBLISHED';
        exam.updatedAt = new Date().toISOString();
        return exam;
    }

    async submitAttempt(dto: SubmitAttemptDto) {
        const exam = demoExams.find(e => e.id === dto.examId);
        if (!exam) throw new NotFoundException('Không tìm thấy đề thi');
        if (exam.status !== 'PUBLISHED') throw new BadRequestException('Đề thi chưa được published');

        let autoScore = 0;
        let gradedCount = 0;
        for (const [qId, answer] of Object.entries(dto.answers)) {
            if (answerKey[qId]) {
                gradedCount++;
                if (answer.trim().toLowerCase() === answerKey[qId].toLowerCase()) {
                    autoScore += pointsKey[qId] || 1;
                }
            }
        }

        attemptCounter++;
        const attempt: AttemptRecord = {
            id: `att${attemptCounter}`, examId: dto.examId, studentId: dto.studentId,
            studentName: dto.studentName || 'Unknown', answers: dto.answers,
            score: autoScore, autoGraded: gradedCount > 0,
            startedAt: new Date().toISOString(), submittedAt: new Date().toISOString(),
        };
        demoAttempts.push(attempt);
        return { ...attempt, totalQuestions: exam.questionIds.length, autoGradedQuestions: gradedCount };
    }

    async getAttempts(examId: string) {
        return demoAttempts.filter(a => a.examId === examId);
    }

    async getStats() {
        return {
            totalExams: demoExams.length,
            published: demoExams.filter(e => e.status === 'PUBLISHED').length,
            draft: demoExams.filter(e => e.status === 'DRAFT').length,
            totalAttempts: demoAttempts.length,
            avgScore: demoAttempts.length > 0
                ? Math.round(demoAttempts.reduce((s, a) => s + (a.score || 0), 0) / demoAttempts.length * 10) / 10
                : 0,
        };
    }
}
