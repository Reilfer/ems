import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppLogger } from './logger/logger.service';
import * as compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    const logger = app.get(AppLogger);
    app.useLogger(logger);

    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });

    app.use(helmet());
    app.use(compression());

    const config = new DocumentBuilder()
        .setTitle('EMS — Education Management System')
        .setDescription(`
## API Documentation

Hệ thống quản lý giáo dục toàn diện — Unified Service API.

### Modules
| Module | Prefix | Description |
|--------|--------|-------------|
| Auth | /api/v1/auth | Đăng nhập, đăng ký, JWT |
| Students | /api/v1/students | Quản lý học sinh |
| Attendance | /api/v1/attendance | Điểm danh QR/Manual |
| Schedule | /api/v1/schedule | Thời khóa biểu, sự kiện |
| Grades | /api/v1/grades | Bảng điểm |
| Finance | /api/v1/finance | Học phí, thanh toán |
| HR | /api/v1/hr | Nhân sự, lương, chấm công |
| Enrollment | /api/v1/enrollment | Tuyển sinh, CRM |
| Notifications | /api/v1/notifications | Thông báo |
| Assets | /api/v1/assets | Tài sản |
| AI | /api/v1/ai | AI Chat Assistant |
   `)
        .setVersion('1.0.0')
        .addBearerAuth(
            { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Enter JWT token' },
            'JWT-auth',
        )
        .addTag('Health', 'System health checks')
        .addTag('Auth', 'Authentication & Authorization')
        .addTag('Users', 'User management')
        .addTag('Students', 'Student management')
        .addTag('Attendance', 'Attendance tracking')
        .addTag('Schedule', 'Timetable & Events')
        .addTag('Grades', 'Score management')
        .addTag('Finance', 'Invoices & Payments')
        .addTag('HR', 'Teachers, Payroll, Contracts')
        .addTag('Enrollment', 'Applications & Leads')
        .addTag('Notifications', 'Push & In-app notifications')
        .addTag('Assets', 'Asset management')
        .addTag('AI', 'AI-powered features')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'none',
            filter: true,
            showRequestDuration: true,
        },
        customSiteTitle: 'EMS API Documentation',
    });

    app.use((req: any, res: any, next: any) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            if (!req.url.includes('/health') && !req.url.includes('/api/docs')) {
                logger.log(
                    `${req.method} ${req.url} ${res.statusCode} ${duration}ms`,
                    'HTTP',
                );
            }
        });
        next();
    });

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    logger.log(`Unified Service running on: http://0.0.0.0:${port} (LAN accessible)`, 'Bootstrap');
    logger.log(`Swagger API Docs: http://localhost:${port}/api/docs`, 'Bootstrap');
    logger.log(`Health Check: http://localhost:${port}/health`, 'Bootstrap');
}
bootstrap();
