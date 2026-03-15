
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionsService } from '../sessions/sessions.service';

const GEOFENCE_RADIUS_M = parseInt(process.env.GEOFENCE_RADIUS || '5000000');
const SCHOOL_LAT = parseFloat(process.env.SCHOOL_LAT || '10.7769');
const SCHOOL_LNG = parseFloat(process.env.SCHOOL_LNG || '106.7009');
const MAX_TIME_DRIFT_MIN = parseInt(process.env.MAX_TIME_DRIFT || '10');
const MAX_SPEED_MPS = 50; 

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface LocationIntegrity {
    isMocked: boolean;          
    accuracy: number;           
    altitude: number | null;    
    provider: string;           
    speed: number | null;       
    hasAccelerometer: boolean;  
    accelMagnitude: number;     
    heading: number | null;     
    appList?: string[];         
}

export interface ScanRequest {
    sessionId: string;
    studentId: string;
    qrPayload: string;
    qrSignature: string;
    deviceTimestamp: string;
    deviceLat?: number;
    deviceLng?: number;

    locationIntegrity?: LocationIntegrity;
    deviceFingerprint?: string; 
}

export interface ScanResult {
    success: boolean;
    record?: any;
    failures: string[];
    checks: {
        time: boolean;
        geo: boolean;
        session: boolean;
        duplicate: boolean;
        hmac: boolean;
        locationReal: boolean;  
    };
    riskScore?: number; 
}

const studentLocationHistory = new Map<string, {
    lat: number; lng: number; timestamp: number;
}>();

const FAKE_GPS_APPS = [
    'com.lexa.fakegps', 'com.incorporateapps.fakegps',
    'com.fakegps.mock', 'com.lkr.fakelocation',
    'com.location.faker', 'com.theappninjas.fakegpsjoystick',
    'com.evezzon.fakegps', 'org.hola.gpslocation',
    'com.position.faker', 'fake.gps.location',
];

@Injectable()
export class RecordsService {
    constructor(
        private prisma: PrismaService,
        private sessions: SessionsService,
    ) { }

    private analyzeLocationIntegrity(
        integrity: LocationIntegrity | undefined,
        studentId: string,
        lat?: number, lng?: number,
    ): { score: number; reasons: string[] } {
        if (!integrity) return { score: 0, reasons: [] };

        let score = 0;
        const reasons: string[] = [];

        if (integrity.isMocked) {
            score += 80;
            reasons.push('Phat hien che do vi tri gia (Mock Location ON)');
        }

        if (integrity.appList && integrity.appList.length > 0) {
            const fakeApps = integrity.appList.filter(app =>
                FAKE_GPS_APPS.some(fake => app.toLowerCase().includes(fake.toLowerCase()))
            );
            if (fakeApps.length > 0) {
                score += 60;
                reasons.push(`Phat hien app gia lap GPS: ${fakeApps.join(', ')}`);
            }
        }

        if (integrity.accuracy <= 1) {
            score += 40;
            reasons.push(`Do chinh xac GPS bat thuong: ${integrity.accuracy}m (qua chinh xac — GPS that thuong 3-15m)`);
        } else if (integrity.accuracy > 100) {
            score += 10; 
            reasons.push(`Do chinh xac GPS kem: ${integrity.accuracy}m`);
        }

        if (integrity.altitude === 0 || integrity.altitude === null) {
            score += 15;
            reasons.push('Khong co du lieu do cao (fake GPS thuong khong co altitude)');
        }

        if (integrity.speed !== null && integrity.speed === 0 && lat && lng) {
            const lastLoc = studentLocationHistory.get(studentId);
            if (lastLoc) {
                const dist = haversineDistance(lastLoc.lat, lastLoc.lng, lat, lng);
                if (dist > 50) { 
                    score += 30;
                    reasons.push(`Toc do = 0 nhung vi tri thay doi ${dist.toFixed(0)}m — bat thuong`);
                }
            }
        }

        if (lat && lng) {
            const lastLoc = studentLocationHistory.get(studentId);
            if (lastLoc) {
                const dist = haversineDistance(lastLoc.lat, lastLoc.lng, lat, lng);
                const timeDiffSec = (Date.now() - lastLoc.timestamp) / 1000;
                if (timeDiffSec > 0 && timeDiffSec < 300) { 
                    const speed = dist / timeDiffSec; 
                    if (speed > MAX_SPEED_MPS) {
                        score += 50;
                        reasons.push(`Di chuyen bat thuong: ${dist.toFixed(0)}m trong ${timeDiffSec.toFixed(0)}s = ${(speed * 3.6).toFixed(0)} km/h (gioi han ${MAX_SPEED_MPS * 3.6} km/h)`);
                    }
                }
            }

            studentLocationHistory.set(studentId, { lat, lng, timestamp: Date.now() });
        }

        if (integrity.hasAccelerometer === false) {
            score += 25;
            reasons.push('Thiet bi khong co cam bien gia toc (co the la may ao)');
        } else if (integrity.accelMagnitude < 5 || integrity.accelMagnitude > 15) {

            if (integrity.accelMagnitude < 1) {
                score += 20;
                reasons.push(`Gia tri accelerometer bat thuong: ${integrity.accelMagnitude.toFixed(1)} m/s^2 (binh thuong: ~9.8)`);
            }
        }

        if (integrity.provider === 'unknown' || !integrity.provider) {
            score += 15;
            reasons.push('Nguon vi tri khong xac dinh (provider unknown)');
        }

        return { score: Math.min(score, 100), reasons };
    }

