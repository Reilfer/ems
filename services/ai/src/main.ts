import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
 const logger = new Logger('AIService');
 const app = await NestFactory.create(AppModule);

 app.setGlobalPrefix('api/v1/ai');
 app.enableCors();

 const port = process.env.AI_PORT || 3016;
 await app.listen(port);

 logger.log(`AI Service running on http://localhost:${port}`);
 logger.log(`Endpoints:`);
 logger.log(` POST /api/v1/ai/chat — Chatbot phụ huynh`);
 logger.log(` POST /api/v1/ai/counseling — Tư vấn tâm lý`);
 logger.log(` POST /api/v1/ai/grade-essay — Chấm bài tự luận`);
 logger.log(` POST /api/v1/ai/grade-batch — Chấm hàng loạt`);
 logger.log(` GET /api/v1/ai/predict/student/:id — Dự đoán năng lực HS`);
 logger.log(` GET /api/v1/ai/predict/enrollment — Phân tích tuyển sinh`);
 logger.log(` GET /api/v1/ai/predict/class/:id — Phân tích lớp`);
 logger.log(` POST /api/v1/ai/optimize-curriculum — Tối ưu chương trình`);

 if (!process.env.GEMINI_API_KEY) {
 logger.warn('GEMINI_API_KEY chưa được cấu hình — Chatbot, chấm bài, tối ưu CT sẽ dùng fallback');
 logger.warn(' Prediction (dự đoán) vẫn hoạt động bình thường (thuật toán thống kê)');
 }
}
bootstrap();
