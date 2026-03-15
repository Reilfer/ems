import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto } from './teachers.dto';

const demoTeachers = [
    { id: 't1', schoolId: 'school1', employeeCode: 'GV001', firstName: 'Nguyễn', lastName: 'Văn Hùng', email: 'hung.nv@school.edu.vn', phone: '0901234567', specialization: 'Toán học', qualification: 'Thạc sĩ', department: 'Khoa Tự nhiên', hireDate: '2020-09-01', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 't2', schoolId: 'school1', employeeCode: 'GV002', firstName: 'Trần', lastName: 'Thị Mai', email: 'mai.tt@school.edu.vn', phone: '0912345678', specialization: 'Ngữ văn', qualification: 'Cử nhân', department: 'Khoa Xã hội', hireDate: '2019-08-15', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 't3', schoolId: 'school1', employeeCode: 'GV003', firstName: 'Lê', lastName: 'Hoàng Nam', email: 'nam.lh@school.edu.vn', phone: '0923456789', specialization: 'Vật lý', qualification: 'Tiến sĩ', department: 'Khoa Tự nhiên', hireDate: '2018-01-10', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 't4', schoolId: 'school1', employeeCode: 'GV004', firstName: 'Phạm', lastName: 'Thị Lan', email: 'lan.pt@school.edu.vn', phone: '0934567890', specialization: 'Tiếng Anh', qualification: 'Thạc sĩ', department: 'Khoa Ngoại ngữ', hireDate: '2021-03-20', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 't5', schoolId: 'school1', employeeCode: 'GV005', firstName: 'Hoàng', lastName: 'Minh Đức', email: 'duc.hm@school.edu.vn', phone: '0945678901', specialization: 'Lịch sử', qualification: 'Cử nhân', department: 'Khoa Xã hội', hireDate: '2022-09-01', isActive: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

@Injectable()
export class TeachersService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters: { schoolId?: string; department?: string; status?: string; search?: string } = {}) {
        let result = [...demoTeachers];
        if (filters.department) result = result.filter(t => t.department === filters.department);
        if (filters.status === 'active') result = result.filter(t => t.isActive);
        if (filters.status === 'inactive') result = result.filter(t => !t.isActive);
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(t =>
                `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
                t.employeeCode.toLowerCase().includes(q) ||
                (t.email && t.email.toLowerCase().includes(q))
            );
        }
        return { data: result, meta: { total: result.length } };
    }

    async findById(id: string) {
        const teacher = demoTeachers.find(t => t.id === id);
        if (!teacher) throw new NotFoundException('Không tìm thấy giáo viên');
        return teacher;
    }

    async create(dto: CreateTeacherDto) {
        const id = `t${demoTeachers.length + 1}`;
        const teacher = {
            id,
            ...dto,
            hireDate: dto.hireDate || new Date().toISOString().slice(0, 10),
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        demoTeachers.push(teacher as any);
        return teacher;
    }

    async update(id: string, dto: UpdateTeacherDto) {
        const idx = demoTeachers.findIndex(t => t.id === id);
        if (idx === -1) throw new NotFoundException('Không tìm thấy giáo viên');
        demoTeachers[idx] = { ...demoTeachers[idx], ...dto, updatedAt: new Date().toISOString() } as any;
        return demoTeachers[idx];
    }

    async remove(id: string) {
        const idx = demoTeachers.findIndex(t => t.id === id);
        if (idx === -1) throw new NotFoundException('Không tìm thấy giáo viên');
        demoTeachers[idx].isActive = false;
        return { message: 'Đã vô hiệu hóa giáo viên' };
    }

    async getStats() {
        const total = demoTeachers.length;
        const active = demoTeachers.filter(t => t.isActive).length;
        const byDept: Record<string, number> = {};
        demoTeachers.filter(t => t.isActive).forEach(t => {
            byDept[t.department || 'Khác'] = (byDept[t.department || 'Khác'] || 0) + 1;
        });
        return { total, active, inactive: total - active, byDepartment: byDept };
    }
}
