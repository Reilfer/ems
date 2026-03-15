
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GradesService {
    constructor(private readonly prisma: PrismaService) { }

    async upsertScore(schoolId: string, data: {
        studentId: string;
        subjectId: string;
        classId: string;
        academicYearId: string;
        semester: number;
        oralScore?: number;
        fifteenMinScore?: number;
        fortyFiveMinScore?: number;
        midtermScore?: number;
        finalScore?: number;
    }) {

        const scores = [data.oralScore, data.fifteenMinScore, data.fortyFiveMinScore, data.midtermScore, data.finalScore];
        for (const score of scores) {
            if (score !== undefined && score !== null && (score < 0 || score > 10)) {
                throw new BadRequestException('Điểm phải trong khoảng 0-10');
            }
        }

        const averageScore = this.calculateAverage(
            data.oralScore,
            data.fifteenMinScore,
            data.fortyFiveMinScore,
            data.midtermScore,
            data.finalScore,
        );

        const existing = await this.prisma.score.findFirst({
            where: {
                schoolId,
                studentId: data.studentId,
                subjectId: data.subjectId,
                academicYearId: data.academicYearId,
                semester: data.semester,
            },
        });

        if (existing) {
            return this.prisma.score.update({
                where: { id: existing.id },
                data: {
                    oralScore: data.oralScore ?? existing.oralScore,
                    fifteenMinScore: data.fifteenMinScore ?? existing.fifteenMinScore,
                    fortyFiveMinScore: data.fortyFiveMinScore ?? existing.fortyFiveMinScore,
                    midtermScore: data.midtermScore ?? existing.midtermScore,
                    finalScore: data.finalScore ?? existing.finalScore,
                    averageScore,
                },
                include: {
                    student: { select: { firstName: true, lastName: true, studentCode: true } },
                    subject: { select: { name: true, code: true } },
                },
            });
        }

        return this.prisma.score.create({
            data: {
                school: { connect: { id: schoolId } },
                student: { connect: { id: data.studentId } },
                subject: { connect: { id: data.subjectId } },
                class: { connect: { id: data.classId } },
                academicYear: { connect: { id: data.academicYearId } },
                semester: data.semester,
                oralScore: data.oralScore,
                fifteenMinScore: data.fifteenMinScore,
                fortyFiveMinScore: data.fortyFiveMinScore,
                midtermScore: data.midtermScore,
                finalScore: data.finalScore,
                averageScore,
            },
            include: {
                student: { select: { firstName: true, lastName: true, studentCode: true } },
                subject: { select: { name: true, code: true } },
            },
        });
    }

    async batchUpsertScores(schoolId: string, scores: Array<{
        studentId: string;
        subjectId: string;
        classId: string;
        academicYearId: string;
        semester: number;
        oralScore?: number;
        fifteenMinScore?: number;
        fortyFiveMinScore?: number;
        midtermScore?: number;
        finalScore?: number;
    }>) {
        const results = [];
        for (const score of scores) {
            const result = await this.upsertScore(schoolId, score);
            results.push(result);
        }
        return {
            message: `Đã nhập điểm cho ${results.length} học sinh`,
            data: results,
        };
    }

    async getClassScores(schoolId: string, params: {
        classId: string;
        subjectId: string;
        academicYearId: string;
        semester: number;
    }) {
        const scores = await this.prisma.score.findMany({
            where: {
                schoolId,
                classId: params.classId,
                subjectId: params.subjectId,
                academicYearId: params.academicYearId,
                semester: params.semester,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        studentCode: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                student: { lastName: 'asc' },
            },
        });

        const classInfo = await this.prisma.class.findUnique({
            where: { id: params.classId },
            select: { name: true },
        });

        const subjectInfo = await this.prisma.subject.findUnique({
            where: { id: params.subjectId },
            select: { name: true, code: true },
        });

        const avgScores: number[] = scores.filter((s: any) => s.averageScore !== null).map((s: any) => s.averageScore!);
        const stats = {
            totalStudents: scores.length,
            classAverage: avgScores.length > 0 ? +(avgScores.reduce((a: number, b: number) => a + b, 0) / avgScores.length).toFixed(2) : null,
            excellent: avgScores.filter((s: number) => s >= 8.0).length,
            good: avgScores.filter((s: number) => s >= 6.5 && s < 8.0).length,
            average: avgScores.filter((s: number) => s >= 5.0 && s < 6.5).length,
            belowAverage: avgScores.filter((s: number) => s >= 3.5 && s < 5.0).length,
            poor: avgScores.filter((s: number) => s < 3.5).length,
        };

        return {
            class: classInfo,
            subject: subjectInfo,
            semester: params.semester,
            scores,
            stats,
        };
    }

    async getStudentTranscript(studentId: string, academicYearId: string) {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            select: {
                id: true,
                studentCode: true,
                firstName: true,
                lastName: true,
                currentClass: { select: { name: true } },
            },
        });

        if (!student) {
            throw new NotFoundException('Học sinh không tồn tại');
        }

        const scores = await this.prisma.score.findMany({
            where: { studentId, academicYearId },
            include: {
                subject: { select: { name: true, code: true, category: true } },
            },
            orderBy: [
                { semester: 'asc' },
                { subject: { name: 'asc' } },
            ],
        });

        const yearlyAverages: Record<string, {
            subjectName: string;
            subjectCode: string;
            semester1: number | null;
            semester2: number | null;
            yearAverage: number | null;
        }> = {};

        for (const score of scores) {
            const key = score.subjectId;
            if (!yearlyAverages[key]) {
                yearlyAverages[key] = {
                    subjectName: score.subject.name,
                    subjectCode: score.subject.code,
                    semester1: null,
                    semester2: null,
                    yearAverage: null,
                };
            }
            if (score.semester === 1) yearlyAverages[key].semester1 = score.averageScore ? Number(score.averageScore) : null;
            if (score.semester === 2) yearlyAverages[key].semester2 = score.averageScore ? Number(score.averageScore) : null;
        }

        for (const key of Object.keys(yearlyAverages)) {
            const entry = yearlyAverages[key];
            if (entry.semester1 !== null && entry.semester2 !== null) {
                entry.yearAverage = +((entry.semester1 + entry.semester2 * 2) / 3).toFixed(2);
            }
        }

        const subjectAverages = Object.values(yearlyAverages);
        const yearScores = subjectAverages.filter(s => s.yearAverage !== null).map(s => s.yearAverage!);
        const overallAverage = yearScores.length > 0
            ? +(yearScores.reduce((a, b) => a + b, 0) / yearScores.length).toFixed(2)
            : null;

        const classification = this.classifyStudent(overallAverage, subjectAverages);

        return {
            student,
            subjects: subjectAverages,
            overallAverage,
            classification,
            scores, 
        };
    }

    private calculateAverage(
        oral?: number | null,
        fifteenMin?: number | null,
        fortyFiveMin?: number | null,
        midterm?: number | null,
        finalExam?: number | null,
    ): number | null {
        let totalWeight = 0;
        let weightedSum = 0;

        if (oral !== undefined && oral !== null) {
            weightedSum += oral * 1;
            totalWeight += 1;
        }
        if (fifteenMin !== undefined && fifteenMin !== null) {
            weightedSum += fifteenMin * 1;
            totalWeight += 1;
        }
        if (fortyFiveMin !== undefined && fortyFiveMin !== null) {
            weightedSum += fortyFiveMin * 2;
            totalWeight += 2;
        }
        if (midterm !== undefined && midterm !== null) {
            weightedSum += midterm * 2;
            totalWeight += 2;
        }
        if (finalExam !== undefined && finalExam !== null) {
            weightedSum += finalExam * 3;
            totalWeight += 3;
        }

        if (totalWeight === 0) return null;

        return +(weightedSum / totalWeight).toFixed(2);
    }

    private classifyStudent(
        overallAverage: number | null,
        subjects: Array<{ yearAverage: number | null }>,
    ): string {
        if (overallAverage === null) return 'Chưa đủ điểm';

        const allAverages = subjects.filter(s => s.yearAverage !== null).map(s => s.yearAverage!);
        const minScore = allAverages.length > 0 ? Math.min(...allAverages) : 0;

        if (overallAverage >= 8.0 && minScore >= 6.5) return 'Giỏi';
        if (overallAverage >= 6.5 && minScore >= 5.0) return 'Khá';
        if (overallAverage >= 5.0 && minScore >= 3.5) return 'Trung bình';
        if (overallAverage >= 3.5) return 'Yếu';
        return 'Kém';
    }
}
