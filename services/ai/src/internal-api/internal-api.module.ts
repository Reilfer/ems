import { Module, Global } from '@nestjs/common';
import { InternalApiService } from './internal-api.service';
import { PrismaService } from '../../../unified/src/prisma/prisma.service';

@Global()
@Module({
    providers: [
        {
            provide: 'PRISMA_SERVICE',
            useFactory: (prisma: PrismaService) => prisma,
            inject: [PrismaService],
        },
        InternalApiService,
    ],
    exports: [InternalApiService],
})
export class InternalApiModule { }
