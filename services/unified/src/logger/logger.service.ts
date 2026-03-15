import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';

@Injectable()
export class AppLogger implements NestLoggerService {
    private logger: winston.Logger;

    constructor() {
        const isProduction = process.env.NODE_ENV === 'production';
        const logDir = path.resolve(process.cwd(), '../../logs');

        const transports: winston.transport[] = [];

        transports.push(
            new winston.transports.Console({
                format: isProduction
                    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
                    : winston.format.combine(
                        winston.format.colorize({ all: true }),
                        winston.format.timestamp({ format: 'HH:mm:ss' }),
                        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                            const ctx = context ? `[${context}]` : '';
                            const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                            return `${timestamp} ${level} ${ctx} ${message}${extra}`;
                        }),
                    ),
            }),
        );

        transports.push(
            new (winston.transports as any).DailyRotateFile({
                dirname: logDir,
                filename: 'ems-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '14d',
                format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            }),
        );

        transports.push(
            new (winston.transports as any).DailyRotateFile({
                dirname: logDir,
                filename: 'ems-error-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '30d',
                level: 'error',
                format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            }),
        );

        this.logger = winston.createLogger({
            level: isProduction ? 'info' : 'debug',
            defaultMeta: { service: 'ems-unified' },
            transports,
        });
    }

    log(message: string, context?: string) {
        this.logger.info(message, { context });
    }

    error(message: string, trace?: string, context?: string) {
        this.logger.error(message, { trace, context });
    }

    warn(message: string, context?: string) {
        this.logger.warn(message, { context });
    }

    debug(message: string, context?: string) {
        this.logger.debug(message, { context });
    }

    verbose(message: string, context?: string) {
        this.logger.verbose(message, { context });
    }
}
