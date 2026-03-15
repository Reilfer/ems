
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api/v1/auth');

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    app.enableCors({
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
        credentials: true,
    });

    const config = new DocumentBuilder()
        .setTitle('ReilferEDUV - Auth Service')
        .setDescription('Authentication & Authorization API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs/auth', app, document);

    const port = process.env.PORT || 3001;
    await app.listen(port);

    console.log(`🔐 Auth Service running on port ${port}`);
}

bootstrap();
