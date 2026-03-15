import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
 const app = await NestFactory.create(AppModule);
 app.setGlobalPrefix('api/v1/schedule');
 app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
 app.enableCors({ origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'], credentials: true });

 const config = new DocumentBuilder()
 .setTitle('ReilferEDUV - Schedule Service')
 .setDescription('Thời khóa biểu, Lịch thi & Sự kiện')
 .setVersion('1.0').addBearerAuth().build();
 SwaggerModule.setup('api/docs/schedule', app, SwaggerModule.createDocument(app, config));

 const port = process.env.PORT || 3006;
 await app.listen(port);
 console.log(`Schedule Service running on port ${port}`);
 console.log(`Swagger: http://localhost:${port}/api/docs/schedule`);
}
bootstrap();
