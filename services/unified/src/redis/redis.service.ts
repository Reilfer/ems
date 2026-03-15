import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: Redis | null = null;
    private connected = false;

    async onModuleInit() {
        try {
            this.client = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD || undefined,
                db: parseInt(process.env.REDIS_DB || '0'),
                maxRetriesPerRequest: 1,
                retryStrategy: () => null, 
                lazyConnect: true,
                enableOfflineQueue: false,
            });

            this.client.on('error', () => { });

            await this.client.connect();
            this.connected = true;
            console.log('[Redis] ✅ Connected successfully');
        } catch (e) {
            console.warn('[Redis] ⚠️  Not available — cache disabled, app continues normally');
            if (this.client) {
                this.client.disconnect();
            }
            this.client = null;
            this.connected = false;
        }
    }

    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit().catch(() => { });
        }
    }

    isConnected(): boolean {
        return this.connected;
    }

    async get<T = string>(key: string): Promise<T | null> {
        if (!this.client || !this.connected) return null;
        try {
            const val = await this.client.get(key);
            if (!val) return null;
            try { return JSON.parse(val); } catch { return val as unknown as T; }
        } catch {
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        if (!this.client || !this.connected) return;
        try {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.set(key, serialized, 'EX', ttlSeconds);
            } else {
                await this.client.set(key, serialized);
            }
        } catch {  }
    }

    async del(key: string): Promise<void> {
        if (!this.client || !this.connected) return;
        try { await this.client.del(key); } catch {  }
    }

    async delPattern(pattern: string): Promise<void> {
        if (!this.client || !this.connected) return;
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) await this.client.del(...keys);
        } catch {  }
    }

    getClient(): Redis | null {
        return this.client;
    }
}