    async scanQR(req: ScanRequest): Promise<ScanResult> {
        const failures: string[] = [];
        const checks = { time: true, geo: true, session: true, duplicate: true, hmac: true, locationReal: true };

        const hmacValid = this.sessions.verifyQR(req.qrPayload, req.qrSignature);
        if (!hmacValid) {
            checks.hmac = false;
            failures.push('Invalid HMAC-SHA256 signature — QR may be forged');
        }

        if (!this.sessions.isSessionActive(req.sessionId)) {
            if (hmacValid) {

                const payloadParts = req.qrPayload.split('|');
                const classId = payloadParts.length > 2 ? payloadParts[2] : req.sessionId;
                this.sessions.registerExternalSession(req.sessionId, classId);

            } else {
                checks.session = false;
                failures.push('Session not active — teacher has not activated QR');
            }
        }

        const deviceTime = new Date(req.deviceTimestamp).getTime();
        const serverTime = Date.now();
        const driftMin = Math.abs(deviceTime - serverTime) / 60000;
        if (driftMin > MAX_TIME_DRIFT_MIN) {
            checks.time = false;
            failures.push(`Device clock drift: ${driftMin.toFixed(1)} min (max ${MAX_TIME_DRIFT_MIN} min)`);
        }

        if (req.deviceLat !== undefined && req.deviceLng !== undefined) {
            const dist = haversineDistance(SCHOOL_LAT, SCHOOL_LNG, req.deviceLat, req.deviceLng);
            if (dist > GEOFENCE_RADIUS_M) {
                checks.geo = false;
                failures.push(`Outside geofence: ${(dist / 1000).toFixed(1)} km from school (max ${GEOFENCE_RADIUS_M}m)`);
            }
        }

        if (this.sessions.isStudentScanned(req.sessionId, req.studentId)) {
            checks.duplicate = false;
            failures.push('Student already scanned in this session');
        }

        const locationAnalysis = this.analyzeLocationIntegrity(
            req.locationIntegrity, req.studentId, req.deviceLat, req.deviceLng,
        );
        const riskScore = locationAnalysis.score;

        if (riskScore >= 60) {
            checks.locationReal = false;
            failures.push(`Vi tri bi nghi la gia (risk score: ${riskScore}/100)`);
            failures.push(...locationAnalysis.reasons);
        } else if (riskScore >= 30) {
            failures.push(`[CANH BAO] Vi tri co dau hieu bat thuong (risk score: ${riskScore}/100): ${locationAnalysis.reasons.join('; ')}`);
        }

        const allPassed = Object.values(checks).every(v => v);
        if (!allPassed) {
            return { success: false, failures, checks, riskScore };
        }

        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const status = (hour > 7 || (hour === 7 && minute > 15)) ? 'LATE' : 'PRESENT';

        const existingSession = await this.prisma.attendanceSession.findUnique({
            where: { id: req.sessionId },
        });

        if (!existingSession) {

            const payloadParts = req.qrPayload.split('|');
            const payloadClassId = payloadParts.length > 2 ? payloadParts[2] : null;

            let firstClass = payloadClassId
                ? await this.prisma.class.findFirst({ where: { id: payloadClassId } })
                : null;
            if (!firstClass) {
                firstClass = await this.prisma.class.findFirst();
            }

            let firstUser = await this.prisma.user.findFirst({
                where: { role: { in: ['admin', 'SCHOOL_ADMIN', 'TEACHER'] } },
            });
            if (!firstUser) {
                firstUser = await this.prisma.user.findFirst();
            }

            if (firstClass && firstUser) {
                try {
                    await this.prisma.attendanceSession.create({
                        data: {
                            id: req.sessionId,
                            schoolId: firstClass.schoolId,
                            classId: firstClass.id,
                            teacherId: firstUser.id,
                            type: 'qr',
                            status: 'open',
                        },
                    });
                } catch (e: any) {
                    if (!e.message?.includes('Unique constraint')) {
                        return { success: false, failures: [`Cannot create session: ${e.message}`], checks, riskScore };
                    }
                }
            } else {
                return { success: false, failures: ['No class or teacher found in database to link session'], checks, riskScore };
            }
        }

        let resolvedStudentId = req.studentId;
        const studentById = await this.prisma.student.findUnique({ where: { id: req.studentId } });
        if (!studentById) {
            const studentByUser = await this.prisma.student.findFirst({ where: { userId: req.studentId } });
            if (studentByUser) {
                resolvedStudentId = studentByUser.id;
            } else {
                const anyStudent = await this.prisma.student.findFirst();
                if (anyStudent) {
                    resolvedStudentId = anyStudent.id;
                } else {
                    return { success: false, failures: ['Student not found in database'], checks, riskScore };
                }
            }
        }

        const recordData = {
            status,
            method: 'QR',
            note: riskScore > 0
                ? `QR scan | risk=${riskScore} | ${locationAnalysis.reasons.join('; ')}`
                : `QR scan at ${now.toISOString()}`,
            checkInTime: now,
        };

        try {

            const record = await this.prisma.attendanceRecord.upsert({
                where: {
                    sessionId_studentId: {
                        sessionId: req.sessionId,
                        studentId: resolvedStudentId,
                    },
                },
                create: {
                    sessionId: req.sessionId,
                    studentId: resolvedStudentId,
                    ...recordData,
                },
                update: recordData,
            });

            this.sessions.markStudentScanned(req.sessionId, req.studentId);

            return { success: true, record, failures: [], checks, riskScore };
        } catch (e: any) {
            return { success: false, failures: [`DB error: ${e.message}`], checks, riskScore };
        }

    }

