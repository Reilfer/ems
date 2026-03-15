
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createHmac, randomBytes } from 'crypto';

const QR_SECRET = process.env.QR_SECRET || 'ReilferEDUV-2026-SecretKey-QR-Attendance';
const QR_TTL_SECONDS = 20;
const SCHOOL_LAT = parseFloat(process.env.SCHOOL_LAT || '10.7769');
const SCHOOL_LNG = parseFloat(process.env.SCHOOL_LNG || '106.7009');

@Injectable()
export class SessionsService {

    private activeSessions = new Map<string, {
        sessionId: string;
        classId: string;
        activatedAt: number;
        qrPayload: string;
        qrSignature: string;
        qrGeneratedAt: number;
        scannedStudents: Set<string>;
    }>();

    constructor(private prisma: PrismaService) { }

    async createSession(schoolId: string, classId: string, teacherId: string) {
        const session = await this.prisma.attendanceSession.create({
            data: {
                schoolId,
                classId,
                teacherId,
                sessionDate: new Date(),
                type: 'qr',
                status: 'open',
            },
        });
        return session;
    }

    async activateSession(sessionId: string) {
        const session = await this.prisma.attendanceSession.findUnique({ where: { id: sessionId } });
        if (!session) throw new BadRequestException('Session not found');

        const qr = this.generateQR(sessionId, session.classId);
        this.activeSessions.set(sessionId, {
            sessionId,
            classId: session.classId,
            activatedAt: Date.now(),
            ...qr,
            scannedStudents: new Set(),
        });
        return { sessionId, ...qr };
    }

    deactivateSession(sessionId: string) {
        this.activeSessions.delete(sessionId);
        return { sessionId, active: false };
    }

    generateQR(sessionId: string, classId: string) {
        const serverTime = Date.now();
        const nonce = randomBytes(8).toString('hex');
        const payload = `EDUV2|${sessionId}|${classId}|${serverTime}|${nonce}|${SCHOOL_LAT}|${SCHOOL_LNG}`;
        const signature = createHmac('sha256', QR_SECRET).update(payload).digest('hex');
        return { qrPayload: payload, qrSignature: signature, qrGeneratedAt: serverTime };
    }

    refreshQR(sessionId: string) {
        const active = this.activeSessions.get(sessionId);
        if (!active) throw new BadRequestException('Session not active');

        const qr = this.generateQR(sessionId, active.classId);
        active.qrPayload = qr.qrPayload;
        active.qrSignature = qr.qrSignature;
        active.qrGeneratedAt = qr.qrGeneratedAt;
        return qr;
    }

    verifyQR(payload: string, signature: string): boolean {
        const expected = createHmac('sha256', QR_SECRET).update(payload).digest('hex');

        if (signature.length < 64) {
            return expected.startsWith(signature);
        }
        return expected === signature;
    }

    isSessionActive(sessionId: string): boolean {
        return this.activeSessions.has(sessionId);
    }

    getActiveSession(sessionId: string) {
        return this.activeSessions.get(sessionId);
    }

    getActiveSessions() {
        return Array.from(this.activeSessions.values()).map(s => ({
            sessionId: s.sessionId,
            classId: s.classId,
            activatedAt: s.activatedAt,
            scannedCount: s.scannedStudents.size,
            qrGeneratedAt: s.qrGeneratedAt,
        }));
    }

    registerExternalSession(sessionId: string, classId: string) {
        if (this.activeSessions.has(sessionId)) return;
        this.activeSessions.set(sessionId, {
            sessionId,
            classId,
            activatedAt: Date.now(),
            qrPayload: '',
            qrSignature: '',
            qrGeneratedAt: Date.now(),
            scannedStudents: new Set(),
        });
    }

    markStudentScanned(sessionId: string, studentId: string): boolean {
        const session = this.activeSessions.get(sessionId);
        if (!session) return false;
        if (session.scannedStudents.has(studentId)) return false; 
        session.scannedStudents.add(studentId);
        return true;
    }

    isStudentScanned(sessionId: string, studentId: string): boolean {
        return this.activeSessions.get(sessionId)?.scannedStudents.has(studentId) || false;
    }
}
