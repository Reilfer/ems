
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';

import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';

import { GeminiModule } from '../../ai/src/gemini/gemini.module';
import { InternalApiModule } from '../../ai/src/internal-api/internal-api.module';

import { AuthModule } from '../../auth/src/modules/auth/auth.module';
import { UsersModule } from '../../auth/src/modules/users/users.module';

import { StudentsModule } from '../../student/src/modules/students/students.module';

import { SessionsModule } from '../../attendance/src/modules/sessions/sessions.module';
import { RecordsModule } from '../../attendance/src/modules/records/records.module';
import { StatsModule as AttendanceStatsModule } from '../../attendance/src/modules/stats/stats.module';
import { LeaveRequestsModule } from '../../attendance/src/modules/leave-requests/leave-requests.module';

import { TimetableModule } from '../../schedule/src/modules/timetable/timetable.module';
import { EventsModule } from '../../schedule/src/modules/events/events.module';
import { RoomsModule } from '../../schedule/src/modules/rooms/rooms.module';

import { GradesModule } from '../../grade/src/modules/grades/grades.module';

import { NotificationsModule } from '../../notification/src/modules/notifications/notifications.module';

import { FeeTypesModule } from '../../finance/src/modules/fee-types/fee-types.module';
import { InvoicesModule } from '../../finance/src/modules/invoices/invoices.module';
import { PaymentsModule } from '../../finance/src/modules/payments/payments.module';
import { BankWebhookModule } from '../../finance/src/modules/bank-webhook/bank-webhook.module';
import { VietqrModule } from '../../finance/src/modules/vietqr/vietqr.module';

import { TeachersModule } from '../../hr/src/modules/teachers/teachers.module';
import { TimekeepingModule } from '../../hr/src/modules/timekeeping/timekeeping.module';
import { PayrollModule } from '../../hr/src/modules/payroll/payroll.module';
import { ContractsModule } from '../../hr/src/modules/contracts/contracts.module';

import { ApplicationsModule } from '../../enrollment/src/modules/applications/applications.module';
import { LeadsModule } from '../../enrollment/src/modules/leads/leads.module';

import { AssignmentsModule } from '../../assignment/src/modules/assignments/assignments.module';
import { HomeworkModule } from '../../assignment/src/modules/homework/homework.module';

import { AssetsModule } from '../../asset/src/modules/assets/assets.module';

import { AppModule as MediaAppModule } from '../../media/src/app.module';

import { WorkflowModule } from '../../workflow/src/workflows/workflows.module';

import { AppModule as AnalyticsAppModule } from '../../analytics/src/app.module';

import { ChatModule } from '../../ai/src/modules/chat/chat.module';
import { GradingModule } from '../../ai/src/modules/grading/grading.module';

@Module({
    imports: [

        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'],
        }),
        ThrottlerModule.forRoot([
            { name: 'short', ttl: 1000, limit: 3 },
            { name: 'medium', ttl: 60000, limit: 20 },
            { name: 'long', ttl: 900000, limit: 100 },
        ]),
        PrismaModule,
        LoggerModule,
        RedisModule,
        QueueModule,
        HealthModule,

        GeminiModule,
        InternalApiModule,

        AuthModule,
        UsersModule,
        StudentsModule,
        SessionsModule,
        RecordsModule,
        AttendanceStatsModule,
        LeaveRequestsModule,
        TimetableModule,
        EventsModule,
        RoomsModule,
        GradesModule,
        NotificationsModule,
        FeeTypesModule,
        InvoicesModule,
        PaymentsModule,
        BankWebhookModule,
        VietqrModule,
        TeachersModule,
        TimekeepingModule,
        PayrollModule,
        ContractsModule,
        ApplicationsModule,
        LeadsModule,
        AssignmentsModule,
        HomeworkModule,
        AssetsModule,
        MediaAppModule,
        WorkflowModule,
        AnalyticsAppModule,
        ChatModule,
        GradingModule,

        RouterModule.register([

            { path: 'api/v1/auth', module: AuthModule },
            { path: 'api/v1/auth', module: UsersModule },

            { path: 'api/v1/students', module: StudentsModule },

            { path: 'api/v1/attendance', module: SessionsModule },
            { path: 'api/v1/attendance', module: RecordsModule },
            { path: 'api/v1/attendance', module: AttendanceStatsModule },
            { path: 'api/v1/attendance', module: LeaveRequestsModule },

            { path: 'api/v1/schedule', module: TimetableModule },
            { path: 'api/v1/schedule', module: EventsModule },
            { path: 'api/v1/schedule', module: RoomsModule },

            { path: 'api/v1/grades', module: GradesModule },

            { path: 'api/v1/notifications', module: NotificationsModule },

            { path: 'api/v1/finance', module: FeeTypesModule },
            { path: 'api/v1/finance', module: InvoicesModule },
            { path: 'api/v1/finance', module: PaymentsModule },
            { path: 'api/v1/finance', module: BankWebhookModule },
            { path: 'api/v1/finance', module: VietqrModule },

            { path: 'api/v1/hr', module: TeachersModule },
            { path: 'api/v1/hr', module: TimekeepingModule },
            { path: 'api/v1/hr', module: PayrollModule },
            { path: 'api/v1/hr', module: ContractsModule },

            { path: 'api/v1/enrollment', module: ApplicationsModule },
            { path: 'api/v1/enrollment', module: LeadsModule },

            { path: 'api/v1/assignments', module: AssignmentsModule },
            { path: 'api/v1/homework', module: HomeworkModule },

            { path: 'api/v1/assets', module: AssetsModule },

            { path: 'api/v1/media', module: MediaAppModule },

            { path: 'api/v1/workflows', module: WorkflowModule },

            { path: 'api/v1/analytics', module: AnalyticsAppModule },

            { path: 'api/v1/ai', module: ChatModule },
            { path: 'api/v1/ai', module: GradingModule },

        ]),
    ],
})
export class AppModule { }
