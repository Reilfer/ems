
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
   console.log('Starting seed...');

   const schoolId = 'school-001';
   await prisma.$executeRawUnsafe(` INSERT INTO schools (id, name, code, is_active, updated_at)
 VALUES ('${schoolId}', 'Reilfer High School', 'RHS', true, NOW())
 ON CONFLICT (id) DO NOTHING;
 `);

   const yearId = 'year-2024';
   await prisma.$executeRawUnsafe(` INSERT INTO academic_years (id, school_id, name, start_date, end_date, is_current)
 VALUES ('${yearId}', '${schoolId}', '2023-2024', '2023-09-05', '2024-05-31', true)
 ON CONFLICT (id) DO NOTHING;
 `);

   const adminHash = await bcrypt.hash('Phi@@412008', 12);
   const teacherHash = await bcrypt.hash('Teacher@123', 12);
   const defaultHash = await bcrypt.hash('Admin@123', 12);

   await prisma.$executeRawUnsafe(` INSERT INTO users (id, school_id, email, password_hash, first_name, last_name, role, status, updated_at)
 VALUES 
 ('user-admin', '${schoolId}', 'admin@reilfer.edu', '${adminHash}', 'Admin', 'System', 'SCHOOL_ADMIN', 'active', NOW()),
 ('user-principal', '${schoolId}', 'principal@reilfer.edu', '${defaultHash}', 'Principal', 'User', 'SCHOOL_ADMIN', 'active', NOW())
 ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role;
 `);

   for (let i = 10; i <= 12; i++) {
      await prisma.$executeRawUnsafe(` INSERT INTO grade_levels (id, school_id, name, level)
 VALUES ('grade-${i}', '${schoolId}', 'Khối ${i}', ${i})
 ON CONFLICT (id) DO NOTHING;
 `);
   }

   const teachers = [
      { id: 't1', firstName: 'Nguyễn Văn', lastName: 'Toán', email: 'toan.nv@reilfer.edu', subject: 'Toán' },
      { id: 't2', firstName: 'Trần Thị', lastName: 'Văn', email: 'van.tt@reilfer.edu', subject: 'Ngữ văn' },
      { id: 't3', firstName: 'Lê Văn', lastName: 'Lý', email: 'ly.lv@reilfer.edu', subject: 'Vật lý' },
      { id: 't4', firstName: 'Phạm Thị', lastName: 'Hóa', email: 'hoa.pt@reilfer.edu', subject: 'Hóa học' },
      { id: 't5', firstName: 'Hoàng Văn', lastName: 'Anh', email: 'anh.hv@reilfer.edu', subject: 'Tiếng Anh' },
   ];

   await prisma.$executeRawUnsafe(` INSERT INTO users (id, school_id, email, password_hash, first_name, last_name, role, status, updated_at)
 VALUES ('user-gv-nguyen', '${schoolId}', 'gv.nguyen@demo.eduv.vn', '${teacherHash}', 'Nguyễn', 'Thị Hoa', 'TEACHER', 'active', NOW())
 ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role;
 `);
   await prisma.$executeRawUnsafe(` INSERT INTO teachers (id, school_id, user_id, teacher_code, specialization, status, updated_at)
 VALUES ('t-gv-nguyen', '${schoolId}', 'user-gv-nguyen', 'TGV001', 'Toán', 'active', NOW())
 ON CONFLICT (id) DO NOTHING;
 `);
   console.log('  Demo teacher created: gv.nguyen@demo.eduv.vn / Teacher@123');

   for (const t of teachers) {
      const userId = `user-${t.id}`;
      await prisma.$executeRawUnsafe(` INSERT INTO users (id, school_id, email, password_hash, first_name, last_name, role, status, updated_at)
 VALUES ('${userId}', '${schoolId}', '${t.email}', '${teacherHash}', '${t.firstName}', '${t.lastName}', 'TEACHER', 'active', NOW())
 ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role;
 `);

      await prisma.$executeRawUnsafe(` INSERT INTO teachers (id, school_id, user_id, teacher_code, specialization, status, updated_at)
 VALUES ('${t.id}', '${schoolId}', '${userId}', 'T${t.id.toUpperCase()}', '${t.subject}', 'active', NOW())
 ON CONFLICT (id) DO NOTHING;
 `);
   }
   console.log('  Teachers created with password: Teacher@123');

   const subjects = [
      { id: 'sub-math', name: 'Toán', code: 'MATH', grade: 'grade-10' },
      { id: 'sub-lit', name: 'Ngữ văn', code: 'LIT', grade: 'grade-10' },
      { id: 'sub-eng', name: 'Tiếng Anh', code: 'ENG', grade: 'grade-10' },
      { id: 'sub-phy', name: 'Vật lý', code: 'PHY', grade: 'grade-10' },
      { id: 'sub-chem', name: 'Hóa học', code: 'CHEM', grade: 'grade-10' },
   ];

   for (const s of subjects) {
      await prisma.$executeRawUnsafe(` INSERT INTO subjects (id, school_id, name, code, grade_level_id)
 VALUES ('${s.id}', '${schoolId}', '${s.name}', '${s.code}', '${s.grade}')
 ON CONFLICT (id) DO NOTHING;
 `);
   }

   const classes = ['10A1', '10A2', '11B1', '12C1'];
   for (const c of classes) {
      const grade = c.startsWith('10') ? 'grade-10' : c.startsWith('11') ? 'grade-11' : 'grade-12';
      await prisma.$executeRawUnsafe(` INSERT INTO classes (id, school_id, academic_year_id, grade_level_id, name, homeroom_teacher_id, updated_at)
 VALUES ('class-${c}', '${schoolId}', '${yearId}', '${grade}', '${c}', 'user-t1', NOW())
 ON CONFLICT (id) DO NOTHING;
 `);
   }

   const firstNames = ['Nguyễn Văn', 'Trần Thị', 'Lê Hoàng', 'Phạm Minh', 'Hoàng Thị', 'Đỗ Văn', 'Vũ Thị', 'Bùi Quang', 'Đặng Thị', 'Ngô Thanh'];
   const lastNames = ['An', 'Bình', 'Chi', 'Dũng', 'Em', 'Phúc', 'Giang', 'Hải', 'Khánh', 'Lan', 'Minh', 'Nam', 'Oanh', 'Phong', 'Quân'];

   for (let i = 1; i <= 50; i++) {
      const studentId = `s${i}`;
      const userId = `user-s${i}`;
      const classId = i <= 15 ? 'class-10A1' : i <= 30 ? 'class-10A2' : 'class-11B1';
      const fName = firstNames[(i - 1) % firstNames.length];
      const lName = lastNames[(i - 1) % lastNames.length];
      const code = `HS${String(20250000 + i).padStart(8, '0')}`;

      await prisma.$executeRawUnsafe(` INSERT INTO users (id, school_id, email, password_hash, first_name, last_name, role, status, updated_at)
 VALUES ('${userId}', '${schoolId}', 'student${i}@reilfer.edu', '${defaultHash}', '${fName}', '${lName}', 'STUDENT', 'active', NOW())
 ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, role = EXCLUDED.role;
 `);

      await prisma.$executeRawUnsafe(` INSERT INTO students (id, school_id, user_id, student_code, first_name, last_name, gender, current_class_id, status, updated_at)
 VALUES ('${studentId}', '${schoolId}', '${userId}', '${code}', '${fName}', '${lName}', '${i % 2 === 0 ? 'male' : 'female'}', '${classId}', 'active', NOW())
 ON CONFLICT (id) DO UPDATE SET student_code = EXCLUDED.student_code, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name;
 `);
   }
   console.log('  Students created (HS20250001 - HS20250050)');

   const scoreSubjects = ['sub-math', 'sub-lit', 'sub-eng', 'sub-phy', 'sub-chem'];
   const scoreTypes = ['oral', 'midterm', 'final'];
   for (let i = 1; i <= 15; i++) {
      const studentId = `s${i}`;
      for (const subId of scoreSubjects) {
         for (const sType of scoreTypes) {
            const scoreId = `score-${studentId}-${subId}-${sType}`;
            const baseScore = 5 + Math.floor(Math.random() * 5); 
            const decimal = Math.floor(Math.random() * 100) / 100;
            const score = Math.min(baseScore + decimal, 10).toFixed(2);
            await prisma.$executeRawUnsafe(` INSERT INTO scores (id, school_id, student_id, subject_id, class_id, academic_year_id, semester, score_type, score, weight, updated_at)
 VALUES ('${scoreId}', '${schoolId}', '${studentId}', '${subId}', 'class-10A1', '${yearId}', 1, '${sType}', ${score}, 1.0, NOW())
 ON CONFLICT (id) DO NOTHING;
 `);
         }
      }
   }
   console.log('  Scores created for 15 students (225 records)');

   for (let i = 1; i <= 10; i++) {
      const studentId = `s${i}`;
      const invId = `inv-${studentId}-hk1`;
      const totalAmount = 5000000 + Math.floor(Math.random() * 3000000);
      const isPaid = i <= 5;
      await prisma.$executeRawUnsafe(` INSERT INTO invoices (id, school_id, invoice_number, student_id, academic_year_id, semester, total_amount, discount_amount, final_amount, status, due_date, issued_date, description, updated_at)
 VALUES ('${invId}', '${schoolId}', 'INV-2024-${String(i).padStart(4, '0')}', '${studentId}', '${yearId}', 1, ${totalAmount}, 0, ${totalAmount}, '${isPaid ? 'paid' : 'pending'}', '2024-03-31', '2024-01-15', 'Hoc phi HK1 2023-2024', NOW())
 ON CONFLICT (id) DO NOTHING;
 `);
   }
   console.log('  Invoices created for 10 students');

   await prisma.$executeRawUnsafe(` INSERT INTO contracts (id, school_id, user_id, contract_number, type, start_date, base_salary, status, updated_at)
 VALUES ('cont-t1', '${schoolId}', 'user-t1', 'HD-2024-001', 'indefinite', '2020-01-01', 15000000, 'active', NOW())
 ON CONFLICT (id) DO NOTHING;
 `);

   await prisma.$executeRawUnsafe(` INSERT INTO payroll (id, school_id, user_id, month, year, base_salary, net_salary, status, updated_at)
 VALUES ('pay-t1-01', '${schoolId}', 'user-t1', 1, 2024, 15000000, 13500000, 'paid', NOW())
 ON CONFLICT (id) DO NOTHING;
 `);

   await prisma.$executeRawUnsafe(` INSERT INTO question_banks (id, school_id, subject_id, name, grade_level, question_count, updated_at)
 VALUES ('bank-math-10', '${schoolId}', 'sub-math', 'Ngân hàng Toán 10 HK1', 10, 5, NOW())
 ON CONFLICT (id) DO NOTHING;
 `);

   await prisma.$executeRawUnsafe(` INSERT INTO crm_leads (id, school_id, parent_name, phone, student_name, status, source, updated_at)
 VALUES ('lead-1', '${schoolId}', 'Phụ huynh A', '0901234567', 'Em bé A', 'new', 'facebook', NOW())
 ON CONFLICT (id) DO NOTHING;
 `);

   console.log('');
   console.log('=== Seed hoàn tất! ===');
   console.log('Tài khoản đăng nhập:');
   console.log('  Admin:   admin@reilfer.edu (hoặc "admin") / Phi@@412008');
   console.log('  GV Demo: gv.nguyen@demo.eduv.vn / Teacher@123');
   console.log('  GV khác: toan.nv@reilfer.edu / Teacher@123');
}

main()
   .catch((e) => {
      console.error(e);
      process.exit(1);
   })
   .finally(async () => {
      await prisma.$disconnect();
   });
