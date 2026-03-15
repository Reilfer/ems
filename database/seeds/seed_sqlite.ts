
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const uuid = (prefix: string, i: number) => `${prefix}-${i.toString().padStart(8, '0')}`;

const HO = ['Trần', 'Nguyễn', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const TEN_NAM = ['Văn An', 'Minh Tuấn', 'Đức Dũng', 'Quốc Bảo', 'Hữu Thắng', 'Hoàng Nam', 'Anh Khoa', 'Trung Kiên', 'Quang Huy', 'Bảo Long', 'Tiến Đạt', 'Thành Đô', 'Phúc Hưng', 'Duy Khánh', 'Chí Thanh'];
const TEN_NU = ['Thị Bình', 'Thùy Linh', 'Ngọc Ánh', 'Minh Châu', 'Thùy Dương', 'Phương Anh', 'Khánh Vy', 'Thanh Hà', 'Bích Ngọc', 'Như Quỳnh', 'Mai Lan', 'Hồng Nhung', 'Thúy Hằng', 'Diễm My', 'Tuyết Nhi'];
const SUBJECTS_DEF = [
    { code: 'TOAN', name: 'Toán' },
    { code: 'VAN', name: 'Ngữ Văn' },
    { code: 'ANH', name: 'Tiếng Anh' },
    { code: 'LY', name: 'Vật Lý' },
    { code: 'HOA', name: 'Hóa Học' },
    { code: 'SINH', name: 'Sinh Học' },
    { code: 'SU', name: 'Lịch Sử' },
    { code: 'DIA', name: 'Địa Lý' },
    { code: 'GDCD', name: 'GDCD' },
    { code: 'TIN', name: 'Tin Học' },
    { code: 'TD', name: 'Thể Dục' },
];

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randDec = (min: number, max: number, dp = 1) => +(min + Math.random() * (max - min)).toFixed(dp);
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)];
const daysBefore = (n: number) => new Date(Date.now() - n * 86400000);