    async syncOfflineRecords(records: Array<{
        studentId: string;
        sessionId: string;
        timestamp: string;
        encryptedData?: string;
    }>) {
        const results: any[] = [];

        for (const rec of records) {
            try {
                const record = await this.prisma.attendanceRecord.create({
                    data: {
                        sessionId: rec.sessionId,
                        studentId: rec.studentId,
                        status: 'PRESENT',
                        note: `Offline sync at ${new Date().toISOString()}`,
                        checkInTime: new Date(rec.timestamp),
                    },
                });
                results.push({ studentId: rec.studentId, success: true, record });
            } catch (err: any) {
                results.push({ studentId: rec.studentId, success: false, error: err.message });
            }
        }

        return { synced: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, results };
    }

    async getRecords(filters: { classId?: string; date?: string; sessionId?: string }) {
        const where: any = {};
        if (filters.sessionId) where.sessionId = filters.sessionId;
        if (filters.date) {
            const start = new Date(filters.date); start.setHours(0, 0, 0, 0);
            const end = new Date(filters.date); end.setHours(23, 59, 59, 999);
            where.checkedAt = { gte: start, lte: end };
        }

        return this.prisma.attendanceRecord.findMany({
            where,
            include: { student: true, session: true },
            orderBy: { checkedAt: 'desc' },
        });
    }
}
