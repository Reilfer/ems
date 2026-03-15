import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api/v1/assets');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    const config = new DocumentBuilder()
        .setTitle('Asset Service')
        .setDescription('The Asset API description')
        .setVersion('1.0')
        .addTag('assets')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(3012);
}
bootstrap();
