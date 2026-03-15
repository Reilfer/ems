import { Controller, Get, Param, Query } from '@nestjs/common';
import { PredictionService } from './prediction.service';

@Controller('predict')
export class PredictionController {
    constructor(private readonly predictionService: PredictionService) { }

    @Get('student/:id')
    async predictStudent(@Param('id') studentId: string) {
        return this.predictionService.predictStudentPerformance(studentId);
    }

    @Get('enrollment')
    async predictEnrollment() {
        return this.predictionService.predictEnrollment();
    }

    @Get('class/:classId')
    async predictClass(@Param('classId') classId: string) {
        return this.predictionService.predictClassPerformance(classId);
    }
}
