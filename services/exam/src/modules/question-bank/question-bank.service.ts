import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionBankDto, CreateQuestionDto } from './question-bank.dto';

export interface QBank { id: string; subjectId: string; subjectName: string; name: string; grade: number; questionCount: number; createdAt: string; }
export interface QItem { id: string; bankId: string; type: string; content: string; options: string[]; answer: string; points: number; difficulty: string; }

const demoBanks: QBank[] = [
    { id: 'qb1', subjectId: 'sub1', subjectName: 'Toán', name: 'Ngân hàng đề Toán 10 - HK1', grade: 10, questionCount: 5, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'qb2', subjectId: 'sub2', subjectName: 'Ngữ văn', name: 'Ngân hàng đề Văn 10 - HK1', grade: 10, questionCount: 3, createdAt: '2026-01-05T00:00:00Z' },
    { id: 'qb3', subjectId: 'sub3', subjectName: 'Tiếng Anh', name: 'English 10 - Semester 1', grade: 10, questionCount: 4, createdAt: '2026-01-10T00:00:00Z' },
];

const demoQuestions: QItem[] = [
    { id: 'q1', bankId: 'qb1', type: 'multiple_choice', content: 'Tính đạo hàm f(x) = 3x² + 2x - 1', options: ['6x + 2', '6x - 2', '3x + 2', '6x + 1'], answer: '6x + 2', points: 1, difficulty: 'EASY' },
    { id: 'q2', bankId: 'qb1', type: 'multiple_choice', content: 'Giải phương trình x² - 5x + 6 = 0', options: ['x = 2, x = 3', 'x = -2, x = -3', 'x = 1, x = 6', 'x = -1, x = -6'], answer: 'x = 2, x = 3', points: 1, difficulty: 'EASY' },
    { id: 'q3', bankId: 'qb1', type: 'short_answer', content: 'Tính giới hạn lim(x→0) sin(x)/x', options: [], answer: '1', points: 2, difficulty: 'MEDIUM' },
    { id: 'q4', bankId: 'qb1', type: 'essay', content: 'Chứng minh rằng √2 là số vô tỉ', options: [], answer: 'Sử dụng phương pháp phản chứng...', points: 5, difficulty: 'HARD' },
    { id: 'q5', bankId: 'qb1', type: 'true_false', content: 'Tổng các góc trong tam giác bằng 180°', options: ['Đúng', 'Sai'], answer: 'Đúng', points: 1, difficulty: 'EASY' },
    { id: 'q6', bankId: 'qb2', type: 'essay', content: 'Phân tích nhân vật Chí Phèo trong tác phẩm cùng tên của Nam Cao', options: [], answer: '', points: 5, difficulty: 'MEDIUM' },
    { id: 'q7', bankId: 'qb2', type: 'short_answer', content: 'Nêu tên tác giả của bài thơ "Tây Tiến"', options: [], answer: 'Quang Dũng', points: 1, difficulty: 'EASY' },
    { id: 'q8', bankId: 'qb2', type: 'multiple_choice', content: 'Tác phẩm "Số đỏ" thuộc thể loại nào?', options: ['Tiểu thuyết', 'Truyện ngắn', 'Thơ', 'Kịch'], answer: 'Tiểu thuyết', points: 1, difficulty: 'EASY' },
    { id: 'q9', bankId: 'qb3', type: 'multiple_choice', content: 'Choose the correct answer: She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 'goes', points: 1, difficulty: 'EASY' },
    { id: 'q10', bankId: 'qb3', type: 'multiple_choice', content: 'Which word is a synonym of "happy"?', options: ['sad', 'joyful', 'angry', 'tired'], answer: 'joyful', points: 1, difficulty: 'EASY' },
    { id: 'q11', bankId: 'qb3', type: 'short_answer', content: 'Translate: "Tôi yêu Việt Nam"', options: [], answer: 'I love Vietnam', points: 2, difficulty: 'MEDIUM' },
    { id: 'q12', bankId: 'qb3', type: 'essay', content: 'Write a paragraph about your favorite hobby (100-150 words)', options: [], answer: '', points: 5, difficulty: 'MEDIUM' },
];
let bankCounter = demoBanks.length;
let qCounter = demoQuestions.length;

@Injectable()
export class QuestionBankService {
    constructor(private prisma: PrismaService) { }

    async findAllBanks(filters: { subjectId?: string; grade?: number } = {}) {
        let result = [...demoBanks];
        if (filters.subjectId) result = result.filter(b => b.subjectId === filters.subjectId);
        if (filters.grade) result = result.filter(b => b.grade === Number(filters.grade));
        return { data: result, meta: { total: result.length } };
    }

    async findBankById(id: string) {
        const bank = demoBanks.find(b => b.id === id);
        if (!bank) throw new NotFoundException('Không tìm thấy ngân hàng đề');
        const questions = demoQuestions.filter(q => q.bankId === id);
        return { ...bank, questions };
    }

    async createBank(dto: CreateQuestionBankDto) {
        bankCounter++;
        const bank: QBank = { id: `qb${bankCounter}`, subjectId: dto.subjectId, subjectName: 'Môn học', name: dto.name, grade: dto.grade, questionCount: 0, createdAt: new Date().toISOString() };
        demoBanks.push(bank);
        return bank;
    }

    async addQuestion(dto: CreateQuestionDto) {
        const bank = demoBanks.find(b => b.id === dto.bankId);
        if (!bank) throw new NotFoundException('Không tìm thấy ngân hàng đề');
        qCounter++;
        const question: QItem = { id: `q${qCounter}`, bankId: dto.bankId, type: dto.type, content: dto.content, options: dto.options || [], answer: dto.answer, points: dto.points || 1, difficulty: dto.difficulty || 'MEDIUM' };
        demoQuestions.push(question);
        bank.questionCount++;
        return question;
    }

    async deleteQuestion(id: string) {
        const idx = demoQuestions.findIndex(q => q.id === id);
        if (idx === -1) throw new NotFoundException('Không tìm thấy câu hỏi');
        const bankId = demoQuestions[idx].bankId;
        demoQuestions.splice(idx, 1);
        const bank = demoBanks.find(b => b.id === bankId);
        if (bank) bank.questionCount--;
        return { message: 'Đã xóa câu hỏi' };
    }
}
