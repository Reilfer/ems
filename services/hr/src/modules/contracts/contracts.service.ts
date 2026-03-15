import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContractDto, UpdateContractDto } from './contracts.dto';

export interface ContractRecord {
    id: string;
    schoolId: string;
    userId: string;
    userName: string;
    contractNumber: string;
    type: string;
    startDate: string;
    endDate: string | null;
    baseSalary: number;
    position: string;
    department: string;
    status: string;
    createdAt: string;
}

const demoContracts: ContractRecord[] = [
    { id: 'c1', schoolId: 'school1', userId: 'u1', userName: 'Nguyễn Văn Hùng', contractNumber: 'HD-2020-001', type: 'indefinite', startDate: '2020-09-01', endDate: null, baseSalary: 15000000, position: 'Giáo viên Toán', department: 'Khoa Tự nhiên', status: 'ACTIVE', createdAt: '2020-09-01T00:00:00Z' },
    { id: 'c2', schoolId: 'school1', userId: 'u2', userName: 'Trần Thị Mai', contractNumber: 'HD-2019-002', type: 'indefinite', startDate: '2019-08-15', endDate: null, baseSalary: 12000000, position: 'Giáo viên Văn', department: 'Khoa Xã hội', status: 'ACTIVE', createdAt: '2019-08-15T00:00:00Z' },
    { id: 'c3', schoolId: 'school1', userId: 'u3', userName: 'Lê Hoàng Nam', contractNumber: 'HD-2018-003', type: 'indefinite', startDate: '2018-01-10', endDate: null, baseSalary: 18000000, position: 'Giáo viên Vật lý', department: 'Khoa Tự nhiên', status: 'ACTIVE', createdAt: '2018-01-10T00:00:00Z' },
    { id: 'c4', schoolId: 'school1', userId: 'u4', userName: 'Phạm Thị Lan', contractNumber: 'HD-2021-004', type: 'fixed_term', startDate: '2021-03-20', endDate: '2026-03-20', baseSalary: 13000000, position: 'Giáo viên Anh', department: 'Khoa Ngoại ngữ', status: 'ACTIVE', createdAt: '2021-03-20T00:00:00Z' },
    { id: 'c5', schoolId: 'school1', userId: 'u5', userName: 'Hoàng Minh Đức', contractNumber: 'HD-2022-005', type: 'probation', startDate: '2022-09-01', endDate: '2023-03-01', baseSalary: 10000000, position: 'Giáo viên Sử', department: 'Khoa Xã hội', status: 'EXPIRED', createdAt: '2022-09-01T00:00:00Z' },
];
let contractCounter = demoContracts.length;

@Injectable()
export class ContractsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters: { status?: string; type?: string } = {}) {
        let result = [...demoContracts];
        if (filters.status) result = result.filter(c => c.status === filters.status);
        if (filters.type) result = result.filter(c => c.type === filters.type);
        return { data: result, meta: { total: result.length } };
    }

    async findById(id: string) {
        const contract = demoContracts.find(c => c.id === id);
        if (!contract) throw new NotFoundException('Không tìm thấy hợp đồng');
        return contract;
    }

    async create(dto: CreateContractDto) {
        contractCounter++;
        const contract: ContractRecord = {
            id: `c${contractCounter}`,
            schoolId: dto.schoolId,
            userId: dto.userId,
            userName: 'User',
            contractNumber: dto.contractNumber,
            type: dto.type,
            startDate: dto.startDate,
            endDate: dto.endDate || null,
            baseSalary: dto.baseSalary,
            position: dto.position || '',
            department: dto.department || '',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
        };
        demoContracts.push(contract);
        return contract;
    }

    async update(id: string, dto: UpdateContractDto) {
        const idx = demoContracts.findIndex(c => c.id === id);
        if (idx === -1) throw new NotFoundException('Không tìm thấy hợp đồng');
        demoContracts[idx] = { ...demoContracts[idx], ...dto } as any;
        return demoContracts[idx];
    }

    async getExpiring(days: number = 30) {
        const now = new Date();
        const deadline = new Date(now.getTime() + days * 86400000);
        return demoContracts.filter(c => {
            if (c.status !== 'ACTIVE' || !c.endDate) return false;
            const end = new Date(c.endDate);
            return end >= now && end <= deadline;
        });
    }

    async terminate(id: string) {
        const contract = demoContracts.find(c => c.id === id);
        if (!contract) throw new NotFoundException('Không tìm thấy hợp đồng');
        contract.status = 'TERMINATED';
        return contract;
    }
}
