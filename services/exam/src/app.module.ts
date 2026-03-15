import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { QuestionBankModule } from './modules/question-bank/question-bank.module';
import { ExamsModule } from './modules/exams/exams.module';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
        PrismaModule,
        HealthModule,
        QuestionBankModule,
        ExamsModule,
    ],
    providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
    ],
})
export class AppModule { }
