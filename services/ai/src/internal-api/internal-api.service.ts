import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class InternalApiService {
    private readonly logger = new Logger(InternalApiService.name);
    private prisma: PrismaClient;

    constructor(@Optional() @Inject('PRISMA_SERVICE') prismaInjected?: any) {
        if (prismaInjected) {
            this.prisma = prismaInjected;
            this.logger.log('InternalApiService: Using injected PrismaService');
        } else {

            this.prisma = new PrismaClient();
            this.prisma.$connect().then(() => {
                this.logger.log('InternalApiService: Connected via standalone PrismaClient');
            }).catch(e => {
                this.logger.error(`InternalApiService: Failed to connect: ${e.message}`);
            });
        }
    }

    async searchStudentByCode(keyword: string): Promise<any> {
        try {
            this.logger.log(`searchStudentByCode: searching for "${keyword}"`);
            const students = await this.prisma.student.findMany({
                where: {
                    OR: [
                        { studentCode: { contains: keyword } },
                        { firstName: { contains: keyword } },
                        { lastName: { contains: keyword } },
                    ],
                },
                take: 5,
                include: {
                    currentClass: { select: { id: true, name: true } },
                },
            });
            this.logger.log(`searchStudentByCode: found ${students.length} students`);
            if (students.length > 0) {
                this.logger.log(`searchStudentByCode: first match = ${students[0].studentCode} (${students[0].firstName} ${students[0].lastName})`);
            }
            return { data: students, meta: { total: students.length } };
        } catch (e: any) {
            this.logger.error(`searchStudentByCode error: ${e.message}\n${e.stack}`);
            return null;
        }
    }

    async getStudentInfo(studentId: string): Promise<any> {
        try {
            return await this.prisma.student.findUnique({
                where: { id: studentId },
                include: {
                    currentClass: { select: { id: true, name: true } },
                    school: { select: { id: true, name: true } },
                },
            });
        } catch (e: any) {
            this.logger.warn(`getStudentInfo error: ${e.message}`);
            return null;
        }
    }

    async getStudentList(params?: { page?: number; limit?: number; search?: string }): Promise<any> {
        try {
            const page = params?.page || 1;
            const limit = Math.min(params?.limit || 20, 100);
            const skip = (page - 1) * limit;
            const where: any = {};

            if (params?.search) {
                where.OR = [
                    { firstName: { contains: params.search } },
                    { lastName: { contains: params.search } },
                    { studentCode: { contains: params.search } },
                ];
            }

            const [students, total] = await Promise.all([
                this.prisma.student.findMany({
                    where, skip, take: limit,
                    include: { currentClass: { select: { id: true, name: true } } },
                }),
                this.prisma.student.count({ where }),
            ]);

            return { data: students, meta: { total, page, limit } };
        } catch (e: any) {
            this.logger.warn(`getStudentList error: ${e.message}`);
            return { data: [], meta: { total: 0 } };
        }
    }

    async getStudentStats(): Promise<any> {
        try {
            const [total, active, byGender] = await Promise.all([
                this.prisma.student.count(),
                this.prisma.student.count({ where: { status: 'active' } }),
                this.prisma.student.groupBy({ by: ['gender'], _count: true }),
            ]);
            return { total, active, inactive: total - active, byGender };
        } catch {
            return null;
        }
    }

    async getStudentTranscript(studentId: string, academicYearId?: string): Promise<any> {
        try {
            this.logger.log(`getStudentTranscript: studentId=${studentId}`);
            const where: any = { studentId };
            if (academicYearId) where.academicYearId = academicYearId;

            const scores = await this.prisma.score.findMany({
                where,
                include: {
                    subject: { select: { id: true, name: true, code: true } },
                    class: { select: { id: true, name: true } },
                    academicYear: { select: { id: true, name: true } },
                },
                orderBy: [{ semester: 'asc' }, { subject: { name: 'asc' } }],
            });

            const student = await this.prisma.student.findUnique({
                where: { id: studentId },
                select: { id: true, studentCode: true, firstName: true, lastName: true },
            });

            this.logger.log(`getStudentTranscript: found ${scores.length} scores for ${student?.studentCode}`);
            return { student, scores, total: scores.length };
        } catch (e: any) {
            this.logger.error(`getStudentTranscript error: ${e.message}\n${e.stack}`);
            return null;
        }
    }

    async getClassScores(params: { classId: string; subjectId?: string; semester?: number }): Promise<any> {
        try {
            const where: any = { classId: params.classId };
            if (params.subjectId) where.subjectId = params.subjectId;
            if (params.semester) where.semester = params.semester;

            const scores = await this.prisma.score.findMany({
                where,
                include: {
                    student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
                    subject: { select: { id: true, name: true } },
                },
            });
            return scores;
        } catch {
            return null;
        }
    }

    async getAttendanceRecords(params?: { studentCode?: string; date?: string }): Promise<any> {
        try {
            const where: any = {};

            if (params?.studentCode) {
                const student = await this.prisma.student.findFirst({
                    where: { studentCode: { equals: params.studentCode } },
                });
                if (!student) return [];
                where.studentId = student.id;
            }

            if (params?.date) {
                const day = new Date(params.date);
                const nextDay = new Date(day);
                nextDay.setDate(nextDay.getDate() + 1);
                where.session = { sessionDate: { gte: day, lt: nextDay } };
            }

            const records = await this.prisma.attendanceRecord.findMany({
                where,
                take: 50,
                orderBy: { createdAt: 'desc' },
                include: {
                    student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
                    session: { select: { sessionDate: true, type: true } },
                },
            });
            return records;
        } catch (e: any) {
            this.logger.warn(`getAttendanceRecords error: ${e.message}`);
            return [];
        }
    }

    async getAttendanceStats(date?: string): Promise<any> {
        try {
            const targetDate = date ? new Date(date) : new Date();
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);

            const records = await this.prisma.attendanceRecord.findMany({
                where: {
                    session: {
                        sessionDate: { gte: targetDate, lt: nextDay },
                    },
                },
            });

            const present = records.filter(r => r.status === 'PRESENT').length;
            const late = records.filter(r => r.status === 'LATE').length;
            const absent = records.filter(r => r.status === 'ABSENT').length;

            return { date: targetDate.toISOString().slice(0, 10), total: records.length, present, late, absent };
        } catch {
            return null;
        }
    }

    async getWeeklyAttendance(classId?: string): Promise<any> {
        try {
            const today = new Date();
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);

            const where: any = {
                session: { sessionDate: { gte: weekAgo, lte: today } },
            };
            if (classId) where.session.classId = classId;

            const records = await this.prisma.attendanceRecord.findMany({
                where,
                include: { session: { select: { sessionDate: true } } },
            });
            return records;
        } catch {
            return [];
        }
    }

    async getStudentInvoices(params?: { studentCode?: string }): Promise<any> {
        try {
            const where: any = {};

            if (params?.studentCode) {
                const student = await this.prisma.student.findFirst({
                    where: { studentCode: { equals: params.studentCode } },
                });
                if (!student) return { data: [], meta: { total: 0 }, message: 'Khong tim thay hoc sinh' };
                where.studentId = student.id;
            }

            const [invoices, total] = await Promise.all([
                this.prisma.invoice.findMany({
                    where,
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
                        payments: { select: { id: true, amount: true, method: true, status: true } },
                    },
                }),
                this.prisma.invoice.count({ where }),
            ]);

            return { data: invoices, meta: { total } };
        } catch (e: any) {
            this.logger.warn(`getStudentInvoices error: ${e.message}`);
            return { data: [], meta: { total: 0 } };
        }
    }

    async getFinanceStats(): Promise<any> {
        try {
            const [totalInvoices, paidInvoices, pendingInvoices] = await Promise.all([
                this.prisma.invoice.count(),
                this.prisma.invoice.count({ where: { status: 'paid' } }),
                this.prisma.invoice.count({ where: { status: 'pending' } }),
            ]);

            const totals = await this.prisma.invoice.aggregate({
                _sum: { totalAmount: true, finalAmount: true },
            });

            return {
                totalInvoices,
                paidInvoices,
                pendingInvoices,
                totalAmount: totals._sum.totalAmount,
                paidAmount: totals._sum.finalAmount,
            };
        } catch {
            return null;
        }
    }

    async getTeacherStats(): Promise<any> {
        try {
            const total = await this.prisma.teacher.count();
            return { total };
        } catch {
            return null;
        }
    }

    async getTimekeepingStats(month?: string): Promise<any> {
        return null; 
    }

    async getEnrollmentStats(): Promise<any> {
        try {
            const leads = await this.prisma.crmLead.groupBy({ by: ['status'], _count: true });
            const total = leads.reduce((sum, l) => sum + l._count, 0);
            return { total, byStatus: leads };
        } catch {
            return null;
        }
    }

    async getApplicationsList(params?: any): Promise<any> {
        try {
            const leads = await this.prisma.crmLead.findMany({
                take: 20,
                orderBy: { createdAt: 'desc' },
            });
            return { data: leads, meta: { total: leads.length } };
        } catch {
            return { data: [], meta: { total: 0 } };
        }
    }

    async getExamStats(): Promise<any> {
        try {
            const total = await this.prisma.questionBank.count();
            return { totalQuestions: total };
        } catch {
            return null;
        }
    }

    async getClassTimetable(classId: string): Promise<any> {

        return { message: 'Chức năng thời khóa biểu chưa được hỗ trợ trong phiên bản hiện tại.' };
    }

    async getAllTimetable(): Promise<any> {
        return { message: 'Chức năng thời khóa biểu chưa được hỗ trợ.' };
    }

    async getSchoolEvents(month?: string): Promise<any> {

        return [];
    }

    async getUserNotifications(userId: string): Promise<any> {
        try {
            return await this.prisma.notification.findMany({
                where: { recipientId: userId },
                take: 20,
                orderBy: { createdAt: 'desc' },
            });
        } catch {
            return [];
        }
    }

    async getPayrollStats(): Promise<any> {
        try {
            const totalTeachers = await this.prisma.teacher.count();
            const totalPayrolls = await this.prisma.payroll.count();
            const paidPayrolls = await this.prisma.payroll.count({ where: { status: 'paid' } });
            const totals = await this.prisma.payroll.aggregate({
                _sum: { netSalary: true, baseSalary: true },
            });
            return {
                totalTeachers,
                totalPayrolls,
                paidPayrolls,
                pendingPayrolls: totalPayrolls - paidPayrolls,
                totalNetSalary: totals._sum.netSalary,
                totalBaseSalary: totals._sum.baseSalary,
            };
        } catch {
            return null;
        }
    }

    async getDashboardOverview(): Promise<any> {
        try {
            const [studentStats, teacherStats, financeStats, attendanceStats] = await Promise.all([
                this.getStudentStats(),
                this.getTeacherStats(),
                this.getFinanceStats(),
                this.getAttendanceStats(),
            ]);
            return {
                students: studentStats,
                teachers: teacherStats,
                finance: financeStats,
                attendance: attendanceStats,
                generatedAt: new Date().toISOString(),
            };
        } catch {
            return null;
        }
    }
}
