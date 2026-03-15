import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { FeeTypesModule } from './modules/fee-types/fee-types.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BankWebhookModule } from './modules/bank-webhook/bank-webhook.module';
import { VietqrModule } from './modules/vietqr/vietqr.module';
import { HealthModule } from './modules/health/health.module';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        FeeTypesModule,
        InvoicesModule,
        PaymentsModule,
        BankWebhookModule,
        VietqrModule,
        HealthModule,
    ],
    providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
    ],
})
export class AppModule { }
