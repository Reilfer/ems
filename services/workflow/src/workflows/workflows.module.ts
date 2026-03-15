import { Module } from '@nestjs/common';
import { WorkflowController } from './workflows.controller';
import { WorkflowService } from './workflows.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [WorkflowController],
    providers: [WorkflowService],
})
export class WorkflowModule { }
