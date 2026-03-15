import { Module } from '@nestjs/common';
import { GradingController } from './grading.controller';
import { GradingService } from './grading.service';
import { GeminiModule } from '../../gemini/gemini.module';

@Module({
    imports: [GeminiModule],
    controllers: [GradingController],
    providers: [GradingService],
    exports: [GradingService],
})
export class GradingModule { }
