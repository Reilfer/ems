import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeeTypesService } from '../fee-types/fee-types.service';

export interface InvoiceItem {
    feeTypeId: string;
    feeTypeName: string;
    amount: number;
}

export interface InvoiceRecord {
    id: string;
    schoolId: string;
    studentId: string;
    studentCode: string;
    studentName: string;
    invoiceCode: string;
    items: InvoiceItem[];
    totalAmount: number;
    paidAmount: number;
    status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
    dueDate: string;
    createdAt: string;
    updatedAt: string;
}

const demoStudents = [
    { id: 's1', studentCode: 'HS20250001', name: 'Trần Văn An', classId: '1', className: '10A1' },
    { id: 's2', studentCode: 'HS20250002', name: 'Lê Thị Bình', classId: '1', className: '10A1' },
    { id: 's3', studentCode: 'HS20250003', name: 'Phạm Minh Châu', classId: '1', className: '10A1' },
    { id: 's4', studentCode: 'HS20250004', name: 'Hoàng Đức Dũng', classId: '2', className: '10A2' },
    { id: 's5', studentCode: 'HS20250005', name: 'Ngô Thùy Em', classId: '2', className: '10A2' },
];

let invoiceCounter = 0;
const invoiceStore: InvoiceRecord[] = [];

@Injectable()
export class InvoicesService {
    constructor(
        private prisma: PrismaService,
        private feeTypes: FeeTypesService,
    ) { }

    findAll(filters: { status?: string; classId?: string; search?: string } = {}) {
        let result = [...invoiceStore];
        if (filters.status) result = result.filter(i => i.status === filters.status);
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(i =>
                i.studentName.toLowerCase().includes(q) ||
                i.studentCode.toLowerCase().includes(q) ||
                i.invoiceCode.toLowerCase().includes(q)
            );
        }
        return {
            data: result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
            meta: { total: result.length },
        };
    }

    findById(id: string) {
        const inv = invoiceStore.find(i => i.id === id);
        if (!inv) throw new NotFoundException('Invoice not found');
        return inv;
    }

    findByStudentCode(studentCode: string) {
        return invoiceStore.filter(i => i.studentCode === studentCode && i.status === 'PENDING');
    }

    batchGenerate(dto: { classId: string; feeTypeIds: string[]; dueDate: string; schoolId: string }): InvoiceRecord[] {
        const students = demoStudents.filter(s => s.classId === dto.classId);
        if (students.length === 0) throw new BadRequestException('Không tìm thấy HS trong lớp');

        const feeItems: InvoiceItem[] = [];
        let total = 0;
        for (const ftId of dto.feeTypeIds) {
            const ft = this.feeTypes.findById(ftId);
            if (ft) {
                feeItems.push({ feeTypeId: ft.id, feeTypeName: ft.name, amount: ft.amount });
                total += ft.amount;
            }
        }

        if (feeItems.length === 0) throw new BadRequestException('Không có khoản thu hợp lệ');

        const now = new Date().toISOString();
        const month = new Date().toISOString().slice(0, 7).replace('-', '');
        const created: InvoiceRecord[] = [];

        for (const student of students) {

            const existing = invoiceStore.find(i =>
                i.studentCode === student.studentCode &&
                i.invoiceCode.includes(month) &&
                i.status === 'PENDING'
            );
            if (existing) continue;

            invoiceCounter++;
            const inv: InvoiceRecord = {
                id: `inv-${String(invoiceCounter).padStart(6, '0')}`,
                schoolId: dto.schoolId,
                studentId: student.id,
                studentCode: student.studentCode,
                studentName: student.name,
                invoiceCode: `INV-${student.studentCode}-${month}`,
                items: [...feeItems],
                totalAmount: total,
                paidAmount: 0,
                status: 'PENDING',
                dueDate: dto.dueDate,
                createdAt: now,
                updatedAt: now,
            };
            invoiceStore.push(inv);
            created.push(inv);
        }

        return created;
    }

    recordPayment(invoiceId: string, amount: number, method: string, transactionId?: string) {
        const inv = invoiceStore.find(i => i.id === invoiceId);
        if (!inv) throw new NotFoundException('Invoice not found');

        inv.paidAmount += amount;
        inv.updatedAt = new Date().toISOString();

        if (inv.paidAmount >= inv.totalAmount) {
            inv.status = 'PAID';
        } else if (inv.paidAmount > 0) {
            inv.status = 'PARTIAL';
        }

        return inv;
    }

    matchBankTransfer(description: string, amount: number, transactionId: string) {

        const match = description.match(/HS\d+/i);
        if (!match) return { matched: false, reason: 'Không tìm thấy mã HS trong nội dung CK' };

        const studentCode = match[0].toUpperCase();
        const pendingInvoices = this.findByStudentCode(studentCode);

        if (pendingInvoices.length === 0) {
            return { matched: false, reason: `Không tìm thấy hóa đơn PENDING cho ${studentCode}` };
        }

        const bestMatch = pendingInvoices.reduce((best: InvoiceRecord | null, inv: InvoiceRecord) => {
            const remaining = inv.totalAmount - inv.paidAmount;
            if (!best) return inv;
            const bestRemaining = best.totalAmount - best.paidAmount;
            return Math.abs(remaining - amount) < Math.abs(bestRemaining - amount) ? inv : best;
        }, null);

        if (!bestMatch) return { matched: false, reason: 'Không match được hóa đơn' };

        this.recordPayment(bestMatch.id, amount, 'BANK_TRANSFER', transactionId);

        return {
            matched: true,
            invoice: bestMatch,
            studentCode,
            message: `Đã ghi nhận ${amount.toLocaleString('vi-VN')}₫ cho ${bestMatch.studentName} (${bestMatch.invoiceCode})`,
        };
    }

    getStats() {
        const all = invoiceStore;
        const totalRevenue = all.reduce((s, i) => s + i.paidAmount, 0);
        const totalDebt = all.reduce((s, i) => s + Math.max(0, i.totalAmount - i.paidAmount), 0);
        const pending = all.filter(i => i.status === 'PENDING').length;
        const paid = all.filter(i => i.status === 'PAID').length;
        const overdue = all.filter(i => {
            return i.status === 'PENDING' && new Date(i.dueDate) < new Date();
        }).length;

        return { totalRevenue, totalDebt, pending, paid, overdue, total: all.length };
    }
}
