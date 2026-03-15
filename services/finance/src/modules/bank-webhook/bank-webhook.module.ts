import { Module } from '@nestjs/common';
import { BankWebhookController } from './bank-webhook.controller';
import { InvoicesModule } from '../invoices/invoices.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
    imports: [InvoicesModule, PaymentsModule],
    controllers: [BankWebhookController],
})
export class BankWebhookModule { }
