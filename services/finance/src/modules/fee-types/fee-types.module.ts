import { Module } from '@nestjs/common';
import { FeeTypesController } from './fee-types.controller';
import { FeeTypesService } from './fee-types.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FeeTypesController],
    providers: [FeeTypesService],
    exports: [FeeTypesService],
})
export class FeeTypesModule { }
