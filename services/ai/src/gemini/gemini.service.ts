import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel, Content, Part, FunctionDeclarationsTool } from '@google/generative-ai';

@Injectable()
export class GeminiService {
 private readonly logger = new Logger(GeminiService.name);
 private genAI: GoogleGenerativeAI | null = null;
 private model: GenerativeModel | null = null;

 constructor() {
 const apiKey = process.env.GEMINI_API_KEY;
 if (apiKey) {
 this.genAI = new GoogleGenerativeAI(apiKey);
 this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
 this.logger.log('Gemini API initialized (gemini-2.5-flash)');
 } else {
 this.logger.warn('GEMINI_API_KEY not set — AI features will use fallback responses');
 }
 }

 isAvailable(): boolean {
 return this.model !== null;
 }

 async generateText(prompt: string, systemInstruction?: string): Promise<string> {
 if (!this.model) {
 return '[AI không khả dụng] Vui lòng cấu hình GEMINI_API_KEY để sử dụng tính năng AI.';
 }

 try {
 const model = systemInstruction
 ? this.genAI!.getGenerativeModel({
 model: 'gemini-2.5-flash',
 systemInstruction,
 })
 : this.model;

 const result = await model.generateContent(prompt);
 return result.response.text();
 } catch (error: any) {
 this.logger.error(`Gemini error: ${error.message}`);
 return `[Lỗi AI] ${error.message}`;
 }
 }

 async generateJSON<T = any>(prompt: string, systemInstruction?: string): Promise<T | null> {
 const text = await this.generateText(prompt, systemInstruction);
 try {

 const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
 const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
 return JSON.parse(jsonStr);
 } catch {
 this.logger.warn('Failed to parse Gemini JSON response');
 return null;
 }
 }

 async chatWithFunctions(
 messages: Content[],
 systemInstruction: string,
 tools: FunctionDeclarationsTool[],
 functionHandler: (name: string, args: any) => Promise<any>,
 ): Promise<string> {
 if (!this.genAI) {
 return '[AI không khả dụng] Vui lòng cấu hình GEMINI_API_KEY.';
 }

 try {
 const model = this.genAI.getGenerativeModel({
 model: 'gemini-2.5-flash',
 systemInstruction,
 tools,
 });

 const chat = model.startChat({
 history: messages.slice(0, -1).filter((msg, idx, arr) => {

 if (idx === 0 && msg.role === 'model') return false;

 if (idx > 0 && arr[idx - 1]?.role === msg.role) return false;
 return true;
 }),
 });
 const lastMessage = messages[messages.length - 1];
 const lastText = (lastMessage.parts[0] as any).text || '';

 let result = await chat.sendMessage(lastText);
 let response = result.response;

 for (let i = 0; i < 3; i++) {
 const functionCalls = response.functionCalls();
 if (!functionCalls || functionCalls.length === 0) break;

 const functionResponses: Part[] = [];
 for (const call of functionCalls) {
 this.logger.log(`Function call: ${call.name}(${JSON.stringify(call.args)})`);
 const fnResult = await functionHandler(call.name, call.args);
 functionResponses.push({
 functionResponse: {
 name: call.name,
 response: { result: fnResult },
 },
 });
 }

 result = await chat.sendMessage(functionResponses);
 response = result.response;
 }

 return response.text();
 } catch (error: any) {
 this.logger.error(`Gemini chat error: ${error.message}`);
 return `[Lỗi AI] Không thể xử lý yêu cầu: ${error.message}`;
 }
 }
}
