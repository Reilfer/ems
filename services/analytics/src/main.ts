import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
 const logger = new Logger('AnalyticsService');
 const app = await NestFactory.create(AppModule);
 app.setGlobalPrefix('api/v1/analytics');
 app.enableCors();

 const port = process.env.ANALYTICS_PORT || 3015;
 await app.listen(port);

 logger.log(`Analytics Service running on http://localhost:${port}`);
 logger.log(`Endpoints:`);
 logger.log(` GET /api/v1/analytics/dashboard — Dashboard tổng hợp (real-time)`);
 logger.log(` GET /api/v1/analytics/performance — Tổng quan năng lực`);
 logger.log(` GET /api/v1/analytics/enrollment-trends — Xu hướng tuyển sinh`);
}
bootstrap();
