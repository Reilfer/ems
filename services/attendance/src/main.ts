import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
 const app = await NestFactory.create(AppModule);
 app.setGlobalPrefix('api/v1/attendance');
 app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
 app.enableCors({ origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'], credentials: true });

 const config = new DocumentBuilder()
 .setTitle('ReilferEDUV - Attendance Service')
 .setDescription('Điểm danh QR + Anti-Cheat + Offline Sync')
 .setVersion('1.0').addBearerAuth().build();
 SwaggerModule.setup('api/docs/attendance', app, SwaggerModule.createDocument(app, config));

 const port = process.env.PORT || 3005;
 await app.listen(port);
 console.log(`Attendance Service running on port ${port}`);
 console.log(`Swagger: http://localhost:${port}/api/docs/attendance`);
}
bootstrap();
