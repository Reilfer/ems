import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QuestionBankService } from './question-bank.service';
import { CreateQuestionBankDto, CreateQuestionDto } from './question-bank.dto';

@ApiTags('Question Bank')
@ApiBearerAuth()
@Controller('question-banks')
export class QuestionBankController {
    constructor(private readonly service: QuestionBankService) { }

    @Get()
    @ApiQuery({ name: 'subjectId', required: false }) @ApiQuery({ name: 'grade', required: false })
    findAll(@Query('subjectId') subjectId?: string, @Query('grade') grade?: number) {
        return this.service.findAllBanks({ subjectId, grade });
    }

    @Get(':id')
    findById(@Param('id') id: string) { return this.service.findBankById(id); }

    @Post()
    create(@Body() dto: CreateQuestionBankDto) { return this.service.createBank(dto); }

    @Post('questions')
    addQuestion(@Body() dto: CreateQuestionDto) { return this.service.addQuestion(dto); }

    @Delete('questions/:id')
    deleteQuestion(@Param('id') id: string) { return this.service.deleteQuestion(id); }
}
