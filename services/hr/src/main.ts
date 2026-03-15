import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api/v1/hr');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.enableCors({ origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'], credentials: true });

    const config = new DocumentBuilder()
        .setTitle('ReilferEDUV - HR Service')
        .setDescription('Quản lý Nhân sự, Chấm công, Lương, Hợp đồng')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    SwaggerModule.setup('api/docs/hr', app, SwaggerModule.createDocument(app, config));

    const port = process.env.PORT || 3008;
    await app.listen(port);
    console.log(`👔 HR Service running on port ${port}`);
    console.log(`📄 Swagger: http://localhost:${port}/api/docs/hr`);
}
bootstrap();
