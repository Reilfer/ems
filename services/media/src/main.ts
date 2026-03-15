import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api/v1/media');
    app.enableCors(); 

    const config = new DocumentBuilder()
        .setTitle('Media Service')
        .setDescription('File upload and serving')
        .setVersion('1.0')
        .addTag('media')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(3013);
}
bootstrap();
