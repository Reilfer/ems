import { Module } from '@nestjs/common';
import { VietqrController } from './vietqr.controller';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
    imports: [InvoicesModule],
    controllers: [VietqrController],
})
export class VietqrModule { }
