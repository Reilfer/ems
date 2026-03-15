import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
 const app = await NestFactory.create(AppModule);
 app.setGlobalPrefix('api/v1/exams');
 app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
 app.enableCors({ origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'], credentials: true });

 const config = new DocumentBuilder()
 .setTitle('ReilferEDUV - Exam Service')
 .setDescription('Thi trực tuyến, Ngân hàng đề & Chấm tự động')
 .setVersion('1.0').addBearerAuth().build();
 SwaggerModule.setup('api/docs/exam', app, SwaggerModule.createDocument(app, config));

 const port = process.env.PORT || 3010;
 await app.listen(port);
 console.log(`Exam Service running on port ${port}`);
}
bootstrap();
