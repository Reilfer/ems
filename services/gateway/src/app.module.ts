import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Module({})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }))
            .forRoutes('/api/v1/auth');

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }))
            .forRoutes('/api/v1/students');

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3003', changeOrigin: true }))
            .forRoutes('/api/v1/attendance');

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3004', changeOrigin: true }))
            .forRoutes('/api/v1/schedule');

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3005', changeOrigin: true }))
            .forRoutes('/api/v1/grades');

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3006', changeOrigin: true }))
            .forRoutes('/api/v1/notifications');

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3007', changeOrigin: true }))
            .forRoutes('/api/v1/finance');

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3008', changeOrigin: true }))
            .forRoutes('/api/v1/hr', '/api/v1/teachers');

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3009', changeOrigin: true }))
            .forRoutes('/api/v1/enrollment');

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3010', changeOrigin: true }))
            .forRoutes('/api/v1/exams');

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3011', changeOrigin: true }))
            .forRoutes('/api/v1/assignments');

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3012', changeOrigin: true }))
            .forRoutes('/api/v1/assets');

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3013', changeOrigin: true }))
            .forRoutes('/api/v1/media', '/uploads');

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3014', changeOrigin: true }))
            .forRoutes('/api/v1/workflows');

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3015', changeOrigin: true }))
            .forRoutes('/api/v1/analytics');

        consumer
            .apply(createProxyMiddleware({ target: 'http://localhost:3016', changeOrigin: true }))
            .forRoutes('/api/v1/ai');
    }
}
