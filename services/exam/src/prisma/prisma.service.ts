import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private connected = false;

    async onModuleInit() {
        try {
            await this.$connect();
            this.connected = true;
        } catch (e) {
            console.warn('[Prisma] ⚠️  Database not available — app continues without DB.');
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
