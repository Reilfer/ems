import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CalculatePayrollDto } from './payroll.dto';

export interface PayrollRecord {
    id: string;
    schoolId: string;
    userId: string;
    userName: string;
    year: number;
    month: number;
    baseSalary: number;
    allowances: number;
    deductions: number;
    overtimePay: number;
    insurance: number;
    tax: number;
    netSalary: number;
    workDays: number;
    absentDays: number;
    status: 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID';
    paidAt: string | null;
    createdAt: string;
}

const demoPayroll: PayrollRecord[] = [];
let payrollCounter = 0;

function initDemoPayroll() {
    if (demoPayroll.length > 0) return;
    const users = [
        { id: 'u1', name: 'Nguyễn Văn Hùng', base: 15000000 },
        { id: 'u2', name: 'Trần Thị Mai', base: 12000000 },
        { id: 'u3', name: 'Lê Hoàng Nam', base: 18000000 },
    ];
    const now = new Date();
    for (let m = 1; m <= Math.min(now.getMonth() + 1, 12); m++) {
        for (const u of users) {
            payrollCounter++;
            const insurance = Math.round(u.base * 0.105);
            const tax = Math.round(Math.max(0, (u.base - 11000000) * 0.05));
            const net = u.base + 2000000 - insurance - tax;
            demoPayroll.push({
                id: `pr${payrollCounter}`,
                schoolId: 'school1',
                userId: u.id,
                userName: u.name,
                year: now.getFullYear(),
                month: m,
                baseSalary: u.base,
                allowances: 2000000,
                deductions: 0,
                overtimePay: 0,
                insurance,
                tax,
                netSalary: net,
                workDays: 22,
                absentDays: Math.floor(Math.random() * 3),
                status: m < now.getMonth() + 1 ? 'PAID' : 'DRAFT',
                paidAt: m < now.getMonth() + 1 ? `${now.getFullYear()}-${String(m).padStart(2, '0')}-28T00:00:00Z` : null,
                createdAt: new Date().toISOString(),
            });
        }
    }
}

@Injectable()
export class PayrollService {
    constructor(private prisma: PrismaService) {
        initDemoPayroll();
    }

    async calculate(dto: CalculatePayrollDto) {
        const existing = demoPayroll.find(p => p.userId === dto.userId && p.month === dto.month && p.year === dto.year);
        if (existing && existing.status !== 'DRAFT') {
            throw new BadRequestException('Bảng lương đã được duyệt, không thể tính lại');
        }

        const insurance = Math.round(dto.baseSalary * 0.105);
        const taxableIncome = dto.baseSalary + (dto.allowances || 0) - insurance - 11000000;
        const tax = Math.round(Math.max(0, taxableIncome * 0.05));
        const net = dto.baseSalary + (dto.allowances || 0) - (dto.deductions || 0) + (dto.overtimePay || 0) - insurance - tax;

        if (existing) {
            Object.assign(existing, { ...dto, insurance, tax, netSalary: net, status: 'CALCULATED' });
            return existing;
        }

        payrollCounter++;
        const record: PayrollRecord = {
            id: `pr${payrollCounter}`,
            schoolId: dto.schoolId,
            userId: dto.userId,
            userName: 'User',
            year: dto.year,
            month: dto.month,
            baseSalary: dto.baseSalary,
            allowances: dto.allowances || 0,
            deductions: dto.deductions || 0,
            overtimePay: dto.overtimePay || 0,
            insurance,
            tax,
            netSalary: net,
            workDays: 22,
            absentDays: 0,
            status: 'CALCULATED',
            paidAt: null,
            createdAt: new Date().toISOString(),
        };
        demoPayroll.push(record);
        return record;
    }

    async findAll(filters: { month?: number; year?: number; status?: string } = {}) {
        let result = [...demoPayroll];
        if (filters.month) result = result.filter(p => p.month === Number(filters.month));
        if (filters.year) result = result.filter(p => p.year === Number(filters.year));
        if (filters.status) result = result.filter(p => p.status === filters.status);
        return { data: result.sort((a, b) => b.month - a.month || a.userName.localeCompare(b.userName)), meta: { total: result.length } };
    }

    async approve(id: string) {
        const payroll = demoPayroll.find(p => p.id === id);
        if (!payroll) throw new NotFoundException('Không tìm thấy bảng lương');
        if (payroll.status === 'PAID') throw new BadRequestException('Đã thanh toán');
        payroll.status = 'APPROVED';
        return payroll;
    }

    async markPaid(id: string) {
        const payroll = demoPayroll.find(p => p.id === id);
        if (!payroll) throw new NotFoundException('Không tìm thấy bảng lương');
        if (payroll.status !== 'APPROVED') throw new BadRequestException('Cần duyệt trước khi thanh toán');
        payroll.status = 'PAID';
        payroll.paidAt = new Date().toISOString();
        return payroll;
    }

    async getStats(year?: number) {
        const y = year || new Date().getFullYear();
        const yearData = demoPayroll.filter(p => p.year === y);
        const totalPaid = yearData.filter(p => p.status === 'PAID').reduce((s, p) => s + p.netSalary, 0);
        const totalPending = yearData.filter(p => p.status !== 'PAID').reduce((s, p) => s + p.netSalary, 0);
        return { year: y, totalPaid, totalPending, recordCount: yearData.length };
    }
}
