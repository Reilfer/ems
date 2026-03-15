import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private connected = false;

    async onModuleInit() {
        try {
            await this.$connect();
            this.connected = true;
            console.log('[Prisma] ✅ Database connected');
        } catch (e) {
            console.warn('[Prisma] ⚠️  Database not available — running without DB. Frontend will use Demo Mode.');
            console.warn(`[Prisma] Error: ${(e as Error).message?.substring(0, 100)}`);
        }
    }

    async onModuleDestroy() {
        if (this.connected) {
            await this.$disconnect();
        }
    }

    isConnected(): boolean {
        return this.connected;
    }
}
