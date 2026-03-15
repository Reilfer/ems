import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { TimekeepingModule } from './modules/timekeeping/timekeeping.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
        PrismaModule,
        HealthModule,
        TeachersModule,
        TimekeepingModule,
        PayrollModule,
        ContractsModule,
    ],
    providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
    ],
})
export class AppModule { }
