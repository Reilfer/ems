import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { GradingService } from './grading.service';

@Controller('grade')
export class GradingController {
    constructor(private readonly gradingService: GradingService) {}

    @Post()
    async gradeSubmission(@Body() body: {
        question?: string;
        answerKey?: string;
        studentAnswer?: string;
        maxScore?: any;
    }) {
        const question = body?.question;
        const studentAnswer = body?.studentAnswer;
        const maxScore = Number(body?.maxScore);

        if (question === undefined || studentAnswer === undefined || isNaN(maxScore)) {
            throw new HttpException(`Missing or invalid fields. Received: ${JSON.stringify(body)}`, HttpStatus.BAD_REQUEST);
        }

        const result = await this.gradingService.gradeSubmission(
            question,
            body.answerKey || 'Không có đáp án mẫu cụ thể. Vui lòng tự suy luận theo kiến thức chuẩn.',
            studentAnswer,
            maxScore,
        );

        return {
            ...result,
            timestamp: new Date().toISOString(),
        };
    }
}
