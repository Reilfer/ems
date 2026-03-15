import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MediaController } from './media/media.controller';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'uploads'), 
            serveRoot: '/uploads', 
        }),
    ],
    controllers: [MediaController],
})
export class AppModule { }
