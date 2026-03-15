import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';

@Module({
    imports: [

        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'],
        }),

        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000,    
                limit: 3,     
            },
            {
                name: 'medium',
                ttl: 60000,   
                limit: 20,    
            },
            {
                name: 'long',
                ttl: 900000,  
                limit: 100,   
            },
        ]),

        PrismaModule,
        AuthModule,
        UsersModule,
        HealthModule,
    ],
})
export class AppModule { }
