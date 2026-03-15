import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { RecordsModule } from './modules/records/records.module';
import { StatsModule } from './modules/stats/stats.module';
import { LeaveRequestsModule } from './modules/leave-requests/leave-requests.module';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        SessionsModule,
        RecordsModule,
        StatsModule,
        LeaveRequestsModule,
    ],
    providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
    ],
})
export class AppModule { }
