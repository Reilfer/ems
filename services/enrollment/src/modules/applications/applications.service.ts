import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto, UpdateStatusDto } from './applications.dto';

export interface ApplicationRecord {
    id: string; schoolId: string; applicationCode: string;
    studentName: string; dateOfBirth: string | null; gender: string;
    parentName: string; parentPhone: string; parentEmail: string | null;
    gradeApplying: number; previousSchool: string | null;
    status: string; source: string; notes: string | null;
    createdAt: string; updatedAt: string;
}

const demoApps: ApplicationRecord[] = [
    { id: 'app1', schoolId: 'school1', applicationCode: 'TS-2026-001', studentName: 'Nguyễn Minh Anh', dateOfBirth: '2016-05-12', gender: 'female', parentName: 'Nguyễn Văn Tùng', parentPhone: '0901234567', parentEmail: 'tung@gmail.com', gradeApplying: 1, previousSchool: null, status: 'accepted', source: 'website', notes: null, createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-01-20T00:00:00Z' },
    { id: 'app2', schoolId: 'school1', applicationCode: 'TS-2026-002', studentName: 'Trần Gia Bảo', dateOfBirth: '2015-08-20', gender: 'male', parentName: 'Trần Văn Minh', parentPhone: '0912345678', parentEmail: 'minh.tv@gmail.com', gradeApplying: 2, previousSchool: 'TH Lê Văn Tám', status: 'reviewing', source: 'referral', notes: 'Học sinh giỏi năm trước', createdAt: '2026-01-18T00:00:00Z', updatedAt: '2026-01-18T00:00:00Z' },
    { id: 'app3', schoolId: 'school1', applicationCode: 'TS-2026-003', studentName: 'Lê Thị Thanh Trúc', dateOfBirth: '2016-11-03', gender: 'female', parentName: 'Lê Hoàng Phúc', parentPhone: '0923456789', parentEmail: null, gradeApplying: 1, previousSchool: null, status: 'submitted', source: 'event', notes: null, createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
    { id: 'app4', schoolId: 'school1', applicationCode: 'TS-2026-004', studentName: 'Phạm Đức Huy', dateOfBirth: '2014-03-25', gender: 'male', parentName: 'Phạm Thị Nga', parentPhone: '0934567890', parentEmail: 'nga.pt@gmail.com', gradeApplying: 3, previousSchool: 'TH Nguyễn Du', status: 'interview', source: 'social_media', notes: null, createdAt: '2026-02-05T00:00:00Z', updatedAt: '2026-02-08T00:00:00Z' },
    { id: 'app5', schoolId: 'school1', applicationCode: 'TS-2026-005', studentName: 'Hoàng Yến Nhi', dateOfBirth: '2015-07-14', gender: 'female', parentName: 'Hoàng Văn Sơn', parentPhone: '0945678901', parentEmail: 'son.hv@gmail.com', gradeApplying: 2, previousSchool: 'TH Kim Đồng', status: 'rejected', source: 'website', notes: 'Hết chỉ tiêu', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-25T00:00:00Z' },
];
let appCounter = demoApps.length;

@Injectable()
export class ApplicationsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters: { status?: string; grade?: number; search?: string } = {}) {
        let result = [...demoApps];
        if (filters.status) result = result.filter(a => a.status === filters.status);
        if (filters.grade) result = result.filter(a => a.gradeApplying === Number(filters.grade));
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(a => a.studentName.toLowerCase().includes(q) || a.parentName.toLowerCase().includes(q) || a.applicationCode.toLowerCase().includes(q));
        }
        return { data: result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), meta: { total: result.length } };
    }

    async findById(id: string) {
        const app = demoApps.find(a => a.id === id);
        if (!app) throw new NotFoundException('Không tìm thấy hồ sơ');
        return app;
    }

    async create(dto: CreateApplicationDto) {
        appCounter++;
        const code = `TS-${new Date().getFullYear()}-${String(appCounter).padStart(3, '0')}`;
        const app: ApplicationRecord = {
            id: `app${appCounter}`, schoolId: dto.schoolId, applicationCode: code,
            studentName: `${dto.studentFirstName} ${dto.studentLastName}`,
            dateOfBirth: dto.dateOfBirth || null, gender: dto.gender || '',
            parentName: dto.parentName, parentPhone: dto.parentPhone, parentEmail: dto.parentEmail || null,
            gradeApplying: dto.gradeApplying, previousSchool: dto.previousSchool || null,
            status: 'submitted', source: dto.source || 'website', notes: dto.notes || null,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        demoApps.push(app);
        return app;
    }

    async updateStatus(id: string, dto: UpdateStatusDto) {
        const idx = demoApps.findIndex(a => a.id === id);
        if (idx === -1) throw new NotFoundException('Không tìm thấy hồ sơ');
        demoApps[idx].status = dto.status;
        if (dto.notes) demoApps[idx].notes = dto.notes;
        demoApps[idx].updatedAt = new Date().toISOString();
        return demoApps[idx];
    }

    async getStats() {
        const total = demoApps.length;
        const byStatus: Record<string, number> = {};
        demoApps.forEach(a => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
        const bySource: Record<string, number> = {};
        demoApps.forEach(a => { bySource[a.source] = (bySource[a.source] || 0) + 1; });
        const acceptRate = total > 0 ? Math.round((byStatus['accepted'] || 0) / total * 100) : 0;
        return { total, byStatus, bySource, acceptanceRate: acceptRate };
    }
}
