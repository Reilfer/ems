import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
 const app = await NestFactory.create(AppModule);
 app.setGlobalPrefix('api');
 app.enableCors();
 app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

 const config = new DocumentBuilder()
 .setTitle('ReilferEDUV Finance Service')
 .setDescription('Finance, Invoices, Payments, Auto Bank, VietQR')
 .setVersion('0.1.0')
 .addBearerAuth()
 .build();
 SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

 const port = process.env.PORT || 3004;
 await app.listen(port);
 console.log(`Finance Service running on http://localhost:${port}`);
 console.log(`Swagger: http://localhost:${port}/docs`);
}
bootstrap();
