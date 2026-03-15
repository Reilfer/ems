import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

export interface JobData {
    type: string;
    payload: Record<string, any>;
    createdAt: string;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
    private queues = new Map<string, Queue>();
    private workers = new Map<string, Worker>();
    private enabled = false;

    static readonly NOTIFICATION = 'notification';
    static readonly EMAIL = 'email';
    static readonly REPORT = 'report';

    private async isRedisAvailable(): Promise<boolean> {
        const client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || undefined,
            db: parseInt(process.env.REDIS_DB || '0'),
            maxRetriesPerRequest: 1,
            retryStrategy: () => null,
            lazyConnect: true,
            connectTimeout: 3000,
        });
        client.on('error', () => { });

        try {
            await client.connect();
            await client.ping();
            await client.quit().catch(() => { });
            return true;
        } catch {
            client.disconnect();
            return false;
        }
    }

    async onModuleInit() {

        const available = await this.isRedisAvailable();
        if (!available) {
            console.warn('[Queue] ⚠️  Redis not available — job queues disabled. App continues normally.');
            return;
        }

        const connection = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || undefined,
            db: parseInt(process.env.REDIS_DB || '0'),
        };
        const queueNames = [QueueService.NOTIFICATION, QueueService.EMAIL, QueueService.REPORT];

        try {
            for (const name of queueNames) {
                const queue = new Queue(name, {
                    connection,
                    defaultJobOptions: {
                        removeOnComplete: { count: 100 },
                        removeOnFail: { count: 50 },
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 2000 },
                    },
                });
                this.queues.set(name, queue);

                const worker = new Worker(name, async (job: Job<JobData>) => {
                    await this.processJob(name, job);
                }, {
                    connection,
                    concurrency: 5,
                });

                worker.on('completed', (job) => {
                    console.log(`[Queue:${name}] Job ${job.id} completed`);
                });
                worker.on('failed', (job, err) => {
                    console.error(`[Queue:${name}] Job ${job?.id} failed: ${err.message}`);
                });

                this.workers.set(name, worker);
            }

            this.enabled = true;
            console.log(`[Queue] ✅ Initialized ${queueNames.length} queues (notification, email, report)`);
        } catch (e) {
            console.warn(`[Queue] ⚠️  Failed to initialize queues. App continues normally.`);
            this.enabled = false;
        }
    }

    async onModuleDestroy() {
        for (const [, worker] of this.workers) {
            await worker.close().catch(() => { });
        }
        for (const [, queue] of this.queues) {
            await queue.close().catch(() => { });
        }
    }

    async addJob(queueName: string, data: JobData, options?: { delay?: number; priority?: number }) {
        const queue = this.queues.get(queueName);
        if (!queue || !this.enabled) return null;

        try {
            return await queue.add(data.type, data, {
                delay: options?.delay,
                priority: options?.priority,
            });
        } catch {
            return null;
        }
    }

    async getStats(queueName: string) {
        const queue = this.queues.get(queueName);
        if (!queue || !this.enabled) return null;

        try {
            const [waiting, active, completed, failed] = await Promise.all([
                queue.getWaitingCount(),
                queue.getActiveCount(),
                queue.getCompletedCount(),
                queue.getFailedCount(),
            ]);
            return { queueName, waiting, active, completed, failed };
        } catch {
            return null;
        }
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    private async processJob(queueName: string, job: Job<JobData>) {
        switch (queueName) {
            case QueueService.NOTIFICATION:
                console.log(`[Notification] Processing: ${job.data.type}`, job.data.payload);
                break;
            case QueueService.EMAIL:
                console.log(`[Email] Processing: ${job.data.type}`, job.data.payload);
                break;
            case QueueService.REPORT:
                console.log(`[Report] Processing: ${job.data.type}`, job.data.payload);
                break;
        }
    }
}
