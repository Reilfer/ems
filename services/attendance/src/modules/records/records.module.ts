import { Module } from '@nestjs/common';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { SessionsModule } from '../sessions/sessions.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [SessionsModule, PrismaModule],
    controllers: [RecordsController],
    providers: [RecordsService],
    exports: [RecordsService],
})
export class RecordsModule { }
