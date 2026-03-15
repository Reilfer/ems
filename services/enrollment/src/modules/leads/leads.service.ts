import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto } from './leads.dto';

export interface LeadRecord {
    id: string; schoolId: string; parentName: string; phone: string;
    email: string | null; studentName: string | null; gradeInterest: number | null;
    source: string; status: string; assignedTo: string | null;
    lastContactDate: string | null; notes: string | null;
    createdAt: string; updatedAt: string;
}

const demoLeads: LeadRecord[] = [
    { id: 'l1', schoolId: 'school1', parentName: 'Nguyễn Thị Hoa', phone: '0901111111', email: 'hoa@gmail.com', studentName: 'Nguyễn Minh Khôi', gradeInterest: 1, source: 'website', status: 'interested', assignedTo: null, lastContactDate: '2026-02-10', notes: 'Đã gọi, hẹn tham quan', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-10T00:00:00Z' },
    { id: 'l2', schoolId: 'school1', parentName: 'Trần Văn Dũng', phone: '0912222222', email: null, studentName: 'Trần Thu Hà', gradeInterest: 3, source: 'referral', status: 'visiting', assignedTo: null, lastContactDate: '2026-02-09', notes: null, createdAt: '2026-01-28T00:00:00Z', updatedAt: '2026-02-09T00:00:00Z' },
    { id: 'l3', schoolId: 'school1', parentName: 'Lê Thị Mai', phone: '0923333333', email: 'mai.le@gmail.com', studentName: null, gradeInterest: null, source: 'social_media', status: 'new', assignedTo: null, lastContactDate: null, notes: null, createdAt: '2026-02-11T00:00:00Z', updatedAt: '2026-02-11T00:00:00Z' },
    { id: 'l4', schoolId: 'school1', parentName: 'Phạm Hoàng Long', phone: '0934444444', email: 'long.ph@gmail.com', studentName: 'Phạm Gia Hân', gradeInterest: 6, source: 'event', status: 'applied', assignedTo: null, lastContactDate: '2026-02-08', notes: 'Nộp hồ sơ rồi', createdAt: '2026-01-20T00:00:00Z', updatedAt: '2026-02-08T00:00:00Z' },
    { id: 'l5', schoolId: 'school1', parentName: 'Võ Thị Hương', phone: '0945555555', email: null, studentName: 'Võ Quốc Bảo', gradeInterest: 1, source: 'website', status: 'lost', assignedTo: null, lastContactDate: '2026-01-15', notes: 'Chọn trường khác', createdAt: '2026-01-05T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z' },
];
let leadCounter = demoLeads.length;

@Injectable()
export class LeadsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters: { status?: string; source?: string; search?: string } = {}) {
        let result = [...demoLeads];
        if (filters.status) result = result.filter(l => l.status === filters.status);
        if (filters.source) result = result.filter(l => l.source === filters.source);
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(l => l.parentName.toLowerCase().includes(q) || (l.studentName && l.studentName.toLowerCase().includes(q)) || l.phone.includes(q));
        }
        return { data: result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), meta: { total: result.length } };
    }

    async findById(id: string) {
        const lead = demoLeads.find(l => l.id === id);
        if (!lead) throw new NotFoundException('Không tìm thấy lead');
        return lead;
    }

    async create(dto: CreateLeadDto) {
        leadCounter++;
        const lead: LeadRecord = {
            id: `l${leadCounter}`, schoolId: dto.schoolId,
            parentName: dto.parentName, phone: dto.phone, email: dto.email || null,
            studentName: dto.studentName || null, gradeInterest: dto.gradeInterest || null,
            source: dto.source || 'website', status: 'new', assignedTo: null,
            lastContactDate: null, notes: dto.notes || null,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        demoLeads.push(lead);
        return lead;
    }

    async update(id: string, dto: UpdateLeadDto) {
        const idx = demoLeads.findIndex(l => l.id === id);
        if (idx === -1) throw new NotFoundException('Không tìm thấy lead');
        if (dto.status) demoLeads[idx].status = dto.status;
        if (dto.notes) demoLeads[idx].notes = dto.notes;
        if (dto.assignedTo) demoLeads[idx].assignedTo = dto.assignedTo;
        demoLeads[idx].lastContactDate = new Date().toISOString().slice(0, 10);
        demoLeads[idx].updatedAt = new Date().toISOString();
        return demoLeads[idx];
    }

    async remove(id: string) {
        const idx = demoLeads.findIndex(l => l.id === id);
        if (idx === -1) throw new NotFoundException('Không tìm thấy lead');
        demoLeads.splice(idx, 1);
        return { message: 'Đã xóa lead' };
    }

    async getStats() {
        const byStatus: Record<string, number> = {};
        demoLeads.forEach(l => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });
        const bySource: Record<string, number> = {};
        demoLeads.forEach(l => { bySource[l.source] = (bySource[l.source] || 0) + 1; });
        return { total: demoLeads.length, byStatus, bySource };
    }
}
