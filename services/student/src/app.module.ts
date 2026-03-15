import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StudentsModule } from './modules/students/students.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'],
        }),
        PrismaModule,
        StudentsModule,
        HealthModule,
    ],
})
export class AppModule { }
