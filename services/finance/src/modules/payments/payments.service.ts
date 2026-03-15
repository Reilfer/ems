import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PaymentRecord {
    id: string;
    invoiceId: string;
    invoiceCode: string;
    studentCode: string;
    studentName: string;
    amount: number;
    method: string;
    transactionId?: string;
    status: string;
    paidAt: string;
}

const paymentStore: PaymentRecord[] = [];
let paymentCounter = 0;

@Injectable()
export class PaymentsService {
    constructor(private prisma: PrismaService) { }

    findAll(filters: { method?: string; search?: string } = {}) {
        let result = [...paymentStore];
        if (filters.method) result = result.filter(p => p.method === filters.method);
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(p =>
                p.studentName.toLowerCase().includes(q) ||
                p.studentCode.toLowerCase().includes(q) ||
                p.invoiceCode.toLowerCase().includes(q)
            );
        }
        return {
            data: result.sort((a, b) => b.paidAt.localeCompare(a.paidAt)),
            meta: { total: result.length },
        };
    }

    create(data: Omit<PaymentRecord, 'id'>): PaymentRecord {
        paymentCounter++;
        const payment: PaymentRecord = {
            id: `pay-${String(paymentCounter).padStart(6, '0')}`,
            ...data,
        };
        paymentStore.push(payment);
        return payment;
    }

    getRecentPayments(limit = 10) {
        return paymentStore
            .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
            .slice(0, limit);
    }
}
