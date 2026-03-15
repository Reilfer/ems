import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFeeTypeDto, UpdateFeeTypeDto } from './dto/fee-type.dto';

export interface FeeType {
    id: string;
    name: string;
    amount: number;
    description?: string;
    cycle: string;
    appliedGradeLevels?: string[];
    schoolId: string;
    isActive: boolean;
    createdAt: string;
}

const feeTypeStore: FeeType[] = [
    { id: 'ft-001', name: 'Học phí HK1', amount: 5000000, description: 'Học phí chính quy học kỳ 1', cycle: 'SEMESTER', schoolId: 'demo-school-001', isActive: true, createdAt: '2025-09-01' },
    { id: 'ft-002', name: 'Học phí HK2', amount: 5000000, description: 'Học phí chính quy học kỳ 2', cycle: 'SEMESTER', schoolId: 'demo-school-001', isActive: true, createdAt: '2025-09-01' },
    { id: 'ft-003', name: 'Tiền ăn trưa', amount: 800000, description: 'Phí ăn trưa tại trường', cycle: 'MONTHLY', schoolId: 'demo-school-001', isActive: true, createdAt: '2025-09-01' },
    { id: 'ft-004', name: 'Xe đưa đón', amount: 500000, description: 'Phí xe bus đưa đón', cycle: 'MONTHLY', schoolId: 'demo-school-001', isActive: true, createdAt: '2025-09-01' },
    { id: 'ft-005', name: 'BHYT', amount: 600000, description: 'Bảo hiểm y tế bắt buộc', cycle: 'YEARLY', schoolId: 'demo-school-001', isActive: true, createdAt: '2025-09-01' },
    { id: 'ft-006', name: 'Đồng phục', amount: 350000, description: 'Bộ đồng phục trường', cycle: 'ONE_TIME', schoolId: 'demo-school-001', isActive: true, createdAt: '2025-09-01' },
];

@Injectable()
export class FeeTypesService {
    constructor(private prisma: PrismaService) { }

    findAll(schoolId?: string) {
        if (schoolId) return feeTypeStore.filter(f => f.schoolId === schoolId);
        return feeTypeStore;
    }

    findById(id: string) {
        return feeTypeStore.find(f => f.id === id) || null;
    }

    create(dto: CreateFeeTypeDto): FeeType {
        const newFeeType: FeeType = {
            id: `ft-${String(feeTypeStore.length + 1).padStart(3, '0')}`,
            name: dto.name,
            amount: dto.amount,
            description: dto.description,
            cycle: dto.cycle,
            appliedGradeLevels: dto.appliedGradeLevels,
            schoolId: dto.schoolId,
            isActive: true,
            createdAt: new Date().toISOString(),
        };
        feeTypeStore.push(newFeeType);
        return newFeeType;
    }

    update(id: string, dto: UpdateFeeTypeDto): FeeType | null {
        const idx = feeTypeStore.findIndex(f => f.id === id);
        if (idx === -1) return null;
        feeTypeStore[idx] = { ...feeTypeStore[idx], ...dto };
        return feeTypeStore[idx];
    }

    delete(id: string): boolean {
        const idx = feeTypeStore.findIndex(f => f.id === id);
        if (idx === -1) return false;
        feeTypeStore[idx].isActive = false;
        return true;
    }
}
