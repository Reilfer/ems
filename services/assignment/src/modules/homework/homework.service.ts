import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHomeworkDto, SubmitQuizDto, SubmitEssayDto, GradeHomeworkDto } from './homework.dto';

export interface QuizQuestion {
    id: string;
    content: string;
    options: string[];
    correctIndex: number;
    points: number;
}

@Injectable()
export class HomeworkService {
    constructor(private prisma: PrismaService) {}

    private parseJson<T>(val: string | null | undefined, fallback: T): T {
        if (!val) return fallback;
        try { return JSON.parse(val); } catch { return fallback; }
    }

    async findAll(filters: { classId?: string; type?: string; status?: string; search?: string } = {}) {
        const where: any = {};
        if (filters.classId) where.classId = filters.classId;
        if (filters.type) where.type = filters.type;
        if (filters.status) where.status = filters.status;
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search } },
                { description: { contains: filters.search } },
            ];
        }

        const items = await this.prisma.homework.findMany({
            where,
            include: {
                class: { select: { name: true } },
                subject: { select: { name: true } },
                teacher: { select: { firstName: true, lastName: true } },
                _count: { select: { submissions: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const data = items.map(hw => {
            const gradedCount = 0; 
            return {
                id: hw.id,
                schoolId: hw.schoolId,
                classId: hw.classId,
                className: hw.class.name,
                subjectId: hw.subjectId,
                subjectName: hw.subject.name,
                teacherId: hw.teacherId,
                teacherName: `${hw.teacher.firstName} ${hw.teacher.lastName}`,
                title: hw.title,
                description: hw.description || '',
                type: hw.type as 'quiz' | 'essay',
                dueDate: hw.dueDate.toISOString(),
                maxScore: hw.maxScore,
                status: hw.status,
                questions: this.parseJson<QuizQuestion[]>(hw.questions, []),
                timeLimit: hw.timeLimit,
                essayPrompt: hw.essayPrompt,
                answerKey: hw.answerKey,
                gradingMode: hw.gradingMode,
                submissionCount: hw._count.submissions,
                gradedCount,
                createdAt: hw.createdAt.toISOString(),
            };
        });

        for (const item of data) {
            const graded = await this.prisma.homeworkSubmission.count({
                where: { homeworkId: item.id, status: { in: ['GRADED', 'AI_GRADED'] } },
            });
            item.gradedCount = graded;
        }

        return { data, meta: { total: data.length } };
    }

    async findById(id: string) {
        const hw = await this.prisma.homework.findUnique({
            where: { id },
            include: {
                class: { select: { name: true } },
                subject: { select: { name: true } },
                teacher: { select: { firstName: true, lastName: true } },
                submissions: {
                    include: {
                        student: { select: { firstName: true, lastName: true } },
                    },
                    orderBy: { submittedAt: 'desc' },
                },
            },
        });
        if (!hw) throw new NotFoundException('Không tìm thấy bài tập');

        const submissions = hw.submissions.map(s => ({
            id: s.id,
            homeworkId: s.homeworkId,
            studentId: s.studentId,
            studentName: `${s.student.firstName} ${s.student.lastName}`,
            type: s.type as 'quiz' | 'essay',
            quizAnswers: this.parseJson<Record<string, number>>(s.quizAnswers, {}),
            quizDetail: this.parseJson<any[]>(s.quizDetail, []),
            essayContent: s.essayContent,
            score: s.score,
            maxScore: s.maxScore,
            feedback: s.feedback,
            status: s.status,
            submittedAt: s.submittedAt.toISOString(),
            gradedAt: s.gradedAt?.toISOString() || null,
        }));

        return {
            id: hw.id,
            schoolId: hw.schoolId,
            classId: hw.classId,
            className: hw.class.name,
            subjectId: hw.subjectId,
            subjectName: hw.subject.name,
            teacherId: hw.teacherId,
            teacherName: `${hw.teacher.firstName} ${hw.teacher.lastName}`,
            title: hw.title,
            description: hw.description || '',
            type: hw.type as 'quiz' | 'essay',
            dueDate: hw.dueDate.toISOString(),
            maxScore: hw.maxScore,
            status: hw.status,
            questions: this.parseJson<QuizQuestion[]>(hw.questions, []),
            timeLimit: hw.timeLimit,
            essayPrompt: hw.essayPrompt,
            answerKey: hw.answerKey,
            gradingMode: hw.gradingMode,
            submissionCount: submissions.length,
            gradedCount: submissions.filter(s => s.status === 'GRADED' || s.status === 'AI_GRADED').length,
            createdAt: hw.createdAt.toISOString(),
            submissions,
        };
    }

    async create(dto: CreateHomeworkDto) {
        const maxScore = dto.type === 'quiz' && dto.questions
            ? dto.questions.reduce((sum, q) => sum + (q.points || 2), 0)
            : dto.maxScore || 10;

        const questions: QuizQuestion[] | undefined = dto.type === 'quiz' && dto.questions
            ? dto.questions.map((q, i) => ({
                id: `q${Date.now()}-${i}`,
                content: q.content,
                options: q.options,
                correctIndex: q.correctIndex,
                points: q.points || 2,
            }))
            : undefined;

        const hw = await this.prisma.homework.create({
            data: {
                schoolId: dto.schoolId,
                classId: dto.classId,
                subjectId: dto.subjectId,
                teacherId: dto.teacherId,
                title: dto.title,
                description: dto.description || '',
                type: dto.type,
                dueDate: new Date(dto.dueDate),
                maxScore,
                status: 'ACTIVE',
                questions: questions ? JSON.stringify(questions) : '[]',
                timeLimit: dto.timeLimit,
                essayPrompt: dto.essayPrompt,
                answerKey: dto.answerKey,
                gradingMode: dto.gradingMode || 'manual',
            },
            include: {
                class: { select: { name: true } },
                subject: { select: { name: true } },
                teacher: { select: { firstName: true, lastName: true } },
            },
        });

        return {
            id: hw.id,
            schoolId: hw.schoolId,
            classId: hw.classId,
            className: hw.class.name,
            subjectId: hw.subjectId,
            subjectName: hw.subject.name,
            teacherId: hw.teacherId,
            teacherName: `${hw.teacher.firstName} ${hw.teacher.lastName}`,
            title: hw.title,
            description: hw.description || '',
            type: hw.type,
            dueDate: hw.dueDate.toISOString(),
            maxScore: hw.maxScore,
            status: hw.status,
            questions: this.parseJson<QuizQuestion[]>(hw.questions, []),
            timeLimit: hw.timeLimit,
            essayPrompt: hw.essayPrompt,
            answerKey: hw.answerKey,
            gradingMode: hw.gradingMode,
            submissionCount: 0,
            gradedCount: 0,
            createdAt: hw.createdAt.toISOString(),
        };
    }

    async submitQuiz(homeworkId: string, dto: SubmitQuizDto) {
        const hw = await this.prisma.homework.findUnique({ where: { id: homeworkId } });
        if (!hw) throw new NotFoundException('Không tìm thấy bài tập');
        if (hw.type !== 'quiz') throw new BadRequestException('Bài tập này không phải trắc nghiệm');
        if (hw.status !== 'ACTIVE') throw new BadRequestException('Bài tập đã đóng');

        const questions = this.parseJson<QuizQuestion[]>(hw.questions, []);

        let totalScore = 0;
        const answersParams = dto.answers || {};
        const detail = questions.map(q => {
            const selected = answersParams[q.id] ?? -1;
            const correct = selected === q.correctIndex;
            const points = correct ? q.points : 0;
            totalScore += points;
            return { questionId: q.id, correct, selected, correctIndex: q.correctIndex, points };
        });

        const correctCount = detail.filter(d => d.correct).length;
        const totalQ = detail.length;
        const feedback = totalScore === hw.maxScore
            ? `Xuất sắc! Đúng hết ${totalQ}/${totalQ} câu.`
            : `Đúng ${correctCount}/${totalQ} câu (${totalScore}/${hw.maxScore} điểm).`;

        const sub = await this.prisma.homeworkSubmission.upsert({
            where: {
                homeworkId_studentId: { homeworkId, studentId: dto.studentId },
            },
            create: {
                homeworkId,
                studentId: dto.studentId,
                type: 'quiz',
                quizAnswers: JSON.stringify(dto.answers),
                quizDetail: JSON.stringify(detail),
                score: totalScore,
                maxScore: hw.maxScore,
                feedback,
                status: 'GRADED',
                gradedAt: new Date(),
            },
            update: {
                quizAnswers: JSON.stringify(dto.answers),
                quizDetail: JSON.stringify(detail),
                score: totalScore,
                feedback,
                status: 'GRADED',
                gradedAt: new Date(),
            },
            include: {
                student: { select: { firstName: true, lastName: true } },
            },
        });

        return {
            id: sub.id,
            homeworkId: sub.homeworkId,
            studentId: sub.studentId,
            studentName: `${sub.student.firstName} ${sub.student.lastName}`,
            type: 'quiz',
            quizAnswers: dto.answers,
            quizDetail: detail,
            score: totalScore,
            maxScore: hw.maxScore,
            feedback,
            status: 'GRADED',
            submittedAt: sub.submittedAt.toISOString(),
            gradedAt: sub.gradedAt?.toISOString() || null,
        };
    }

    async submitEssay(homeworkId: string, dto: SubmitEssayDto) {
        const hw = await this.prisma.homework.findUnique({ where: { id: homeworkId } });
        if (!hw) throw new NotFoundException('Không tìm thấy bài tập');
        if (hw.type !== 'essay') throw new BadRequestException('Bài tập này không phải tự luận');
        if (hw.status !== 'ACTIVE') throw new BadRequestException('Bài tập đã đóng');

        let score = null;
        let feedback = null;
        let status = 'SUBMITTED';
        let gradedAt = null;

        if (hw.gradingMode === 'ai') {
            try {

                const apiUrl = process.env.AI_SERVICE_URL || `http://localhost:${process.env.PORT || 3000}`;
                const axios = require('axios');
                const aiRes = await axios.post(`${apiUrl}/api/v1/ai/grade`, {
                    question: `${hw.title} - ${hw.description || ''}`,
                    answerKey: hw.answerKey || 'Chấm khách quan',
                    studentAnswer: dto.content,
                    maxScore: hw.maxScore
                });

                if (aiRes.data && aiRes.data.score !== undefined) {
                    score = aiRes.data.score;
                    feedback = aiRes.data.feedback;
                    status = 'AI_GRADED';
                    gradedAt = new Date();
                }
            } catch (err: any) {
                console.error('Auto AI Grading failed during submission:', err.message);

                const wordCount = dto.content.split(/\s+/).length;
                score = Math.min(hw.maxScore, Math.round((wordCount / 200) * hw.maxScore * 10) / 10);
                feedback = `[Fallback AI] Lỗi gọi AI server. Chấm điểm tạm tính theo độ dài bài làm (khoảng ${wordCount} chữ).`;
                status = 'AI_GRADED';
                gradedAt = new Date();
            }
        }

        const sub = await this.prisma.homeworkSubmission.upsert({
            where: {
                homeworkId_studentId: { homeworkId, studentId: dto.studentId },
            },
            create: {
                homeworkId,
                studentId: dto.studentId,
                type: 'essay',
                essayContent: dto.content,
                maxScore: hw.maxScore,
                score,
                feedback,
                status,
                gradedAt,
            },
            update: {
                essayContent: dto.content,
                status,
                score,
                feedback,
                gradedAt,
            },
            include: {
                student: { select: { firstName: true, lastName: true } },
            },
        });

        return {
            id: sub.id,
            homeworkId: sub.homeworkId,
            studentId: sub.studentId,
            studentName: `${sub.student.firstName} ${sub.student.lastName}`,
            type: 'essay',
            essayContent: dto.content,
            score,
            maxScore: hw.maxScore,
            feedback,
            status,
            submittedAt: sub.submittedAt.toISOString(),
            gradedAt: sub.gradedAt?.toISOString() || null,
        };
    }

    async getSubmissions(homeworkId: string) {
        const subs = await this.prisma.homeworkSubmission.findMany({
            where: { homeworkId },
            include: {
                student: { select: { firstName: true, lastName: true } },
            },
            orderBy: { submittedAt: 'desc' },
        });

        return subs.map(s => ({
            id: s.id,
            homeworkId: s.homeworkId,
            studentId: s.studentId,
            studentName: `${s.student.firstName} ${s.student.lastName}`,
            type: s.type,
            quizAnswers: this.parseJson<Record<string, number>>(s.quizAnswers, {}),
            quizDetail: this.parseJson<any[]>(s.quizDetail, []),
            essayContent: s.essayContent,
            score: s.score,
            maxScore: s.maxScore,
            feedback: s.feedback,
            status: s.status,
            submittedAt: s.submittedAt.toISOString(),
            gradedAt: s.gradedAt?.toISOString() || null,
        }));
    }

    async gradeSubmission(submissionId: string, dto: GradeHomeworkDto) {
        const sub = await this.prisma.homeworkSubmission.findUnique({ where: { id: submissionId } });
        if (!sub) throw new NotFoundException('Không tìm thấy bài nộp');

        const updated = await this.prisma.homeworkSubmission.update({
            where: { id: submissionId },
            data: {
                score: dto.score,
                feedback: dto.feedback || null,
                status: 'GRADED',
                gradedAt: new Date(),
            },
            include: {
                student: { select: { firstName: true, lastName: true } },
            },
        });

        return {
            id: updated.id,
            homeworkId: updated.homeworkId,
            studentId: updated.studentId,
            studentName: `${updated.student.firstName} ${updated.student.lastName}`,
            type: updated.type,
            score: updated.score,
            maxScore: updated.maxScore,
            feedback: updated.feedback,
            status: updated.status,
            submittedAt: updated.submittedAt.toISOString(),
            gradedAt: updated.gradedAt?.toISOString() || null,
        };
    }

    async getStats() {
        const total = await this.prisma.homework.count();
        const quizCount = await this.prisma.homework.count({ where: { type: 'quiz' } });
        const essayCount = await this.prisma.homework.count({ where: { type: 'essay' } });
        const active = await this.prisma.homework.count({ where: { status: 'ACTIVE' } });
        const totalSubmissions = await this.prisma.homeworkSubmission.count();
        const graded = await this.prisma.homeworkSubmission.count({ where: { status: { in: ['GRADED', 'AI_GRADED'] } } });
        const pending = totalSubmissions - graded;

        const scores = await this.prisma.homeworkSubmission.findMany({
            where: { score: { not: null } },
            select: { score: true },
        });
        const avgScore = scores.length > 0
            ? Math.round(scores.reduce((s, sub) => s + (sub.score || 0), 0) / scores.length * 10) / 10
            : 0;

        return { total, quizCount, essayCount, active, totalSubmissions, graded, pending, avgScore };
    }

    async delete(id: string) {
        const hw = await this.prisma.homework.findUnique({ where: { id } });
        if (!hw) throw new NotFoundException('Không tìm thấy bài tập');

        await this.prisma.homework.delete({ where: { id } });
        return { message: 'Đã xóa bài tập thành công' };
    }
}
