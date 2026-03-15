import { Controller, Post, Body } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';

@Controller()
export class CurriculumController {
    constructor(private readonly curriculumService: CurriculumService) { }

    @Post('optimize-curriculum')
    async optimize(@Body() body: {
        classId?: string;
        subjectId?: string;
        academicYearId?: string;
    }) {
        return this.curriculumService.optimizeCurriculum(body);
    }
}
