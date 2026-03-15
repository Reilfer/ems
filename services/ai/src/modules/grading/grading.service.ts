import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../gemini/gemini.service';

const GRADING_SYSTEM_PROMPT = `Bạn là một giáo viên tận tâm, công bằng và khách quan. Nhiệm vụ của bạn là chấm điểm bài làm của học sinh dựa trên Câu hỏi và Đáp án mẫu được cung cấp.

Quy tắc chấm điểm:
1. Đọc kỹ Câu hỏi, Đáp án mẫu và Bài làm của học sinh.
2. So sánh Bài làm với Đáp án mẫu để đánh giá mức độ hiểu bài và độ chính xác.
3. Chấm điểm theo thang điểm tối đa được yêu cầu. Dùng điểm số nguyên (VD: 8) hoặc thập phân một dấu phẩy (VD: 8.5).
4. Viết nhận xét (feedback) ngắn gọn, súc tích bằng tiếng Việt:
   - Nếu đúng và đủ ý: Khen ngợi ngắn gọn.
   - Nếu sai hoặc thiếu ý: Chỉ ra lỗi sai hoặc ý còn thiếu một cách mang tính xây dựng. Không cần liệt kê lại toàn bộ đáp án.
5. Trả về kết quả dưới dạng JSON với định dạng chính xác:
   {
      "score": <điểm số là số thực>,
      "feedback": "<nhận xét của bạn>"
   }

CHÚ Ý: Chỉ trả về JSON, không kèm thêm bất kỳ văn bản nào khác bên ngoài khối JSON.`;

export interface GradingResult {
    score: number;
    feedback: string;
}

@Injectable()
export class GradingService {
    private readonly logger = new Logger(GradingService.name);

    constructor(private readonly gemini: GeminiService) { }

    async gradeSubmission(
        question: string,
        answerKey: string,
        studentAnswer: string,
        maxScore: number,
    ): Promise<GradingResult> {
        if (!this.gemini.isAvailable()) {
            this.logger.warn('Gemini API not available for grading, returning fallback result.');
            return {
                score: 0,
                feedback: 'Hệ thống AI hiện đang bảo trì. Vui lòng cấu hình GEMINI_API_KEY để sử dụng tính năng chấm điểm tự động.',
            };
        }

        const prompt = `--- CÂU HỎI ---
${question}

--- ĐÁP ÁN MẪU ---
${answerKey}

--- BÀI LÀM CỦA HỌC SINH ---
${studentAnswer}

--- YÊU CẦU ---
Chấm trên thang điểm tối đa: ${maxScore}
Trả về JSON chứa "score" và "feedback".`;

        try {
            const result = await this.gemini.generateJSON<GradingResult>(prompt, GRADING_SYSTEM_PROMPT);

            if (result && typeof result.score === 'number' && typeof result.feedback === 'string') {

                const clampedScore = Math.max(0, Math.min(result.score, maxScore));
                return {
                    score: clampedScore,
                    feedback: result.feedback,
                };
            }

            this.logger.error('AI returned invalid JSON structure for grading');
            return {
                score: Math.round(maxScore / 2),
                feedback: 'Lỗi xử lý từ AI (Phản hồi không đúng định dạng JSON). Điểm tạm tính là 50%.',
            };
        } catch (error: any) {
            this.logger.error(`Failed to grade submission: ${error.message}`);
            return {
                score: 0,
                feedback: `Lỗi kết nối AI: ${error.message}`,
            };
        }
    }
}