async function main() {
    console.log('🌱 Comprehensive seed starting...\n');

    console.log('🧹 Cleaning existing data...');
    await prisma.homeworkSubmission.deleteMany();
    await prisma.homework.deleteMany();
    await prisma.leaveRequest.deleteMany();
    await prisma.crmLead.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.payroll.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.question.deleteMany();
    await prisma.questionBank.deleteMany();
    await prisma.score.deleteMany();
    await prisma.attendanceRecord.deleteMany();
    await prisma.attendanceSession.deleteMany();
    await prisma.student.deleteMany();
    await prisma.teacher.deleteMany();
    await prisma.user.deleteMany();
    await prisma.class.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.gradeLevel.deleteMany();
    await prisma.academicYear.deleteMany();
    await prisma.school.deleteMany();
    console.log('✅ Cleaned!\n');

    const school = await prisma.school.upsert({
        where: { code: 'DEMO-001' },
        update: {},
        create: {
            id: uuid('school', 1),
            name: 'Reilfer University Of Technology',
            code: 'DEMO-001',
            address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
            phone: '028-1234-5678',
            email: 'info@demo.eduv.vn',
            settings: JSON.stringify({ maxStudentsPerClass: 45, academicYearStart: 9, gradingSystem: 'VIETNAM_STANDARD' }),
        },
    });
    const SID = school.id;
    console.log(`✅ School: ${school.name}`);

    const ay = await prisma.academicYear.upsert({
        where: { id: uuid('ay', 1) },
        update: {},
        create: { id: uuid('ay', 1), schoolId: SID, name: '2025-2026', startDate: new Date('2025-09-05'), endDate: new Date('2026-05-31'), isCurrent: true },
    });
    console.log(`✅ Academic Year: ${ay.name}`);

    const gls: any[] = [];
    for (let lv = 10; lv <= 12; lv++) {
        const gl = await prisma.gradeLevel.upsert({
            where: { id: uuid('gl', lv) },
            update: {},
            create: { id: uuid('gl', lv), schoolId: SID, name: `Khối ${lv}`, level: lv },
        });
        gls.push(gl);
    }
    console.log(`✅ Grade Levels: 10, 11, 12`);

    const subjects: any[] = [];
    for (const s of SUBJECTS_DEF) {
        const sub = await prisma.subject.upsert({
            where: { schoolId_code: { schoolId: SID, code: s.code } },
            update: {},
            create: { schoolId: SID, ...s },
        });
        subjects.push(sub);
    }
    console.log(`✅ Subjects: ${subjects.length} môn`);

    const pw = await bcrypt.hash('Admin@123', 10);
    const tpw = await bcrypt.hash('Teacher@123', 10);
    const spw = await bcrypt.hash('Student@123', 10);

    const admin = await prisma.user.upsert({
        where: { schoolId_email: { schoolId: SID, email: 'admin@demo.eduv.vn' } },
        update: { passwordHash: pw },
        create: { id: uuid('user', 1), schoolId: SID, email: 'admin@demo.eduv.vn', passwordHash: pw, firstName: 'Admin', lastName: 'Hệ Thống', role: 'SCHOOL_ADMIN', status: 'active' },
    });
    console.log(`✅ Admin: admin@demo.eduv.vn / Admin@123`);

    const teacherUsers: any[] = [];
    const teacherNames = [
        { first: 'Nguyễn', last: 'Thị Hoa', email: 'gv.nguyen@demo.eduv.vn' },
        { first: 'Trần', last: 'Văn Minh', email: 'gv.tran@demo.eduv.vn' },
        { first: 'Lê', last: 'Thị Mai', email: 'gv.le@demo.eduv.vn' },
    ];
    for (let i = 0; i < teacherNames.length; i++) {
        const t = teacherNames[i];
        const u = await prisma.user.upsert({
            where: { schoolId_email: { schoolId: SID, email: t.email } },
            update: { passwordHash: tpw },
            create: { id: uuid('user-t', i + 1), schoolId: SID, email: t.email, passwordHash: tpw, firstName: t.first, lastName: t.last, role: 'TEACHER', status: 'active' },
        });
        teacherUsers.push(u);
    }
    console.log(`✅ Teachers: ${teacherUsers.length} giáo viên`);

    const studentUser = await prisma.user.upsert({
        where: { schoolId_email: { schoolId: SID, email: 'hs.an@demo.eduv.vn' } },
        update: { passwordHash: spw },
        create: { id: uuid('user-s', 1), schoolId: SID, email: 'hs.an@demo.eduv.vn', passwordHash: spw, firstName: 'Trần', lastName: 'Văn An', role: 'STUDENT', status: 'active' },
    });
    console.log(`✅ Student: hs.an@demo.eduv.vn / Student@123`);

    for (let i = 0; i < teacherUsers.length; i++) {
        const code = `GV2025${(i + 1).toString().padStart(3, '0')}`;
        await prisma.teacher.upsert({
            where: { schoolId_teacherCode: { schoolId: SID, teacherCode: code } },
            update: {},
            create: { id: uuid('tchr', i + 1), schoolId: SID, userId: teacherUsers[i].id, teacherCode: code, specialization: ['Toán học', 'Ngữ Văn', 'Tiếng Anh'][i], department: 'Giáo vụ', status: 'active' },
        });
    }
    console.log(`✅ Teacher records: ${teacherUsers.length}`);

    const classes: any[] = [];
    for (let lv = 0; lv < 3; lv++) {
        for (let cls = 1; cls <= 3; cls++) {
            const name = `${10 + lv}A${cls}`;
            const c = await prisma.class.upsert({
                where: { id: uuid('cls', lv * 3 + cls) },
                update: {},
                create: { id: uuid('cls', lv * 3 + cls), schoolId: SID, academicYearId: ay.id, gradeLevelId: gls[lv].id, name, maxStudents: 45 },
            });
            classes.push(c);
        }
    }
    console.log(`✅ Classes: ${classes.length} lớp`);

    const STUDENT_NAMES: { first: string; last: string; gender: string }[] = [
        { first: 'Trần', last: 'Văn An', gender: 'Nam' },
        { first: 'Lê', last: 'Thị Bình', gender: 'Nữ' },
        { first: 'Phạm', last: 'Minh Châu', gender: 'Nữ' },
        { first: 'Hoàng', last: 'Đức Dũng', gender: 'Nam' },
        { first: 'Ngô', last: 'Thùy Em', gender: 'Nữ' },
        { first: 'Nguyễn', last: 'Anh Khoa', gender: 'Nam' },
        { first: 'Vũ', last: 'Phương Anh', gender: 'Nữ' },
        { first: 'Đặng', last: 'Quốc Bảo', gender: 'Nam' },
        { first: 'Bùi', last: 'Khánh Vy', gender: 'Nữ' },
        { first: 'Đỗ', last: 'Hữu Thắng', gender: 'Nam' },
        { first: 'Hồ', last: 'Thanh Hà', gender: 'Nữ' },
        { first: 'Phan', last: 'Hoàng Nam', gender: 'Nam' },
        { first: 'Dương', last: 'Bích Ngọc', gender: 'Nữ' },
        { first: 'Huỳnh', last: 'Tiến Đạt', gender: 'Nam' },
        { first: 'Võ', last: 'Như Quỳnh', gender: 'Nữ' },
        { first: 'Trần', last: 'Bảo Long', gender: 'Nam' },
        { first: 'Nguyễn', last: 'Mai Lan', gender: 'Nữ' },
        { first: 'Lê', last: 'Quang Huy', gender: 'Nam' },
        { first: 'Phạm', last: 'Hồng Nhung', gender: 'Nữ' },
        { first: 'Hoàng', last: 'Duy Khánh', gender: 'Nam' },
        { first: 'Ngô', last: 'Thúy Hằng', gender: 'Nữ' },
        { first: 'Vũ', last: 'Thành Đô', gender: 'Nam' },
        { first: 'Đặng', last: 'Diễm My', gender: 'Nữ' },
        { first: 'Bùi', last: 'Phúc Hưng', gender: 'Nam' },
        { first: 'Đỗ', last: 'Tuyết Nhi', gender: 'Nữ' },
        { first: 'Hồ', last: 'Chí Thanh', gender: 'Nam' },
        { first: 'Phan', last: 'Thùy Dương', gender: 'Nữ' },
        { first: 'Dương', last: 'Trung Kiên', gender: 'Nam' },
        { first: 'Huỳnh', last: 'Ngọc Ánh', gender: 'Nữ' },
        { first: 'Võ', last: 'Minh Tuấn', gender: 'Nam' },
    ];

    const students: any[] = [];
    for (let i = 1; i <= 30; i++) {
        const code = `HS2025${i.toString().padStart(4, '0')}`;
        const cls = classes[(i - 1) % classes.length];
        const sn = STUDENT_NAMES[i - 1];
        const s = await prisma.student.upsert({
            where: { schoolId_studentCode: { schoolId: SID, studentCode: code } },
            update: {},
            create: {
                id: uuid('stud', i),
                schoolId: SID,
                userId: i === 1 ? studentUser.id : undefined,
                studentCode: code,
                firstName: sn.first,
                lastName: sn.last,
                dateOfBirth: new Date(2008 + (i % 3), (i % 12), 10 + (i % 15)),
                gender: sn.gender,
                currentClassId: cls.id,
                parentIds: '[]',
                metadata: '{}',
                status: 'active',
            },
        });
        students.push(s);
    }
    console.log(`✅ Students: ${students.length} học sinh`);

    const scoreTypes = ['midterm', 'final', 'quiz'];
    let scoreCount = 0;
    for (const st of students) {
        const cls = classes.find((c: any) => c.id === st.currentClassId) || classes[0];
        for (let si = 0; si < 5; si++) {
            const sub = subjects[si];
            for (const type of scoreTypes) {
                await prisma.score.create({
                    data: {
                        schoolId: SID,
                        studentId: st.id,
                        subjectId: sub.id,
                        classId: cls.id,
                        academicYearId: ay.id,
                        semester: 1,
                        scoreType: type,
                        score: randDec(4, 10),
                        weight: type === 'final' ? 3 : type === 'midterm' ? 2 : 1,
                        gradedBy: teacherUsers[0].id,
                    },
                });
                scoreCount++;
            }
        }
    }
    console.log(`✅ Scores: ${scoreCount} điểm`);

    let attCount = 0;
    const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'ABSENT']; 
    for (let day = 1; day <= 10; day++) {
        const date = daysBefore(day);
        if (date.getDay() === 0 || date.getDay() === 6) continue; 

        for (const cls of classes.slice(0, 3)) { 
            const session = await prisma.attendanceSession.create({
                data: {
                    schoolId: SID,
                    classId: cls.id,
                    teacherId: teacherUsers[0].id,
                    sessionDate: date,
                    period: 1,
                    type: 'manual',
                    status: 'closed',
                },
            });

            const classStudents = students.filter((s: any) => s.currentClassId === cls.id);
            for (const st of classStudents) {
                await prisma.attendanceRecord.create({
                    data: {
                        sessionId: session.id,
                        studentId: st.id,
                        status: pick(statuses),
                        method: 'manual',
                        checkInTime: new Date(date.getTime() + 7 * 3600000 + rand(0, 30) * 60000),
                    },
                });
                attCount++;
            }
        }
    }
    console.log(`✅ Attendance: ${attCount} records`);

    let invCount = 0;
    for (let i = 0; i < students.length; i++) {
        const st = students[i];
        const total = rand(5000000, 15000000);
        const discount = i % 5 === 0 ? rand(500000, 2000000) : 0;
        const final_ = total - discount;
        const isPaid = i % 3 !== 0;

        const inv = await prisma.invoice.create({
            data: {
                schoolId: SID,
                invoiceNumber: `INV-2025-${(i + 1).toString().padStart(4, '0')}`,
                studentId: st.id,
                academicYearId: ay.id,
                semester: 1,
                totalAmount: total,
                discountAmount: discount,
                finalAmount: final_,
                status: isPaid ? 'paid' : 'pending',
                dueDate: new Date('2025-10-15'),
                issuedDate: new Date('2025-09-10'),
                paidDate: isPaid ? daysBefore(rand(5, 30)) : undefined,
                description: 'Học phí HK1 năm học 2025-2026',
                items: JSON.stringify([
                    { name: 'Học phí', amount: total * 0.7 },
                    { name: 'Phí cơ sở vật chất', amount: total * 0.2 },
                    { name: 'Bảo hiểm', amount: total * 0.1 },
                ]),
            },
        });

        if (isPaid) {
            await prisma.payment.create({
                data: {
                    schoolId: SID,
                    invoiceId: inv.id,
                    amount: final_,
                    method: pick(['bank_transfer', 'cash', 'momo', 'vnpay']),
                    status: 'completed',
                    paidAt: inv.paidDate ?? new Date(),
                    note: 'Đã thanh toán đầy đủ',
                    gatewayResponse: '{}',
                },
            });
        }
        invCount++;
    }
    console.log(`✅ Invoices: ${invCount} hóa đơn`);

    const notifTemplates = [
        { type: 'ANNOUNCEMENT', title: 'Lịch nghỉ lễ 30/4 - 1/5', content: 'Trường thông báo lịch nghỉ lễ từ 29/4 đến 1/5. Học sinh trở lại trường ngày 2/5.' },
        { type: 'INFO', title: 'Bài tập Toán chương 3 đã được giao', content: 'Hạn nộp: 28/02. Vui lòng vào mục Bài tập để làm bài.' },
        { type: 'GRADE', title: 'Điểm kiểm tra giữa kỳ đã có', content: 'Điểm kiểm tra giữa kỳ môn Toán đã được cập nhật. Xem chi tiết tại mục Kết quả học tập.' },
        { type: 'FINANCE', title: 'Nhắc nhở đóng học phí HK1', content: 'Học phí HK1 đến hạn ngày 15/10. Vui lòng thanh toán đúng hạn.' },
        { type: 'WARNING', title: 'Học sinh vắng không phép', content: 'Học sinh đã vắng 3 buổi không phép trong tuần. Phụ huynh vui lòng xác nhận.' },
        { type: 'ANNOUNCEMENT', title: 'Họp phụ huynh cuối kỳ', content: 'Trường tổ chức họp phụ huynh vào ngày 15/12 lúc 8:00. Mong quý phụ huynh tham dự.' },
    ];

    for (let i = 0; i < notifTemplates.length; i++) {
        const t = notifTemplates[i];
        await prisma.notification.create({
            data: {
                schoolId: SID,
                senderId: admin.id,
                recipientId: studentUser.id,
                type: t.type,
                title: t.title,
                content: t.content,
                data: '{}',
                channels: '["in_app"]',
                isRead: i > 2,
                createdAt: daysBefore(i * 2),
            },
        });
    }
    console.log(`✅ Notifications: ${notifTemplates.length} thông báo`);

    for (let i = 0; i < teacherUsers.length; i++) {
        const baseSalary = rand(12000000, 25000000);
        await prisma.contract.create({
            data: {
                schoolId: SID,
                userId: teacherUsers[i].id,
                contractNumber: `HD-2025-${(i + 1).toString().padStart(3, '0')}`,
                type: 'full_time',
                startDate: new Date('2025-09-01'),
                baseSalary,
                status: 'active',
            },
        });

        for (let m = 9; m <= 12; m++) {
            const bonus = rand(0, 3000000);
            const deduction = rand(500000, 2000000);
            const net = baseSalary + bonus - deduction;
            await prisma.payroll.create({
                data: {
                    schoolId: SID,
                    userId: teacherUsers[i].id,
                    month: m,
                    year: 2025,
                    baseSalary,
                    bonus,
                    deduction,
                    netSalary: net,
                    status: m <= 11 ? 'paid' : 'pending',
                    paidAt: m <= 11 ? new Date(2025, m, 5) : undefined,
                },
            });
        }
    }

    const adminSalary = 30000000;
    await prisma.contract.create({
        data: { schoolId: SID, userId: admin.id, contractNumber: 'HD-2025-ADM', type: 'full_time', startDate: new Date('2025-09-01'), baseSalary: adminSalary, status: 'active' },
    });
    for (let m = 9; m <= 12; m++) {
        await prisma.payroll.create({
            data: { schoolId: SID, userId: admin.id, month: m, year: 2025, baseSalary: adminSalary, bonus: 5000000, deduction: 3000000, netSalary: adminSalary + 5000000 - 3000000, status: m <= 11 ? 'paid' : 'pending', paidAt: m <= 11 ? new Date(2025, m, 5) : undefined },
        });
    }
    console.log(`✅ Contracts: ${teacherUsers.length + 1} hợp đồng, Payroll: ${(teacherUsers.length + 1) * 4} bản lương`);

    const leadNames = [
        { parent: 'Nguyễn Văn Hùng', student: 'Nguyễn Minh Khôi', phone: '0901234567', status: 'new', source: 'Facebook Ads' },
        { parent: 'Trần Thị Lan', student: 'Trần Bảo Ngọc', phone: '0912345678', status: 'contacted', source: 'Google Search' },
        { parent: 'Lê Văn Tâm', student: 'Lê Hoàng Anh', phone: '0923456789', status: 'interested', source: 'Giới thiệu' },
        { parent: 'Phạm Đức Thịnh', student: 'Phạm Gia Huy', phone: '0934567890', status: 'applied', source: 'Open Day' },
        { parent: 'Hoàng Thị Mai', student: 'Hoàng Nhật Minh', phone: '0945678901', status: 'enrolled', source: 'Website' },
        { parent: 'Võ Văn Sơn', student: 'Võ Quỳnh Anh', phone: '0956789012', status: 'new', source: 'Facebook Ads' },
        { parent: 'Đặng Minh Quân', student: 'Đặng Thiên Ân', phone: '0967890123', status: 'contacted', source: 'Zalo OA' },
        { parent: 'Bùi Thị Hà', student: 'Bùi Trung Đức', phone: '0978901234', status: 'interested', source: 'Hội thảo' },
    ];

    for (const l of leadNames) {
        await prisma.crmLead.create({
            data: {
                schoolId: SID, parentName: l.parent, studentName: l.student,
                phone: l.phone, email: `${l.phone}@email.vn`, status: l.status,
                source: l.source, note: `Quan tâm tuyển sinh lớp 10 năm 2026`,
            },
        });
    }
    console.log(`✅ CRM Leads: ${leadNames.length} leads tuyển sinh`);

    for (let i = 0; i < 5; i++) {
        const st = students[i];
        await prisma.leaveRequest.create({
            data: {
                schoolId: SID,
                studentId: st.id,
                requestedBy: studentUser.id,
                startDate: daysBefore(rand(3, 20)),
                endDate: daysBefore(rand(1, 2)),
                reason: pick(['Bệnh', 'Việc gia đình', 'Khám bệnh định kỳ', 'Thi IELTS', 'Lý do cá nhân']),
                status: pick(['pending', 'approved', 'approved', 'rejected']),
            },
        });
    }
    console.log(`✅ Leave Requests: 5 đơn xin phép`);

    const hw1 = await prisma.homework.create({
        data: {
            schoolId: SID, classId: classes[0].id, subjectId: subjects[0].id, teacherId: teacherUsers[0].id,
            title: 'Trắc nghiệm Đạo hàm cơ bản', description: 'Kiểm tra kiến thức đạo hàm chương 1',
            type: 'quiz', dueDate: new Date('2026-03-20T23:59:00Z'), maxScore: 10, status: 'ACTIVE',
            questions: JSON.stringify([
                { id: 'q1', content: 'Đạo hàm của f(x) = 3x² + 2x - 1 là:', options: ['6x + 2', '6x - 2', '3x + 2', '6x + 1'], correctIndex: 0, points: 2 },
                { id: 'q2', content: 'Đạo hàm của f(x) = sin(x) là:', options: ['cos(x)', '-cos(x)', 'tan(x)', '-sin(x)'], correctIndex: 0, points: 2 },
                { id: 'q3', content: 'Đạo hàm của f(x) = eˣ là:', options: ['x·eˣ⁻¹', 'eˣ', 'eˣ⁺¹', 'ln(x)'], correctIndex: 1, points: 2 },
                { id: 'q4', content: 'Đạo hàm của f(x) = ln(x) là:', options: ['1/x', 'x', 'ln(x)/x', 'eˣ'], correctIndex: 0, points: 2 },
                { id: 'q5', content: 'Nếu f(x) = x³, thì f\'(2) = ?', options: ['6', '8', '12', '4'], correctIndex: 2, points: 2 },
            ]),
            timeLimit: 15,
        },
    });

    const hw2 = await prisma.homework.create({
        data: {
            schoolId: SID, classId: classes[0].id, subjectId: subjects[1].id, teacherId: teacherUsers[1].id,
            title: 'Phân tích bài thơ Tây Tiến', description: 'Phân tích hình tượng người lính Tây Tiến',
            type: 'essay', dueDate: new Date('2026-03-22T23:59:00Z'), maxScore: 10, status: 'ACTIVE',
            essayPrompt: 'Phân tích hình tượng người lính Tây Tiến trong bài thơ cùng tên của Quang Dũng. Yêu cầu: 500-800 chữ, có luận điểm rõ ràng, dẫn chứng cụ thể.',
            answerKey: 'Bài thơ Tây Tiến của Quang Dũng sáng tác năm 1948, hình tượng người lính: (1) Vẻ đẹp hào hùng trên đường hành quân; (2) Vẻ đẹp lãng mạn hào hoa; (3) Vẻ đẹp bi tráng của sự hi sinh; (4) Nghệ thuật ngôn ngữ giàu hình ảnh.',
            gradingMode: 'ai',
        },
    });

    const hw3 = await prisma.homework.create({
        data: {
            schoolId: SID, classId: classes[1].id, subjectId: subjects[2].id, teacherId: teacherUsers[2].id,
            title: 'English Quiz - Tenses', description: 'Multiple choice on present and past tenses',
            type: 'quiz', dueDate: new Date('2026-03-25T23:59:00Z'), maxScore: 10, status: 'ACTIVE',
            questions: JSON.stringify([
                { id: 'eq1', content: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], correctIndex: 1, points: 2 },
                { id: 'eq2', content: 'They ___ football yesterday.', options: ['play', 'plays', 'played', 'playing'], correctIndex: 2, points: 2 },
                { id: 'eq3', content: 'I ___ studying when he called.', options: ['am', 'is', 'was', 'were'], correctIndex: 2, points: 2 },
                { id: 'eq4', content: 'We ___ to Japan next summer.', options: ['will go', 'went', 'goes', 'going'], correctIndex: 0, points: 2 },
                { id: 'eq5', content: 'He ___ his homework already.', options: ['finish', 'finishes', 'finished', 'has finished'], correctIndex: 3, points: 2 },
            ]),
            timeLimit: 10,
        },
    });

    const hw4 = await prisma.homework.create({
        data: {
            schoolId: SID, classId: classes[0].id, subjectId: subjects[3].id, teacherId: teacherUsers[0].id,
            title: 'Báo cáo thí nghiệm Newton', description: 'Viết báo cáo thí nghiệm về định luật II Newton',
            type: 'essay', dueDate: new Date('2026-03-28T23:59:00Z'), maxScore: 10, status: 'ACTIVE',
            essayPrompt: 'Viết báo cáo thí nghiệm về định luật II Newton (F = ma). Yêu cầu: Mô tả dụng cụ, cách tiến hành, số liệu đo được, kết luận. 400-600 chữ.',
            gradingMode: 'manual',
        },
    });

    await prisma.homeworkSubmission.create({
        data: {
            homeworkId: hw1.id, studentId: students[0].id, type: 'quiz',
            quizAnswers: JSON.stringify({ q1: 0, q2: 0, q3: 1, q4: 0, q5: 2 }),
            quizDetail: JSON.stringify([
                { questionId: 'q1', correct: true, selected: 0, correctIndex: 0, points: 2 },
                { questionId: 'q2', correct: true, selected: 0, correctIndex: 0, points: 2 },
                { questionId: 'q3', correct: true, selected: 1, correctIndex: 1, points: 2 },
                { questionId: 'q4', correct: true, selected: 0, correctIndex: 0, points: 2 },
                { questionId: 'q5', correct: true, selected: 2, correctIndex: 2, points: 2 },
            ]),
            score: 10, maxScore: 10, feedback: 'Xuất sắc! Đúng hết 5/5 câu.',
            status: 'GRADED', gradedAt: daysBefore(2),
        },
    });

    await prisma.homeworkSubmission.create({
        data: {
            homeworkId: hw1.id, studentId: students[1].id, type: 'quiz',
            quizAnswers: JSON.stringify({ q1: 0, q2: 1, q3: 0, q4: 0, q5: 0 }),
            quizDetail: JSON.stringify([
                { questionId: 'q1', correct: true, selected: 0, correctIndex: 0, points: 2 },
                { questionId: 'q2', correct: false, selected: 1, correctIndex: 0, points: 0 },
                { questionId: 'q3', correct: false, selected: 0, correctIndex: 1, points: 0 },
                { questionId: 'q4', correct: true, selected: 0, correctIndex: 0, points: 2 },
                { questionId: 'q5', correct: false, selected: 0, correctIndex: 2, points: 0 },
            ]),
            score: 4, maxScore: 10, feedback: 'Đúng 2/5 câu. Cần ôn tập đạo hàm lượng giác.',
            status: 'GRADED', gradedAt: daysBefore(1),
        },
    });

    await prisma.homeworkSubmission.create({
        data: {
            homeworkId: hw2.id, studentId: students[0].id, type: 'essay',
            essayContent: 'Bài thơ Tây Tiến của Quang Dũng là một tác phẩm tiêu biểu của thơ ca kháng chiến chống Pháp. Hình tượng người lính Tây Tiến hiện lên với vẻ đẹp hào hùng và lãng mạn. Trên đường hành quân, họ đối mặt với những khó khăn: "Dốc lên khúc khuỷu dốc thăm thẳm". Vẻ đẹp hào hoa thể hiện qua nỗi nhớ người hậu phương. Đặc biệt, sự hi sinh của họ được phác họa chân thực và xúc động: "Áo bào thay chiếu anh về đất / Sông Mã gầm lên khúc độc hành". Tác giả sử dụng ngôn ngữ giàu hình ảnh, nhạc điệu để tạo nên bức tranh hùng tráng về người lính.',
            maxScore: 10, status: 'SUBMITTED',
        },
    });

    await prisma.homeworkSubmission.create({
        data: {
            homeworkId: hw4.id, studentId: students[1].id, type: 'essay',
            essayContent: 'BÁO CÁO THÍ NGHIỆM: ĐỊNH LUẬT II NEWTON\n\n1. Mục đích: Xác minh định luật II Newton F = ma\n\n2. Dụng cụ: xe đo, lực kế, đồng hồ bấm giây, mặt phẳng nghiêng\n\n3. Cách tiến hành: Đặt xe trên mặt phẳng nằm ngang. Dùng lực kế tác dụng lực F lên xe, đo gia tốc.\n\n4. Số liệu:\n- Lần 1: F = 1N, m = 0.5kg, a = 2.1 m/s²\n- Lần 2: F = 2N, m = 0.5kg, a = 3.9 m/s²\n- Lần 3: F = 1N, m = 1kg, a = 1.05 m/s²\n\n5. Kết luận: Gia tốc tỉ lệ thuận với lực và tỉ lệ nghịch với khối lượng.',
            maxScore: 10, status: 'SUBMITTED',
        },
    });

    await prisma.homeworkSubmission.create({
        data: {
            homeworkId: hw3.id, studentId: students[4].id, type: 'quiz',
            quizAnswers: JSON.stringify({ eq1: 1, eq2: 2, eq3: 2, eq4: 0, eq5: 2 }),
            quizDetail: JSON.stringify([
                { questionId: 'eq1', correct: true, selected: 1, correctIndex: 1, points: 2 },
                { questionId: 'eq2', correct: true, selected: 2, correctIndex: 2, points: 2 },
                { questionId: 'eq3', correct: true, selected: 2, correctIndex: 2, points: 2 },
                { questionId: 'eq4', correct: true, selected: 0, correctIndex: 0, points: 2 },
                { questionId: 'eq5', correct: false, selected: 2, correctIndex: 3, points: 0 },
            ]),
            score: 8, maxScore: 10, feedback: 'Đúng 4/5 câu. Cần ôn Present Perfect.',
            status: 'GRADED', gradedAt: daysBefore(1),
        },
    });

    console.log(`✅ Homework: 4 bài tập (2 quiz + 2 essay), 5 bài nộp`);

    console.log('\n🎉 Comprehensive seed done!\n');
    console.log('📊 Summary:');
    console.log(`   • 1 trường, 1 năm học, 3 khối, 9 lớp`);
    console.log(`   • 11 môn học`);
    console.log(`   • 30 học sinh, 3 giáo viên, 1 admin`);
    console.log(`   • ${scoreCount} điểm, ${attCount} điểm danh`);
    console.log(`   • ${invCount} hóa đơn, ${notifTemplates.length} thông báo`);
    console.log(`   • ${teacherUsers.length + 1} hợp đồng, ${(teacherUsers.length + 1) * 4} bảng lương`);
    console.log(`   • ${leadNames.length} leads tuyển sinh, 5 đơn xin phép`);
    console.log(`   • 4 bài tập (2 quiz + 2 essay), 5 bài nộp`);
    console.log('\n📋 Login credentials:');
    console.log('   Admin:   admin@demo.eduv.vn / Admin@123');
    console.log('   Teacher: gv.nguyen@demo.eduv.vn / Teacher@123');
    console.log('   Student: hs.an@demo.eduv.vn / Student@123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
