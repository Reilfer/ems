import { Module } from '@nestjs/common';
import { TimekeepingController } from './timekeeping.controller';
import { TimekeepingService } from './timekeeping.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TimekeepingController],
    providers: [TimekeepingService],
    exports: [TimekeepingService],
})
export class TimekeepingModule { }
