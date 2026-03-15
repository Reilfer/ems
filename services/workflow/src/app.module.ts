import { Module } from '@nestjs/common';
import { WorkflowModule } from './workflows/workflows.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
    imports: [PrismaModule, WorkflowModule],
})
export class AppModule { }
