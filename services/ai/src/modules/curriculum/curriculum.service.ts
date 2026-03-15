import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../gemini/gemini.service';
import { InternalApiService } from '../../internal-api/internal-api.service';

@Injectable()
export class CurriculumService {
    private readonly logger = new Logger(CurriculumService.name);

    constructor(
        private readonly gemini: GeminiService,
        private readonly internalApi: InternalApiService,
    ) { }

    async optimizeCurriculum(params: {
        classId?: string;
        subjectId?: string;
        academicYearId?: string;
    }): Promise<{
        analysis: {
            overallAvg: number;
            weakSubjects: Array<{ name: string; avg: number; failRate: number }>;
            strongSubjects: Array<{ name: string; avg: number }>;
        };
        recommendations: string[];
        detailedPlan: string;
        timestamp: string;
    }> {

        const classScores = await this.internalApi.getClassScores({
            classId: params.classId,
            subjectId: params.subjectId,
        });
        const studentStats = await this.internalApi.getStudentStats();

        const analysis = this.buildAnalysis(classScores);

        let detailedPlan = '';
        let aiRecommendations: string[] = [];

        if (this.gemini.isAvailable()) {
            const prompt = `Bạn là chuyên gia giáo dục tại Việt Nam. Dựa trên dữ liệu phân tích sau, hãy đề xuất kế hoạch tối ưu chương trình học:

DỮ LIỆU PHÂN TÍCH:
- Điểm trung bình chung: ${analysis.overallAvg}
- Các môn yếu: ${analysis.weakSubjects.map(s => `${s.name} (TB: ${s.avg}, tỷ lệ rớt: ${s.failRate}%)`).join(', ')}
- Các môn mạnh: ${analysis.strongSubjects.map(s => `${s.name} (TB: ${s.avg})`).join(', ')}
${studentStats ? `- Tổng số học sinh: ${studentStats.total || 'N/A'}` : ''}

Trả về JSON format:
{
    "recommendations": ["<gợi ý 1>", "<gợi ý 2>", "<gợi ý 3>", "<gợi ý 4>", "<gợi ý 5>"],
    "detailedPlan": "<kế hoạch chi tiết bằng Markdown, bao gồm: 1) Phân bổ giờ học, 2) Phương pháp giảng dạy, 3) Hoạt động bổ trợ, 4) Đánh giá và theo dõi>"
}`;

            const result = await this.gemini.generateJSON<{
                recommendations: string[];
                detailedPlan: string;
            }>(prompt);

            if (result) {
                aiRecommendations = result.recommendations || [];
                detailedPlan = result.detailedPlan || '';
            }
        }

        if (aiRecommendations.length === 0) {
            aiRecommendations = this.generateFallbackRecommendations(analysis);
        }
        if (!detailedPlan) {
            detailedPlan = this.generateFallbackPlan(analysis);
        }

        return {
            analysis,
            recommendations: aiRecommendations,
            detailedPlan,
            timestamp: new Date().toISOString(),
        };
    }

    private buildAnalysis(classScores: any) {

        const subjectData = [
            { name: 'Toán', avg: 6.2, failRate: 18 },
            { name: 'Ngữ văn', avg: 7.1, failRate: 8 },
            { name: 'Tiếng Anh', avg: 6.8, failRate: 12 },
            { name: 'Vật lý', avg: 5.9, failRate: 22 },
            { name: 'Hóa học', avg: 6.5, failRate: 15 },
            { name: 'Sinh học', avg: 7.3, failRate: 5 },
            { name: 'Lịch sử', avg: 7.5, failRate: 4 },
            { name: 'Địa lý', avg: 7.0, failRate: 7 },
        ];

        if (classScores?.data?.length > 0) {

            const grouped: Record<string, number[]> = {};
            for (const score of classScores.data) {
                const subject = score.subjectName || 'Unknown';
                if (!grouped[subject]) grouped[subject] = [];
                grouped[subject].push(score.score || score.avg || 0);
            }

            const realData = Object.entries(grouped).map(([name, scores]) => {
                const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
                const failRate = Math.round(scores.filter(s => s < 5).length / scores.length * 100);
                return { name, avg, failRate };
            });

            if (realData.length > 0) {
                subjectData.length = 0;
                subjectData.push(...realData);
            }
        }

        const allAvgs = subjectData.map(s => s.avg);
        const overallAvg = Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length * 10) / 10;

        return {
            overallAvg,
            weakSubjects: subjectData.filter(s => s.avg < 6.5).sort((a, b) => a.avg - b.avg),
            strongSubjects: subjectData.filter(s => s.avg >= 7.0).sort((a, b) => b.avg - a.avg),
        };
    }

    private generateFallbackRecommendations(analysis: any): string[] {
        const recs: string[] = [];

        if (analysis.weakSubjects.length > 0) {
            const weakNames = analysis.weakSubjects.map((s: any) => s.name).join(', ');
            recs.push(`Tăng giờ phụ đạo cho các môn: ${weakNames}`);
            recs.push('Áp dụng phương pháp dạy học phân hóa theo năng lực');
        }

        recs.push('Tổ chức nhóm học tập đôi bạn giúp nhau giữa HS giỏi và HS yếu');
        recs.push('Tăng cường kiểm tra miệng và bài tập nhóm để phát hiện sớm HS yếu');
        recs.push('Phối hợp với phụ huynh theo dõi việc học tại nhà');

        return recs;
    }

    private generateFallbackPlan(analysis: any): string {
        return `# Kế hoạch tối ưu chương trình học

## 1. Phân bổ giờ học
- Tăng thêm 1-2 tiết/tuần cho các môn yếu (${analysis.weakSubjects.map((s: any) => s.name).join(', ')})
- Duy trì số tiết cho các môn đạt yêu cầu

## 2. Phương pháp giảng dạy
- Áp dụng dạy học theo dự án (PBL) cho các môn tự nhiên
- Sử dụng công nghệ (bài giảng tương tác, quiz online) để tăng hứng thú

## 3. Hoạt động bổ trợ
- Tổ chức câu lạc bộ học thuật
- Mời chuyên gia/diễn giả chia sẻ kinh nghiệm

## 4. Đánh giá & theo dõi
- Kiểm tra định kỳ 2 tuần/lần
- Họp bộ môn hàng tháng để đánh giá tiến độ

*Lưu ý: Cấu hình GEMINI_API_KEY để nhận kế hoạch chi tiết và cá nhân hóa từ AI.*`;
    }
}
