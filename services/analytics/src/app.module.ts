import { Module } from '@nestjs/common';
import { DashboardController, PerformanceController, EnrollmentController, AnalyticsService } from './analytics.service';

@Module({
    controllers: [DashboardController, PerformanceController, EnrollmentController],
    providers: [AnalyticsService],
})
export class AppModule { }
