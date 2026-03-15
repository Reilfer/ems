import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiModule } from './gemini/gemini.module';
import { InternalApiModule } from './internal-api/internal-api.module';
import { ChatModule } from './modules/chat/chat.module';
import { GradingModule } from './modules/grading/grading.module';
import { PredictionModule } from './modules/prediction/prediction.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        GeminiModule,
        InternalApiModule,
        ChatModule,
        GradingModule,
        PredictionModule,
        CurriculumModule,
    ],
})
export class AppModule { }
