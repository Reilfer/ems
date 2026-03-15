import { useState, useRef, useEffect } from 'react';
import { Tag, Spin } from 'antd';
import { aiApi } from '../../services/api';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    functionsCalled?: string[];
}

const TOOL_LABELS: Record<string, { label: string; color: string }> = {
    getStudentStats: { label: 'Thống kê học sinh', color: '#0D652D' },
    searchStudentByCode: { label: 'Tìm học sinh', color: '#0B57D0' },
    getStudentTranscript: { label: 'Bảng điểm', color: '#7B1FA2' },
    getAttendanceRecords: { label: 'Điểm danh', color: '#E37400' },
    getStudentInvoices: { label: 'Hóa đơn', color: '#7B5800' },
    getFinanceStats: { label: 'Tài chính', color: '#0D652D' },
    getPayrollStats: { label: 'Bảng lương', color: '#0B57D0' },
    getClassTimetable: { label: 'Thời khóa biểu', color: '#6750A4' },
};

export default function AiChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        setMessages([{
            role: 'assistant',
            content: 'Xin chào! Tôi là trợ lý AI của ReilferEDUV. Bạn có thể hỏi tôi về:\n\n• Thông tin học sinh, điểm số, điểm danh\n• Tài chính, học phí, bảng lương\n• Thời khóa biểu, sự kiện\n• Tuyển sinh CRM\n\nHãy hỏi bất cứ điều gì!',
            timestamp: new Date().toISOString(),
        }]);
        inputRef.current?.focus();
    }, []);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMsg: ChatMessage = {
            role: 'user',
            content: input,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const res = await aiApi.chat(input, history);

            const aiMsg: ChatMessage = {
                role: 'assistant',
                content: res.data.reply,
                timestamp: res.data.timestamp || new Date().toISOString(),
                functionsCalled: res.data.functionsCalled,
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Xin lỗi, tôi không thể kết nối đến máy chủ. Vui lòng kiểm tra backend đang chạy.`,
                timestamp: new Date().toISOString(),
            }]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const resetChat = () => {
        setMessages([{
            role: 'assistant',
            content: 'Cuộc trò chuyện đã được làm mới. Hãy hỏi tôi bất kỳ điều gì!',
            timestamp: new Date().toISOString(),
        }]);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: 480 }}>
            {}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingBottom: 16, borderBottom: '1px solid #E0E2E0',
            }}>
                <div style={{
                    fontSize: 16, fontWeight: 500,
                    fontFamily: "'Google Sans', sans-serif", color: '#191C1E',
                }}>
                    Trợ lý AI
                </div>
                <button
                    onClick={resetChat}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: '#F1F4F8', border: 'none', borderRadius: 20,
                        padding: '8px 16px', cursor: 'pointer', fontSize: 13,
                        fontWeight: 500, color: '#444746',
                        fontFamily: "'Google Sans Text', sans-serif",
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#E9EEF6')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#F1F4F8')}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
                    Làm mới
                </button>
            </div>

            {}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        marginBottom: 16,
                        gap: 10,
                    }}>
                        {}
                        {msg.role === 'assistant' && (
                            <div style={{
                                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                background: 'linear-gradient(135deg, #C2E7FF 0%, #EADDFF 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginTop: 2,
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#0B57D0' }}>
                                    auto_awesome
                                </span>
                            </div>
                        )}

                        <div style={{ maxWidth: '70%' }}>
                            {}
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: msg.role === 'user'
                                    ? '20px 20px 4px 20px'
                                    : '4px 20px 20px 20px',
                                background: msg.role === 'user' ? '#0B57D0' : '#F1F4F8',
                                color: msg.role === 'user' ? '#fff' : '#191C1E',
                                fontSize: 14,
                                lineHeight: 1.7,
                                whiteSpace: 'pre-wrap',
                                fontFamily: "'Google Sans Text', sans-serif",
                            }}>
                                {msg.content}
                            </div>

                            {}
                            <div style={{
                                fontSize: 11, color: '#70757A', marginTop: 4,
                                textAlign: msg.role === 'user' ? 'right' : 'left',
                                paddingLeft: msg.role === 'assistant' ? 4 : 0,
                            }}>
                                {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}

                {}
                {loading && (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                            background: 'linear-gradient(135deg, #C2E7FF 0%, #EADDFF 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#0B57D0' }}>
                                auto_awesome
                            </span>
                        </div>
                        <div style={{
                            padding: '14px 20px', borderRadius: '4px 20px 20px 20px',
                            background: '#F1F4F8',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <style>{`
                                @keyframes typingDot {
                                    0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
                                    30% { opacity: 1; transform: translateY(-3px); }
                                }
                            `}</style>
                            {[0, 1, 2].map(j => (
                                <div key={j} style={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: '#0B57D0',
                                    animation: `typingDot 1.4s ease-in-out ${j * 0.2}s infinite`,
                                }} />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {}
            <div style={{
                display: 'flex', gap: 10, paddingTop: 16,
                borderTop: '1px solid #E0E2E0',
            }}>
                <div style={{
                    flex: 1, display: 'flex', alignItems: 'center',
                    background: '#F1F4F8', borderRadius: 24,
                    padding: '0 6px 0 18px', height: 48,
                    transition: 'background 0.2s, box-shadow 0.2s',
                    border: '1px solid transparent',
                }}>
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Hỏi về học sinh, điểm số, tài chính..."
                        disabled={loading}
                        style={{
                            flex: 1, border: 'none', background: 'transparent',
                            outline: 'none', fontSize: 14, color: '#191C1E',
                            fontFamily: "'Google Sans Text', sans-serif",
                        }}
                        onFocus={e => {
                            const parent = e.currentTarget.parentElement!;
                            parent.style.background = '#FFFFFF';
                            parent.style.borderColor = '#0B57D0';
                            parent.style.boxShadow = '0 1px 3px rgba(11,87,208,0.15)';
                        }}
                        onBlur={e => {
                            const parent = e.currentTarget.parentElement!;
                            parent.style.background = '#F1F4F8';
                            parent.style.borderColor = 'transparent';
                            parent.style.boxShadow = 'none';
                        }}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || loading}
                        style={{
                            width: 36, height: 36, borderRadius: '50%',
                            border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                            background: input.trim() && !loading ? '#0B57D0' : '#E0E2E0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s, transform 0.15s',
                            flexShrink: 0,
                        }}
                        onMouseDown={e => input.trim() && (e.currentTarget.style.transform = 'scale(0.92)')}
                        onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        <span className="material-symbols-outlined" style={{
                            fontSize: 20, color: '#fff',
                        }}>send</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
