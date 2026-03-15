import { Controller, Post, Body, Logger, HttpCode, HttpStatus, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InvoicesService } from '../invoices/invoices.service';
import { PaymentsService } from '../payments/payments.service';
const Public = () => SetMetadata('isPublic', true);

interface BankWebhookPayload {
    id: number;
    gateway: string;
    transactionDate: string;
    accountNumber: string;
    subAccount?: string;
    transferType: string; 
    transferAmount: number;
    accumulated: number;
    code?: string;
    content: string; 
    referenceCode: string;
    description: string;
}

interface SimulatePayload {
    studentCode: string;
    amount: number;
    content?: string;
}

@ApiTags('Bank Webhook')
@Controller('bank')
@Public()
export class BankWebhookController {
    private readonly logger = new Logger('BankWebhook');

    constructor(
        private readonly invoices: InvoicesService,
        private readonly payments: PaymentsService,
    ) { }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Receive bank webhook (SePay/Casso format)' })
    handleWebhook(@Body() payload: BankWebhookPayload) {
        this.logger.log(`Bank webhook received: ${payload.transferAmount}₫ — "${payload.content}"`);

        if (payload.transferType === 'out') {
            this.logger.log('Outgoing transfer, skipping');
            return { success: true, message: 'Outgoing transfer ignored' };
        }

        const result = this.invoices.matchBankTransfer(
            payload.content || payload.description,
            payload.transferAmount,
            payload.referenceCode || String(payload.id),
        );

        if (result.matched && result.invoice) {

            this.payments.create({
                invoiceId: result.invoice.id,
                invoiceCode: result.invoice.invoiceCode,
                studentCode: result.studentCode!,
                studentName: result.invoice.studentName,
                amount: payload.transferAmount,
                method: 'BANK_TRANSFER',
                transactionId: payload.referenceCode || String(payload.id),
                status: 'SUCCESS',
                paidAt: new Date().toISOString(),
            });

            this.logger.log(`Auto matched: ${result.message}`);
        } else {
            this.logger.warn(`No match: ${result.reason}`);
        }

        return { success: true, ...result };
    }

    @Post('simulate')
    @ApiOperation({ summary: 'Simulate a bank transfer (dev only)' })
    simulateTransfer(@Body() payload: SimulatePayload) {
        this.logger.log(`Simulating bank transfer: ${payload.amount}₫ for ${payload.studentCode}`);

        const content = payload.content || `HP ${payload.studentCode} nop hoc phi`;

        const webhookPayload: BankWebhookPayload = {
            id: Date.now(),
            gateway: 'SIMULATE',
            transactionDate: new Date().toISOString(),
            accountNumber: '0123456789',
            transferType: 'in',
            transferAmount: payload.amount,
            accumulated: 0,
            content,
            referenceCode: `SIM-${Date.now()}`,
            description: content,
        };

        return this.handleWebhook(webhookPayload);
    }
}
