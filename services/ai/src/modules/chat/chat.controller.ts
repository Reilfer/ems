import { Controller, Post, Body, Sse, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Observable, Subject } from 'rxjs';

interface SseEvent {
    data: string;
}

@Controller()
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('chat')
    async chat(@Body() body: {
        message: string;
        conversationHistory?: Array<{ role: string; content: string }>;
        studentId?: string;
    }) {
        const { reply, functionsCalled } = await this.chatService.chat(
            body.message,
            body.conversationHistory || [],
        );

        return {
            reply,
            functionsCalled,
            timestamp: new Date().toISOString(),
        };
    }

    @Post('chat/stream')
    streamChat(@Body() body: {
        message: string;
        conversationHistory?: Array<{ role: string; content: string }>;
    }) {
        const subject = new Subject<SseEvent>();

        this.chatService.chatStream(
            body.message,
            body.conversationHistory || [],
            {
                onThinking: () => {
                    subject.next({ data: JSON.stringify({ type: 'thinking' }) });
                },
                onToolCall: (name: string) => {
                    subject.next({ data: JSON.stringify({ type: 'tool_call', name }) });
                },
                onToolDone: (name: string) => {
                    subject.next({ data: JSON.stringify({ type: 'tool_done', name }) });
                },
                onText: (text: string) => {
                    subject.next({ data: JSON.stringify({ type: 'text', content: text }) });
                },
                onDone: () => {
                    subject.next({ data: JSON.stringify({ type: 'done' }) });
                    subject.complete();
                },
                onError: (err: string) => {
                    subject.next({ data: JSON.stringify({ type: 'error', message: err }) });
                    subject.complete();
                },
            },
        ).catch((err) => {
            subject.next({ data: JSON.stringify({ type: 'error', message: err.message }) });
            subject.complete();
        });

        return subject.asObservable();
    }

}
