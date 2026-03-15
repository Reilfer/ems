import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { FeeTypesModule } from '../fee-types/fee-types.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [FeeTypesModule, PrismaModule],
    controllers: [InvoicesController],
    providers: [InvoicesService],
    exports: [InvoicesService],
})
export class InvoicesModule { }
