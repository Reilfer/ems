import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api/v1/workflows');

    const config = new DocumentBuilder()
        .setTitle('Workflow Service')
        .setDescription('Workflow and Process API')
        .setVersion('1.0')
        .addTag('workflows')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(3014);
}
bootstrap();
