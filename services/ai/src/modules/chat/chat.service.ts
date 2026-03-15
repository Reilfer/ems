import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../gemini/gemini.service';
import { InternalApiService } from '../../internal-api/internal-api.service';
import { Content, FunctionDeclarationsTool, SchemaType } from '@google/generative-ai';

const PARENT_SYSTEM_PROMPT = `Bạn là trợ lý AI của hệ thống quản lý giáo dục ReilferEDUV. Bạn hỗ trợ phụ huynh và cán bộ trường 24/7.

Quy tắc:
- Trả lời bằng tiếng Việt, thân thiện, chuyên nghiệp
- Khi được hỏi về thông tin cụ thể (học phí, điểm danh, điểm số), hãy gọi function tương ứng để lấy dữ liệu thực
- Nếu không tìm thấy data, thông báo lịch sự và hướng dẫn liên hệ văn phòng
- Không bịa thông tin, chỉ dùng data thật từ hệ thống
- Định dạng số tiền theo VNĐ (ví dụ: 1.500.000đ)
- Khi nói về ngày tháng, dùng format Việt Nam (dd/mm/yyyy)`;

const CHAT_TOOLS: FunctionDeclarationsTool[] = [
    {
        functionDeclarations: [
            {
                name: 'getStudentFees',
                description: 'Lay thong tin hoc phi va hoa don cua hoc sinh. Dung khi phu huynh hoi ve hoc phi, tien dong, cong no.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        studentCode: {
                            type: SchemaType.STRING,
                            description: 'Ma hoc sinh (vi du: HS20250001)',
                        },
                    },
                    required: ['studentCode'],
                },
            },
            {
                name: 'getStudentAttendance',
                description: 'Lay thong tin diem danh, chuyen can cua hoc sinh. Dung khi hoi con co di hoc khong, vang may buoi.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        studentCode: {
                            type: SchemaType.STRING,
                            description: 'Ma hoc sinh',
                        },
                        date: {
                            type: SchemaType.STRING,
                            description: 'Ngay can kiem tra (YYYY-MM-DD), neu khong truyen thi lay hom nay',
                        },
                    },
                    required: ['studentCode'],
                },
            },
            {
                name: 'getStudentGrades',
                description: 'Lay bang diem, ket qua hoc tap cua hoc sinh. Dung khi hoi ve diem so, xep loai, ket qua thi.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        studentCode: {
                            type: SchemaType.STRING,
                            description: 'Ma hoc sinh (VD: HS20250001). Neu nguoi dung chi cho ten, hay hoi lai ma hoc sinh.',
                        },
                    },
                    required: ['studentCode'],
                },
            },
            {
                name: 'getStudentInfo',
                description: 'Lay thong tin co ban cua hoc sinh (ten, lop, ngay sinh, phu huynh). Dung khi can xac minh hoac hoi thong tin chung. Cung dung de tim ID hoc sinh tu ma hoc sinh.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        studentCode: {
                            type: SchemaType.STRING,
                            description: 'Ma hoc sinh (VD: HS20250001)',
                        },
                    },
                    required: ['studentCode'],
                },
            },
            {
                name: 'getClassTimetable',
                description: 'Lay thoi khoa bieu cua mot lop cu the. Dung khi hoi lich hoc cua lop nao do.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        classId: {
                            type: SchemaType.STRING,
                            description: 'ID lop hoc (VD: c1, c2)',
                        },
                    },
                    required: ['classId'],
                },
            },
            {
                name: 'getSchoolEvents',
                description: 'Lay lich su kien, lich thi cua truong. Dung khi hoi ve su kien sap toi, lich thi, le hoi.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        month: {
                            type: SchemaType.STRING,
                            description: 'Thang can xem (YYYY-MM), de trong lay tat ca',
                        },
                    },
                },
            },
            {
                name: 'searchStudent',
                description: 'Tim kiem hoc sinh theo ten hoac ma. Dung khi phu huynh chua biet ma hoc sinh chinh xac.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        keyword: {
                            type: SchemaType.STRING,
                            description: 'Ten hoac ma hoc sinh can tim',
                        },
                    },
                    required: ['keyword'],
                },
            },
            {
                name: 'getAttendanceStats',
                description: 'Lay thong ke diem danh toan truong theo ngay. Dung khi hoi bao nhieu hoc sinh vang, ty le chuyen can.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        date: {
                            type: SchemaType.STRING,
                            description: 'Ngay can xem (YYYY-MM-DD), de trong lay hom nay',
                        },
                    },
                },
            },
            {
                name: 'getFinanceStats',
                description: 'Lay thong ke tai chinh tong hop: tong thu, cong no, so hoa don. Dung khi hoi ve tinh hinh tai chinh truong.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {},
                },
            },
            {
                name: 'getTeacherStats',
                description: 'Lay thong ke giao vien: tong so giao vien. Dung khi hoi ve nhan su, so luong giao vien.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {},
                },
            },
            {
                name: 'getPayrollInfo',
                description: 'Lay thong tin bang luong, chi phi nhan su. Dung khi hoi ve luong giao vien, tong chi phi luong, bang luong.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {},
                },
            },
            {
                name: 'getEnrollmentStats',
                description: 'Lay thong ke tuyen sinh: so don, trang thai. Dung khi hoi ve tinh hinh tuyen sinh, so hoc sinh dang ky.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {},
                },
            },
            {
                name: 'getApplicationsList',
                description: 'Lay danh sach don tuyen sinh gan day. Dung khi hoi xem danh sach don, ho so tuyen sinh.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {},
                },
            },
            {
                name: 'getStudentList',
                description: 'Lay danh sach hoc sinh co phan trang va tim kiem. Dung khi hoi danh sach hoc sinh, tim hoc sinh theo ten.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        search: {
                            type: SchemaType.STRING,
                            description: 'Tu khoa tim kiem (ten hoac ma)',
                        },
                        page: {
                            type: SchemaType.NUMBER,
                            description: 'So trang (mac dinh 1)',
                        },
                    },
                },
            },
            {
                name: 'getStudentStats',
                description: 'Lay thong ke hoc sinh toan truong: tong so, hoat dong, theo gioi tinh. Dung khi hoi so luong hoc sinh.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {},
                },
            },
            {
                name: 'getDashboardOverview',
                description: 'Lay tong quan toan truong: hoc sinh, giao vien, tai chinh, diem danh. Dung khi hoi "tinh hinh truong", "tong quan", "bao cao tong hop".',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {},
                },
            },
        ],
    },
];

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(
        private readonly gemini: GeminiService,
        private readonly internalApi: InternalApiService,
    ) { }

    async chat(message: string, conversationHistory: Array<{ role: string; content: string }> = []): Promise<{
        reply: string;
        functionsCalled: string[];
    }> {
        const functionsCalled: string[] = [];

        const messages: Content[] = [
            ...conversationHistory.map(h => ({
                role: h.role === 'user' ? 'user' as const : 'model' as const,
                parts: [{ text: h.content }],
            })),
            { role: 'user' as const, parts: [{ text: message }] },
        ];

        const functionHandler = async (name: string, args: any): Promise<any> => {
            functionsCalled.push(name);
            this.logger.log(`Calling function: ${name} with args: ${JSON.stringify(args)}`);

            try {
                switch (name) {
                    case 'getStudentFees': {
                        const invoices = await this.internalApi.getStudentInvoices({ studentCode: args.studentCode });
                        this.logger.log(`getStudentFees result: ${JSON.stringify(invoices).substring(0, 200)}`);
                        return invoices || { message: 'Khong tim thay thong tin hoc phi.' };
                    }
                    case 'getStudentAttendance': {
                        const records = await this.internalApi.getAttendanceRecords({
                            studentCode: args.studentCode,
                            date: args.date,
                        });
                        this.logger.log(`getStudentAttendance result: ${Array.isArray(records) ? records.length + ' records' : JSON.stringify(records).substring(0, 200)}`);
                        return records || { message: 'Khong tim thay thong tin diem danh.' };
                    }
                    case 'getStudentGrades': {

                        const students = await this.internalApi.searchStudentByCode(args.studentCode);
                        this.logger.log(`getStudentGrades: searchStudentByCode returned ${students?.data?.length ?? 0} results`);
                        if (students?.data?.length > 0) {
                            const studentId = students.data[0].id;
                            this.logger.log(`getStudentGrades: Found student ID=${studentId}, fetching transcript...`);
                            const transcript = await this.internalApi.getStudentTranscript(studentId);
                            this.logger.log(`getStudentGrades: transcript has ${transcript?.total ?? 0} scores`);
                            return transcript || { message: 'Khong tim thay bang diem.' };
                        }
                        return { message: `Khong tim thay hoc sinh voi ma ${args.studentCode}.` };
                    }
                    case 'getStudentInfo': {
                        const students = await this.internalApi.searchStudentByCode(args.studentCode);
                        if (students?.data?.length > 0) {
                            return students.data[0];
                        }
                        return { message: `Khong tim thay hoc sinh voi ma ${args.studentCode}.` };
                    }
                    case 'getClassTimetable': {
                        const timetable = await this.internalApi.getClassTimetable(args.classId);
                        return timetable || { message: 'Khong tim thay thoi khoa bieu.' };
                    }
                    case 'getSchoolEvents': {
                        const events = await this.internalApi.getSchoolEvents(args.month);
                        return events?.length > 0 ? events : { message: 'Khong co su kien nao trong thoi gian nay.' };
                    }
                    case 'searchStudent': {
                        const result = await this.internalApi.searchStudentByCode(args.keyword);
                        return result || { message: 'Khong tim thay hoc sinh.' };
                    }
                    case 'getAttendanceStats': {
                        const stats = await this.internalApi.getAttendanceStats(args.date);
                        return stats || { message: 'Khong co du lieu diem danh.' };
                    }
                    case 'getFinanceStats': {
                        const stats = await this.internalApi.getFinanceStats();
                        return stats || { message: 'Khong co du lieu tai chinh.' };
                    }
                    case 'getTeacherStats': {
                        const stats = await this.internalApi.getTeacherStats();
                        return stats || { message: 'Khong co du lieu giao vien.' };
                    }
                    case 'getPayrollInfo': {
                        const stats = await this.internalApi.getPayrollStats();
                        return stats || { message: 'Khong co du lieu bang luong.' };
                    }
                    case 'getEnrollmentStats': {
                        const stats = await this.internalApi.getEnrollmentStats();
                        return stats || { message: 'Khong co du lieu tuyen sinh.' };
                    }
                    case 'getApplicationsList': {
                        const list = await this.internalApi.getApplicationsList();
                        return list || { message: 'Khong co don tuyen sinh.' };
                    }
                    case 'getStudentList': {
                        const result = await this.internalApi.getStudentList({ search: args.search, page: args.page });
                        return result || { message: 'Khong co du lieu hoc sinh.' };
                    }
                    case 'getStudentStats': {
                        const stats = await this.internalApi.getStudentStats();
                        return stats || { message: 'Khong co du lieu thong ke hoc sinh.' };
                    }
                    case 'getDashboardOverview': {
                        const overview = await this.internalApi.getDashboardOverview();
                        return overview || { message: 'Khong the lay du lieu tong quan.' };
                    }
                    default:
                        return { error: 'Unknown function' };
                }
            } catch (err: any) {
                this.logger.error(`Function handler error for ${name}: ${err.message}\n${err.stack}`);
                return { error: `Loi khi xu ly: ${err.message}` };
            }
        };

        if (!this.gemini.isAvailable()) {
            return {
                reply: await this.fallbackChat(message),
                functionsCalled: [],
            };
        }

        const reply = await this.gemini.chatWithFunctions(
            messages,
            PARENT_SYSTEM_PROMPT,
            CHAT_TOOLS,
            functionHandler,
        );

        return { reply, functionsCalled };
    }

    private async fallbackChat(message: string): Promise<string> {
        const lower = message.toLowerCase();

        if (lower.includes('học phí') || lower.includes('tiền') || lower.includes('công nợ')) {
            return 'Để tra cứu học phí, vui lòng cung cấp mã học sinh (VD: HS20250001). Hiện tại hệ thống AI đang offline, bạn có thể xem trực tiếp tại mục Tài chính trên hệ thống hoặc liên hệ phòng kế toán.';
        }
        if (lower.includes('điểm danh') || lower.includes('vắng') || lower.includes('đi học')) {
            return 'Để kiểm tra điểm danh, vui lòng truy cập mục Điểm danh trên hệ thống hoặc liên hệ giáo viên chủ nhiệm.';
        }
        if (lower.includes('điểm') || lower.includes('kết quả') || lower.includes('xếp loại')) {
            return 'Để xem kết quả học tập, vui lòng truy cập mục Điểm số trên hệ thống.';
        }
        if (lower.includes('lịch') || lower.includes('thời khóa biểu')) {
            return 'Vui lòng xem Thời khóa biểu tại mục Schedule trên hệ thống.';
        }

        return 'Xin chào! Tôi là trợ lý AI của ReilferEDUV. Hiện tại hệ thống AI đang bảo trì. Vui lòng cấu hình GEMINI_API_KEY để sử dụng đầy đủ tính năng. Bạn vẫn có thể sử dụng các chức năng khác trên hệ thống.';
    }

    async chatStream(
        message: string,
        conversationHistory: Array<{ role: string; content: string }>,
        callbacks: {
            onThinking: () => void;
            onToolCall: (name: string) => void;
            onToolDone: (name: string) => void;
            onText: (text: string) => void;
            onDone: () => void;
            onError: (err: string) => void;
        },
    ) {
        callbacks.onThinking();

        const functionHandler = async (name: string, args: any): Promise<any> => {
            callbacks.onToolCall(name);
            this.logger.log(`[Stream] Calling function: ${name}`);

            try {

                let result: any;
                switch (name) {
                    case 'getStudentFees':
                        result = await this.internalApi.getStudentInvoices({ studentCode: args.studentCode });
                        break;
                    case 'getStudentAttendance':
                        result = await this.internalApi.getAttendanceRecords({ studentCode: args.studentCode, date: args.date });
                        break;
                    case 'getStudentGrades': {
                        const students = await this.internalApi.searchStudentByCode(args.studentCode);
                        if (students?.data?.length > 0) {
                            result = await this.internalApi.getStudentTranscript(students.data[0].id);
                        } else {
                            result = { message: `Khong tim thay hoc sinh voi ma ${args.studentCode}.` };
                        }
                        break;
                    }
                    case 'getStudentInfo': {
                        const sts = await this.internalApi.searchStudentByCode(args.studentCode);
                        result = sts?.data?.length > 0 ? sts.data[0] : { message: `Khong tim thay hoc sinh.` };
                        break;
                    }
                    case 'getClassTimetable':
                        result = await this.internalApi.getClassTimetable(args.classId);
                        break;
                    case 'getSchoolEvents':
                        result = await this.internalApi.getSchoolEvents(args.month);
                        break;
                    case 'searchStudent':
                        result = await this.internalApi.searchStudentByCode(args.keyword);
                        break;
                    case 'getAttendanceStats':
                        result = await this.internalApi.getAttendanceStats(args.date);
                        break;
                    case 'getFinanceStats':
                        result = await this.internalApi.getFinanceStats();
                        break;
                    case 'getTeacherStats':
                        result = await this.internalApi.getTeacherStats();
                        break;
                    case 'getPayrollInfo':
                        result = await this.internalApi.getPayrollStats();
                        break;
                    case 'getEnrollmentStats':
                        result = await this.internalApi.getEnrollmentStats();
                        break;
                    case 'getApplicationsList':
                        result = await this.internalApi.getApplicationsList();
                        break;
                    case 'getStudentList':
                        result = await this.internalApi.getStudentList({ search: args.search, page: args.page });
                        break;
                    case 'getStudentStats':
                        result = await this.internalApi.getStudentStats();
                        break;
                    case 'getDashboardOverview':
                        result = await this.internalApi.getDashboardOverview();
                        break;
                    default:
                        result = { error: 'Unknown function' };
                }

                callbacks.onToolDone(name);
                return result || { message: 'Khong co du lieu.' };
            } catch (err: any) {
                callbacks.onToolDone(name);
                return { error: err.message };
            }
        };

        try {
            let reply: string;

            if (!this.gemini.isAvailable()) {
                reply = await this.fallbackChat(message);
            } else {
                const messages: Content[] = [
                    ...conversationHistory.map(h => ({
                        role: h.role === 'user' ? 'user' as const : 'model' as const,
                        parts: [{ text: h.content }],
                    })),
                    { role: 'user' as const, parts: [{ text: message }] },
                ];

                reply = await this.gemini.chatWithFunctions(
                    messages,
                    PARENT_SYSTEM_PROMPT,
                    CHAT_TOOLS,
                    functionHandler,
                );
            }

            const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
            const chars = reply.split('');
            let buffer = '';
            for (let i = 0; i < chars.length; i++) {
                buffer += chars[i];

                if (i % 5 === 4 || i === chars.length - 1) {
                    callbacks.onText(buffer);
                    buffer = '';
                    await delay(15);
                }
            }

            callbacks.onDone();
        } catch (err: any) {
            this.logger.error(`[Stream] Error: ${err.message}`);
            callbacks.onError(err.message);
        }
    }
}
