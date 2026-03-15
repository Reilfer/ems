import { useState, useEffect } from 'react';
import {
    Typography, Button, Card, Tag, Modal, Form, Input, Select, DatePicker,
    Radio, Space, Tabs, Table, InputNumber, message, Drawer, Divider,
    Row, Col, Statistic, Alert, Spin, Popconfirm,
} from 'antd';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import type { Assignment, Submission, QuizQuestion } from '../../stores/dataStore';
import { aiApi, notificationApi, homeworkApi } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CLASS_LIST = ['10A1', '10A2', '10A3', '11A1', '11A2', '11A3', '12A1', '12A2', '12A3'];
const SUBJECT_LIST = ['Toán', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lý'];

const isAdmin = (role?: string) => ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'admin'].includes(role || '');
const isTeacher = (role?: string) => role === 'TEACHER';

function TeacherAssignments() {
    const { user } = useAuthStore();
    const { assignments, submissions: storeSubmissions, addAssignment, deleteAssignment: removeAssignment, addSubmission, updateSubmission } = useDataStore();
    const [createOpen, setCreateOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [gradeOpen, setGradeOpen] = useState(false);
    const [selected, setSelected] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [gradingSub, setGradingSub] = useState<Submission | null>(null);
    const [form] = Form.useForm();
    const [assignmentType, setAssignmentType] = useState<'quiz' | 'essay'>('quiz');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [filterClass, setFilterClass] = useState<string>('all');
    const [dbClasses, setDbClasses] = useState<{id: string; name: string; schoolId: string}[]>([]);
    const [dbSubjects, setDbSubjects] = useState<{id: string; name: string; code: string; schoolId: string}[]>([]);
    const [hwList, setHwList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [clsRes, subRes, hwRes] = await Promise.all([
                    homeworkApi.classes(),
                    homeworkApi.subjects(),
                    homeworkApi.list(),
                ]);
                setDbClasses(clsRes.data || []);
                setDbSubjects(subRes.data || []);
                setHwList(hwRes.data?.data || []);
            } catch (e) {
                console.log('Failed to fetch homework data from API, using local store');
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleCreate = () => {
        form.resetFields();
        setAssignmentType('quiz');
        setQuestions([{ id: '1', question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
        setCreateOpen(true);
    };

    const addQuestion = () => {
        setQuestions(prev => [...prev, {
            id: String(prev.length + 1),
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
        }]);
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        setQuestions(prev => {
            const updated = [...prev];
            (updated[index] as any)[field] = value;
            return updated;
        });
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        setQuestions(prev => {
            const updated = [...prev];
            updated[qIndex].options[oIndex] = value;
            return updated;
        });
    };

    const removeQuestion = (index: number) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveAssignment = async () => {
        try {
            const values = await form.validateFields();
            const targetClassNames: string[] = values.targetClasses || ['10A1'];

            for (const clsName of targetClassNames) {

                const cls = dbClasses.find(c => c.name === clsName);
                const sub = dbSubjects.find(s => s.name === values.subject);

                if (!cls || !sub) {
                    message.error(`Không tìm thấy lớp "${clsName}" hoặc môn "${values.subject}" trong database`);
                    continue;
                }

                const createData: any = {
                    schoolId: cls.schoolId,
                    classId: cls.id,
                    subjectId: sub.id,
                    teacherId: user?.id || '',
                    title: values.title,
                    description: values.description || '',
                    type: assignmentType,
                    dueDate: values.dueDate?.toISOString() || new Date().toISOString(),
                    maxScore: values.maxScore || 10,
                };

                if (assignmentType === 'quiz') {
                    createData.questions = questions.map((q, i) => ({
                        content: q.question,
                        options: q.options,
                        correctIndex: q.correctAnswer,
                        points: 2,
                    }));
                    createData.timeLimit = values.timeLimit || 15;
                } else {
                    createData.essayPrompt = values.answerKey || '';
                    createData.answerKey = values.answerKey || '';
                    createData.gradingMode = values.useAiGrading ? 'ai' : 'manual';
                }

                try {
                    const res = await homeworkApi.create(createData);

                    const hw = res.data;
                    addAssignment({
                        id: hw.id,
                        title: hw.title,
                        description: hw.description,
                        type: hw.type,
                        subject: hw.subjectName,
                        className: hw.className,
                        dueDate: hw.dueDate?.slice(0, 10) || '',
                        questions: hw.questions,
                        maxScore: hw.maxScore,
                        status: 'published',
                        createdAt: hw.createdAt,
                        createdBy: user?.id || '',
                        submissionCount: 0,
                        gradedCount: 0,
                    });
                } catch (e: any) {
                    message.error(`Lỗi tạo bài tập cho ${clsName}: ${e.response?.data?.message || e.message}`);
                }
            }

            setCreateOpen(false);

            const hwRes = await homeworkApi.list();
            setHwList(hwRes.data?.data || []);
            message.success(`Đã giao bài tập cho ${targetClassNames.length} lớp (lưu vào database)`);

            try {
                await notificationApi.broadcast({
                    schoolId: user?.schoolId || '',
                    senderId: user?.id || '',
                    title: `Bài tập mới: ${values.title}`,
                    content: `Giáo viên đã giao bài tập "${values.title}" (${values.subject}) cho lớp ${targetClassNames.join(', ')}. Hạn nộp: ${values.dueDate?.format('DD/MM/YYYY')}`,
                    type: 'INFO',
                    targetRole: 'all',
                });
            } catch {

            }
        } catch {  }
    };

    const viewSubmissions = async (assignment: any) => {
        setSelected(assignment);
        setViewOpen(true);
        try {
            const res = await homeworkApi.getSubmissions(assignment.id);
            setSubmissions(res.data || []);
        } catch {
            setSubmissions([]);
        }
    };

    useEffect(() => {
        if (viewOpen && selected) {
            homeworkApi.getSubmissions(selected.id).then(res => {
                setSubmissions(res.data || []);
            }).catch(() => {});
        }
    }, [viewOpen, selected]);

    const openGrading = (sub: Submission) => {
        setGradingSub({ ...sub });
        setGradeOpen(true);
    };

    const gradeWithAi = async () => {
        if (!gradingSub || !selected) return;
        setAiLoading(true);
        try {
            const questionText = `${selected.title} - ${selected.description}`;

            const res = await aiApi.grade(
                questionText,
                selected.answerKey || 'Giáo viên tự chấm theo chuẩn',
                gradingSub.essayAnswer || '',
                selected.maxScore
            );

            setGradingSub(prev => prev ? { 
                ...prev, 
                score: res.data.score, 
                feedback: res.data.feedback, 
                gradedBy: 'ai' 
            } : null);
        } catch (e: any) {
            console.error('AI Grading error:', e);
            message.error('Lỗi khi chấm điểm bằng AI: ' + (e.response?.data?.message || e.message));
            const answerLen = gradingSub.essayAnswer?.length || 0;
            const score = Math.min(selected.maxScore, Math.round((answerLen / 200) * selected.maxScore * 10) / 10);
            setGradingSub(prev => prev ? {
                ...prev,
                score,
                feedback: `[Fallback AI do server bị lỗi] Bài viết ${answerLen > 100 ? 'đủ độ dài' : 'còn ngắn'}. Điểm tính theo độ dài bài viết.`,
                gradedBy: 'ai',
            } : null);
        } finally {
            setAiLoading(false);
        }
    };

    const saveGrading = async () => {
        if (!gradingSub || !selected) return;
        try {
            await homeworkApi.grade(gradingSub.id, {
                score: gradingSub.score,
                feedback: gradingSub.feedback,
            });

            const res = await homeworkApi.getSubmissions(selected.id);
            setSubmissions(res.data || []);

            const hwRes = await homeworkApi.list();
            setHwList(hwRes.data?.data || []);

            setGradeOpen(false);
            message.success('Đã chấm điểm thành công!');
        } catch (e: any) {
            message.error(`Lỗi chấm điểm: ${e.message}`);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await homeworkApi.delete(id);
            message.success('Đã xóa bài tập');

            const res = await homeworkApi.list();
            setHwList(res.data?.data || []);
        } catch (e: any) {
            message.error(`Lỗi xóa bài tập: ${e.response?.data?.message || e.message}`);
        }
    };

    const filteredAssignments = filterClass === 'all'
        ? hwList
        : hwList.filter(a => a.className === filterClass);

    const classesWithAssignments = [...new Set(hwList.map(a => a.className))];

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                <Col>
                    <Title level={4} style={{ margin: 0, fontFamily: "'Google Sans', sans-serif", fontWeight: 500 }}>
                        Bài tập
                    </Title>
                </Col>
                <Col>
                    <Space>
                        <Select
                            value={filterClass}
                            onChange={setFilterClass}
                            style={{ width: 140 }}
                            size="large"
                        >
                            <Option value="all">Tất cả lớp</Option>
                            {CLASS_LIST.map(c => (
                                <Option key={c} value={c}>{c}</Option>
                            ))}
                        </Select>
                        <Button type="primary" onClick={handleCreate} size="large" style={{ borderRadius: 12 }}>
                            + Giao bài tập mới
                        </Button>
                    </Space>
                </Col>
            </Row>

            {}
            <Row gutter={16} style={{ marginBottom: 16 }}>
                {[
                    { title: 'Tổng bài tập', value: filteredAssignments.length, bg: '#E8F0FE' },
                    { title: 'Trắc nghiệm', value: filteredAssignments.filter(a => a.type === 'quiz').length, bg: '#E6F4EA' },
                    { title: 'Tự luận', value: filteredAssignments.filter(a => a.type === 'essay').length, bg: '#F3E8FD' },
                    { title: 'Đã nộp', value: submissions.length, bg: '#FEEFC3' },
                ].map((item, i) => (
                    <Col span={6} key={i}>
                        <Card size="small" bordered={false} style={{ background: item.bg, border: 'none' }}>
                            <Statistic title={<span style={{ fontSize: 12, color: '#444746' }}>{item.title}</span>}
                                value={item.value} valueStyle={{ fontFamily: "'Google Sans'", fontWeight: 500 }} />
                        </Card>
                    </Col>
                ))}
            </Row>

            {}
            {filteredAssignments.length === 0 ? (
                <Alert
                    message="Chưa có bài tập nào"
                    description={filterClass === 'all' ? 'Bấm "Giao bài tập mới" để tạo bài tập đầu tiên.' : `Chưa có bài tập cho lớp ${filterClass}.`}
                    type="info"
                    style={{ borderRadius: 12 }}
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredAssignments.map(a => (
                        <Card key={a.id} bordered={false} style={{ background: '#F8FAFD', borderRadius: 16 }}
                            hoverable onClick={() => viewSubmissions(a)}>
                            <Row justify="space-between" align="middle">
                                <Col>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 12,
                                            background: a.type === 'quiz' ? '#E6F4EA' : '#F3E8FD',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <span className="material-symbols-outlined" style={{
                                                fontSize: 22,
                                                color: a.type === 'quiz' ? '#0D652D' : '#7B1FA2',
                                            }}>{a.type === 'quiz' ? 'quiz' : 'edit_note'}</span>
                                        </div>
                                        <div>
                                            <Text strong style={{ fontSize: 15 }}>{a.title}</Text>
                                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                                <Tag color={a.type === 'quiz' ? 'green' : 'purple'}>
                                                    {a.type === 'quiz' ? 'Trắc nghiệm' : 'Tự luận'}
                                                </Tag>
                                                <Tag>{a.subject}</Tag>
                                                <Tag color="blue">{a.className}</Tag>
                                                {a.gradingMode === 'ai' && <Tag color="magenta">AI chấm</Tag>}
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                                <Col>
                                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div>
                                            <div style={{ fontSize: 12, color: '#70757A' }}>Hạn: {dayjs(a.dueDate).format('DD/MM/YYYY')}</div>
                                            <div style={{ fontSize: 13, marginTop: 4 }}>
                                                <Text type="secondary">{a.submissionCount} bài nộp</Text>
                                                {' • '}
                                                <Text style={{ color: '#0D652D' }}>{a.gradedCount} đã chấm</Text>
                                            </div>
                                        </div>
                                        <Popconfirm
                                            title="Xóa bài tập"
                                            description="Xóa bài tập này và mọi bài nộp?"
                                            onConfirm={(e) => { e?.stopPropagation(); handleDelete(a.id); }}
                                            onCancel={(e) => e?.stopPropagation()}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button 
                                                type="text" 
                                                danger 
                                                icon={<span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>} 
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </Popconfirm>
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                    ))}
                </div>
            )}

            {}
            <Modal
                title="Giao bài tập mới"
                open={createOpen}
                onCancel={() => setCreateOpen(false)}
                onOk={handleSaveAssignment}
                okText="Giao bài tập"
                width={720}
                styles={{ body: { maxHeight: '65vh', overflowY: 'auto' } }}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề bài tập' }]}>
                        <Input placeholder="VD: Kiểm tra Toán chương 3" />
                    </Form.Item>

                    {}
                    <Form.Item
                        name="targetClasses"
                        label="Giao cho lớp"
                        rules={[{ required: true, message: 'Chọn ít nhất 1 lớp' }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn lớp (có thể chọn nhiều)"
                            style={{ width: '100%' }}
                            allowClear
                        >
                            {CLASS_LIST.map(c => (
                                <Option key={c} value={c}>{c}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="subject" label="Môn học" rules={[{ required: true, message: 'Chọn môn' }]}>
                                <Select placeholder="Chọn">
                                    {SUBJECT_LIST.map(s => (
                                        <Option key={s} value={s}>{s}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="maxScore" label="Thang điểm" initialValue={10}>
                                <InputNumber min={1} max={100} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="dueDate" label="Hạn nộp" rules={[{ required: true, message: 'Chọn ngày' }]}>
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="description" label="Mô tả / Đề bài">
                        <TextArea rows={2} placeholder="Mô tả yêu cầu bài tập..." />
                    </Form.Item>

                    {}
                    <Form.Item label="Loại bài tập">
                        <Radio.Group value={assignmentType} onChange={e => setAssignmentType(e.target.value)}
                            buttonStyle="solid" size="large">
                            <Radio.Button value="quiz" style={{ borderRadius: '12px 0 0 12px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>quiz</span>
                                Trắc nghiệm
                            </Radio.Button>
                            <Radio.Button value="essay" style={{ borderRadius: '0 12px 12px 0' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>edit_note</span>
                                Tự luận
                            </Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    {}
                    {assignmentType === 'quiz' && (
                        <div>
                            <Divider>Câu hỏi trắc nghiệm</Divider>
                            {questions.map((q, qi) => (
                                <Card key={qi} size="small" style={{ marginBottom: 12, background: '#F8FAFD', borderRadius: 12 }}>
                                    <Row justify="space-between" align="middle">
                                        <Col><Text strong>Câu {qi + 1}</Text></Col>
                                        <Col>
                                            {questions.length > 1 && (
                                                <Button size="small" type="text" danger onClick={() => removeQuestion(qi)}>Xóa</Button>
                                            )}
                                        </Col>
                                    </Row>
                                    <Input placeholder="Nội dung câu hỏi" value={q.question}
                                        onChange={e => updateQuestion(qi, 'question', e.target.value)}
                                        style={{ marginTop: 8, marginBottom: 8 }} />
                                    <Radio.Group value={q.correctAnswer}
                                        onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)}
                                        style={{ width: '100%' }}>
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            {q.options.map((opt, oi) => (
                                                <Radio key={oi} value={oi} style={{ width: '100%' }}>
                                                    <Input size="small" placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                                                        value={opt} onChange={e => updateOption(qi, oi, e.target.value)}
                                                        style={{ width: 'calc(100% - 24px)', marginLeft: 4 }} />
                                                </Radio>
                                            ))}
                                        </Space>
                                    </Radio.Group>
                                </Card>
                            ))}
                            <Button type="dashed" block onClick={addQuestion} style={{ borderRadius: 12, marginTop: 8 }}>
                                + Thêm câu hỏi
                            </Button>
                        </div>
                    )}

                    {}
                    {assignmentType === 'essay' && (
                        <div>
                            <Divider>Đáp án mẫu & chấm điểm</Divider>
                            <Form.Item name="answerKey" label="Đáp án / Ý chính (để AI hoặc GV tham chiếu khi chấm)">
                                <TextArea rows={4} placeholder="Nhập đáp án mẫu hoặc các ý chính cần có..." />
                            </Form.Item>
                            <Form.Item name="useAiGrading" label="Phương thức chấm">
                                <Radio.Group>
                                    <Radio value={false}>Giáo viên tự chấm</Radio>
                                    <Radio value={true}>AI chấm tự động (so sánh với đáp án mẫu)</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </div>
                    )}
                </Form>
            </Modal>

            {}
            <Drawer
                title={selected?.title}
                open={viewOpen}
                onClose={() => setViewOpen(false)}
                width={700}
                extra={
                    <Popconfirm title="Xóa bài tập này?" onConfirm={() => { removeAssignment(selected?.id || ''); setViewOpen(false); }}>
                        <Button danger>Xóa</Button>
                    </Popconfirm>
                }
            >
                {selected && (
                    <div>
                        <Alert
                            type="info"
                            message={`${selected.type === 'quiz' ? 'Trắc nghiệm' : 'Tự luận'} — ${selected.subject} — Lớp ${selected.className}`}
                            description={selected.description}
                            style={{ borderRadius: 12, marginBottom: 16 }}
                        />

                        <Title level={5}>Bài nộp ({submissions.length})</Title>
                        {submissions.length === 0 ? (
                            <Alert message="Chưa có học sinh nào nộp bài" type="warning" style={{ borderRadius: 12 }} />
                        ) : (
                            <Table
                                dataSource={submissions}
                                rowKey="id"
                                size="small"
                                pagination={false}
                                columns={[
                                    { title: 'Học sinh', dataIndex: 'studentName', render: (n: string) => <Text strong>{n}</Text> },
                                    {
                                        title: 'Nộp lúc', dataIndex: 'submittedAt', width: 140,
                                        render: (d: string) => dayjs(d).format('DD/MM HH:mm')
                                    },
                                    {
                                        title: 'Điểm', key: 'score', width: 100,
                                        render: (_: any, r: Submission) => r.score !== null
                                            ? <Tag color={r.score >= r.maxScore * 0.5 ? 'green' : 'red'}>{r.score}/{r.maxScore}</Tag>
                                            : <Tag color="gold">Chưa chấm</Tag>
                                    },
                                    {
                                        title: 'Chấm bởi', dataIndex: 'gradedBy', width: 80,
                                        render: (g: string | null) => g === 'ai' ? <Tag color="blue">AI</Tag> : g === 'teacher' ? <Tag>GV</Tag> : '—'
                                    },
                                    {
                                        title: '', key: 'action', width: 100,
                                        render: (_: any, r: Submission) => (
                                            <Button size="small" type={r.score === null ? 'primary' : 'text'}
                                                onClick={(e) => { e.stopPropagation(); openGrading(r); }}>
                                                {r.score === null ? 'Chấm' : 'Xem'}
                                            </Button>
                                        ),
                                    },
                                ]}
                            />
                        )}
                    </div>
                )}
            </Drawer>

            {}
            <Modal
                title="Chấm bài"
                open={gradeOpen}
                onCancel={() => setGradeOpen(false)}
                onOk={saveGrading}
                okText="Lưu điểm"
                width={640}
            >
                {gradingSub && selected && (
                    <div>
                        <Text strong style={{ fontSize: 15 }}>{gradingSub.studentName}</Text>
                        <Divider />

                        {}
                        {selected.type === 'quiz' && (
                            <div>
                                <Text strong>Đáp án:</Text>
                                <div style={{ marginTop: 8 }}>
                                    {Array.isArray(selected.questions) && selected.questions.map((q, i) => {
                                        const studentAnswer = gradingSub.quizAnswers?.[i];
                                        const isCorrect = studentAnswer === q.correctAnswer;
                                        return (
                                            <div key={i} style={{ marginBottom: 12, padding: 12, background: isCorrect ? '#E6F4EA' : '#F9DEDC', borderRadius: 12 }}>
                                                <Text strong>Câu {i + 1}: {q.question}</Text>
                                                <div style={{ marginTop: 4 }}>
                                                    HS chọn: <Text strong>{q.options[studentAnswer ?? 0]}</Text>
                                                    {!isCorrect && <Text type="success" style={{ marginLeft: 8 }}>→ Đáp án đúng: {q.options[q.correctAnswer]}</Text>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {selected.type === 'essay' && (
                            <div>
                                <Text strong>Bài làm:</Text>
                                <Card style={{ margin: '8px 0', borderRadius: 12, background: '#F8FAFD' }}>
                                    <Paragraph>{gradingSub.essayAnswer}</Paragraph>
                                </Card>

                                {selected.answerKey && (
                                    <>
                                        <Text strong style={{ color: '#0B57D0' }}>Đáp án mẫu:</Text>
                                        <Card style={{ margin: '8px 0', borderRadius: 12, background: '#E8F0FE' }}>
                                            <Paragraph style={{ color: '#0B57D0' }}>{selected.answerKey}</Paragraph>
                                        </Card>
                                    </>
                                )}

                                {selected.gradingMode === 'ai' && (
                                    <Button
                                        type="primary"
                                        block
                                        onClick={gradeWithAi}
                                        loading={aiLoading}
                                        style={{ borderRadius: 12, marginBottom: 12, background: '#7B1FA2' }}
                                    >
                                        AI chấm tự động
                                    </Button>
                                )}
                            </div>
                        )}

                        <Divider />

                        <Row gutter={16}>
                            <Col span={8}>
                                <Text strong>Điểm:</Text>
                                <InputNumber
                                    value={gradingSub.score ?? undefined}
                                    onChange={v => setGradingSub(prev => prev ? { ...prev, score: v, gradedBy: 'teacher' } : null)}
                                    min={0} max={selected.maxScore}
                                    step={0.5}
                                    style={{ width: '100%', marginTop: 4 }}
                                    placeholder={`/ ${selected.maxScore}`}
                                />
                            </Col>
                            <Col span={16}>
                                <Text strong>Nhận xét:</Text>
                                <TextArea
                                    value={gradingSub.feedback}
                                    onChange={e => setGradingSub(prev => prev ? { ...prev, feedback: e.target.value } : null)}
                                    rows={2}
                                    style={{ marginTop: 4 }}
                                    placeholder="Nhận xét cho học sinh..."
                                />
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>
        </div>
    );
}

function StudentAssignments() {
    const { user } = useAuthStore();
    const { assignments, submissions: storeSubmissions, addSubmission, demoLoaded, loadDemoData } = useDataStore();
    const [submitOpen, setSubmitOpen] = useState(false);
    const [selected, setSelected] = useState<Assignment | null>(null);
    const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
    const [essayText, setEssayText] = useState('');
    const [resultOpen, setResultOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [studentClass, setStudentClass] = useState('10A1');

    const myAssignments = assignments.filter(a => a.className === studentClass);

    const getMySubmission = (assignmentId: string) =>
        storeSubmissions.find(s => s.assignmentId === assignmentId && s.studentId === (user?.id || ''));

    const hasSubmitted = (assignmentId: string) => !!getMySubmission(assignmentId);

    const openAssignment = (a: Assignment) => {
        if (hasSubmitted(a.id)) {
            setSelected(a);
            setResultOpen(true);
            return;
        }
        setSelected(a);
        setQuizAnswers(a.questions ? new Array(a.questions.length).fill(-1) : []);
        setEssayText('');
        setSubmitOpen(true);
    };

    const handleSubmit = async () => {
        if (!selected || !user) return;
        setLoading(true);

        try {
            if (selected.type === 'quiz') {
                const answerDict: Record<string, number> = {};
                selected.questions?.forEach((q, i) => {
                    answerDict[q.id || `q${i}`] = quizAnswers[i];
                });

                await homeworkApi.submitQuiz(selected.id, {
                    studentId: user.id,
                    answers: answerDict,
                });
                message.success('Đã nộp bài trắc nghiệm thành công!');
            } else {
                await homeworkApi.submitEssay(selected.id, {
                    studentId: user.id,
                    content: essayText,
                });
                message.success('Đã nộp bài tự luận thành công! Vui lòng chờ giáo viên hoặc AI chấm.');
            }

            setSubmitOpen(false);

            const res = await homeworkApi.list();
            if (res.data && res.data.data) {

                window.location.reload(); 
            }
        } catch (e: any) {
            message.error(`Lỗi nộp bài: ${e.response?.data?.message || e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                <Col>
                    <Title level={4} style={{ margin: 0, fontFamily: "'Google Sans', sans-serif", fontWeight: 500 }}>
                        Bài tập của tôi
                    </Title>
                    <Text type="secondary">
                        Lớp {studentClass} — {myAssignments.length} bài tập
                    </Text>
                </Col>
                <Col>
                    <Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>Đang xem lớp:</Text>
                        <Select
                            value={studentClass}
                            onChange={setStudentClass}
                            style={{ width: 100 }}
                        >
                            {CLASS_LIST.map(c => <Option key={c} value={c}>{c}</Option>)}
                        </Select>
                    </Space>
                </Col>
            </Row>

            {myAssignments.length === 0 ? (
                <Alert
                    message="Chưa có bài tập nào cho lớp này"
                    description={
                        <div>
                            <p>Giáo viên chưa giao bài tập cho lớp {studentClass}.</p>

                        </div>
                    }
                    type="info"
                    showIcon
                    style={{ borderRadius: 12 }}
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {myAssignments.map(a => {
                        const isSubmitted = hasSubmitted(a.id);
                        const mySub = getMySubmission(a.id);
                        const isOverdue = dayjs(a.dueDate).isBefore(dayjs());

                        return (
                            <Card key={a.id} bordered={false} style={{ background: '#F8FAFD', borderRadius: 16 }}
                                hoverable onClick={() => openAssignment(a)}>
                                <Row justify="space-between" align="middle">
                                    <Col>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 12,
                                                background: a.type === 'quiz' ? '#E6F4EA' : '#F3E8FD',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <span className="material-symbols-outlined" style={{
                                                    fontSize: 22,
                                                    color: a.type === 'quiz' ? '#0D652D' : '#7B1FA2',
                                                }}>{a.type === 'quiz' ? 'quiz' : 'edit_note'}</span>
                                            </div>
                                            <div>
                                                <Text strong style={{ fontSize: 15 }}>{a.title}</Text>
                                                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                                    <Tag color={a.type === 'quiz' ? 'green' : 'purple'}>
                                                        {a.type === 'quiz' ? 'Trắc nghiệm' : 'Tự luận'}
                                                    </Tag>
                                                    <Tag>{a.subject}</Tag>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col>
                                        <div style={{ textAlign: 'right' }}>
                                            {isSubmitted ? (
                                                mySub?.score !== null ? (
                                                    <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
                                                        {mySub?.score}/{mySub?.maxScore}
                                                    </Tag>
                                                ) : (
                                                    <Tag color="blue">Đã nộp — chờ chấm</Tag>
                                                )
                                            ) : isOverdue ? (
                                                <Tag color="red">Quá hạn</Tag>
                                            ) : (
                                                <Tag color="gold">Chưa nộp</Tag>
                                            )}
                                            <div style={{ fontSize: 12, color: '#70757A', marginTop: 4 }}>
                                                Hạn: {dayjs(a.dueDate).format('DD/MM/YYYY')}
                                            </div>
                                            <div style={{ fontSize: 12, marginTop: 4 }}>
                                                <Text type="secondary">{a.submissionCount || 0} bài nộp</Text>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </Card>
                        );
                    })}
                </div>
            )}

            {}
            <Modal
                title={selected?.title}
                open={submitOpen}
                onCancel={() => setSubmitOpen(false)}
                onOk={handleSubmit}
                okText="Nộp bài"
                width={640}
                styles={{ body: { maxHeight: '65vh', overflowY: 'auto' } }}
            >
                {selected && (
                    <div>
                        <Alert message={selected.description || 'Không có mô tả'} type="info"
                            style={{ borderRadius: 12, marginBottom: 16 }} />

                        {selected.type === 'quiz' && selected.questions?.map((q, qi) => (
                            <Card key={qi} size="small" style={{ marginBottom: 12, borderRadius: 12, background: '#F8FAFD' }}>
                                <Text strong>Câu {qi + 1}: {q.question}</Text>
                                <Radio.Group
                                    value={quizAnswers[qi]}
                                    onChange={e => {
                                        const updated = [...quizAnswers];
                                        updated[qi] = e.target.value;
                                        setQuizAnswers(updated);
                                    }}
                                    style={{ marginTop: 8, width: '100%' }}
                                >
                                    <Space direction="vertical">
                                        {q.options.map((opt, oi) => (
                                            <Radio key={oi} value={oi}>{String.fromCharCode(65 + oi)}. {opt}</Radio>
                                        ))}
                                    </Space>
                                </Radio.Group>
                            </Card>
                        ))}

                        {selected.type === 'essay' && (
                            <div>
                                <Text strong>Bài làm:</Text>
                                <TextArea
                                    rows={8}
                                    value={essayText}
                                    onChange={e => setEssayText(e.target.value)}
                                    placeholder="Viết bài làm của bạn ở đây..."
                                    style={{ marginTop: 8, borderRadius: 12 }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {}
            <Drawer
                title="Kết quả bài tập"
                open={resultOpen}
                onClose={() => setResultOpen(false)}
                width={500}
            >
                {selected && (() => {
                    const mySub = getMySubmission(selected.id);
                    return mySub ? (
                        <div>
                            <Card bordered={false} style={{ background: mySub.score !== null && mySub.score >= selected.maxScore * 0.5 ? '#E6F4EA' : '#F9DEDC', borderRadius: 16, textAlign: 'center', marginBottom: 16 }}>
                                <Statistic
                                    title="Điểm số"
                                    value={mySub.score ?? '—'}
                                    suffix={`/ ${mySub.maxScore}`}
                                    valueStyle={{ fontSize: 32, fontWeight: 700, color: mySub.score !== null && mySub.score >= selected.maxScore * 0.5 ? '#0D652D' : '#B3261E' }}
                                />
                                {mySub.gradedBy && (
                                    <Tag color={mySub.gradedBy === 'ai' ? 'blue' : 'default'} style={{ marginTop: 8 }}>
                                        Chấm bởi {mySub.gradedBy === 'ai' ? 'AI' : 'Giáo viên'}
                                    </Tag>
                                )}
                            </Card>

                            {mySub.feedback && (
                                <div>
                                    <Text strong>Nhận xét:</Text>
                                    <Card style={{ marginTop: 8, borderRadius: 12, background: '#F8FAFD' }}>
                                        <Paragraph>{mySub.feedback}</Paragraph>
                                    </Card>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Alert message="Chưa có kết quả" type="info" style={{ borderRadius: 12 }} />
                    );
                })()}
            </Drawer>
        </div>
    );
}

export default function AssignmentsPage() {
    const { user } = useAuthStore();
    const userRole = user?.role;

    if (isAdmin(userRole) || isTeacher(userRole)) {
        return <TeacherAssignments />;
    }
    return <StudentAssignments />;
}
