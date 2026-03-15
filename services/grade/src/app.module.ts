import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GradesModule } from './modules/grades/grades.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'],
        }),
        PrismaModule,
        GradesModule,
        HealthModule,
    ],
})
export class AppModule { }
