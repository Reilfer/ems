import { Injectable, Logger, Controller, Get } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger('AnalyticsService');

    private readonly endpoints = {
        student: 'http://localhost:3002/api/v1/students',
        attendance: 'http://localhost:3003/api/v1/attendance',
        grade: 'http://localhost:3005/api/v1/grades',
        finance: 'http://localhost:3007/api/v1/finance',
        hr: 'http://localhost:3008/api/v1/hr',
        enrollment: 'http://localhost:3009/api/v1/enrollment',
        exam: 'http://localhost:3010/api/v1/exams',
        assignment: 'http://localhost:3011/api/v1/assignments',
    };

    private async safeGet(url: string, fallback: any = null): Promise<any> {
        try {
            const res = await axios.get(url, { timeout: 3000 });
            return res.data;
        } catch {
            this.logger.warn(`Cannot reach: ${url}`);
            return fallback;
        }
    }

    async getDashboardStats() {

        const [
            studentStats,
            attendanceStats,
            financeStats,
            teacherStats,
            enrollmentStats,
            examStats,
            assignmentStats,
        ] = await Promise.all([
            this.safeGet(`${this.endpoints.student}/stats`),
            this.safeGet(`${this.endpoints.attendance}/stats/daily`),
            this.safeGet(`${this.endpoints.finance}/stats`),
            this.safeGet(`${this.endpoints.hr}/teachers/stats`),
            this.safeGet(`${this.endpoints.enrollment}/applications/stats`),
            this.safeGet(`${this.endpoints.exam}/exams/stats`),
            this.safeGet(`${this.endpoints.assignment}/assignments/stats`),
        ]);

        return {
            students: studentStats || {
                total: 0,
                active: 0,
                newThisMonth: 0,
                note: 'Student service offline — hiển thị dữ liệu mặc định',
            },
            teachers: teacherStats || {
                total: 0,
                active: 0,
                note: 'HR service offline',
            },
            finance: financeStats || {
                totalRevenue: 0,
                outstanding: 0,
                paidThisMonth: 0,
                note: 'Finance service offline',
            },
            attendance: attendanceStats || {
                todayRate: 0,
                totalPresent: 0,
                totalAbsent: 0,
                late: 0,
                note: 'Attendance service offline',
            },
            enrollment: enrollmentStats || {
                total: 0,
                accepted: 0,
                pending: 0,
                note: 'Enrollment service offline',
            },
            exams: examStats || {
                totalExams: 0,
                published: 0,
                totalAttempts: 0,
                note: 'Exam service offline',
            },
            assignments: assignmentStats || {
                total: 0,
                dueThisWeek: 0,
                note: 'Assignment service offline',
            },
            lastUpdated: new Date().toISOString(),
            servicesReachable: {
                student: !!studentStats,
                attendance: !!attendanceStats,
                finance: !!financeStats,
                hr: !!teacherStats,
                enrollment: !!enrollmentStats,
                exam: !!examStats,
                assignment: !!assignmentStats,
            },
        };
    }

    async getPerformanceOverview() {
        const studentStats = await this.safeGet(`${this.endpoints.student}/stats`);

        return {
            totalStudents: studentStats?.total || 0,
            gradeDistribution: {
                excellent: studentStats?.byClassification?.['Giỏi'] || 0,
                good: studentStats?.byClassification?.['Khá'] || 0,
                average: studentStats?.byClassification?.['Trung bình'] || 0,
                weak: studentStats?.byClassification?.['Yếu'] || 0,
                poor: studentStats?.byClassification?.['Kém'] || 0,
            },
            attendanceRate: (await this.safeGet(`${this.endpoints.attendance}/stats/daily`))?.rate || 0,
            lastUpdated: new Date().toISOString(),
        };
    }

    async getEnrollmentTrends() {
        const stats = await this.safeGet(`${this.endpoints.enrollment}/applications/stats`);
        const apps = await this.safeGet(`${this.endpoints.enrollment}/applications`);

        const total = stats?.total || (apps?.data?.length || 0);
        const accepted = stats?.accepted || 0;
        const pending = stats?.pending || 0;

        return {
            current: { total, accepted, pending, rejected: total - accepted - pending },
            acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
            sources: stats?.bySources || {},
            lastUpdated: new Date().toISOString(),
        };
    }
}

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly analytics: AnalyticsService) { }

    @Get()
    getDashboardStats() {
        return this.analytics.getDashboardStats();
    }
}

@Controller('performance')
export class PerformanceController {
    constructor(private readonly analytics: AnalyticsService) { }

    @Get()
    getOverview() {
        return this.analytics.getPerformanceOverview();
    }
}

@Controller('enrollment-trends')
export class EnrollmentController {
    constructor(private readonly analytics: AnalyticsService) { }

    @Get()
    getTrends() {
        return this.analytics.getEnrollmentTrends();
    }
}
