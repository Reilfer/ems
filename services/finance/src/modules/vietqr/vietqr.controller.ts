import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InvoicesService } from '../invoices/invoices.service';

@ApiTags('VietQR')
@Controller('vietqr')
export class VietqrController {
    private bankId: string;
    private accountNo: string;
    private accountName: string;

    constructor(
        private config: ConfigService,
        private invoices: InvoicesService,
    ) {
        this.bankId = this.config.get('BANK_ID') || '970422'; 
        this.accountNo = this.config.get('BANK_ACCOUNT_NO') || '0123456789';
        this.accountName = this.config.get('BANK_ACCOUNT_NAME') || 'TRUONG THPT DEMO';
    }

    @Get(':invoiceId')
    @ApiOperation({ summary: 'Get VietQR URL for an invoice' })
    getQR(@Param('invoiceId') invoiceId: string) {
        const invoice = this.invoices.findById(invoiceId);
        const remaining = invoice.totalAmount - invoice.paidAmount;
        const content = `HP ${invoice.studentCode}`;

        const qrUrl = `https://img.vietqr.io/image/${this.bankId}-${this.accountNo}-compact2.png`
            + `?amount=${remaining}`
            + `&addInfo=${encodeURIComponent(content)}`
            + `&accountName=${encodeURIComponent(this.accountName)}`;

        return {
            qrUrl,
            bankId: this.bankId,
            accountNo: this.accountNo,
            accountName: this.accountName,
            amount: remaining,
            content,
            invoiceCode: invoice.invoiceCode,
            studentCode: invoice.studentCode,
            studentName: invoice.studentName,
        };
    }

    @Get('preview/:studentCode')
    @ApiOperation({ summary: 'Get VietQR for a student by code' })
    getQRByStudent(@Param('studentCode') studentCode: string) {
        const pending = this.invoices.findByStudentCode(studentCode);
        if (pending.length === 0) {
            return { message: 'Không có hóa đơn chưa thanh toán' };
        }

        const totalRemaining = pending.reduce((s, inv) => s + (inv.totalAmount - inv.paidAmount), 0);
        const content = `HP ${studentCode}`;

        const qrUrl = `https://img.vietqr.io/image/${this.bankId}-${this.accountNo}-compact2.png`
            + `?amount=${totalRemaining}`
            + `&addInfo=${encodeURIComponent(content)}`
            + `&accountName=${encodeURIComponent(this.accountName)}`;

        return {
            qrUrl,
            amount: totalRemaining,
            content,
            invoiceCount: pending.length,
            invoices: pending.map(i => ({ id: i.id, code: i.invoiceCode, amount: i.totalAmount - i.paidAmount })),
        };
    }
}
