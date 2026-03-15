import { useState } from 'react';
import {
    Table, Card, Row, Col, Select, Button, InputNumber, Tag, Space,
    Typography, Drawer, Descriptions, Divider, Statistic, message, Empty,
} from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import type { ScoreRow } from '../../stores/dataStore';

const { Title, Text } = Typography;
const { Option } = Select;

const isAdmin = (role?: string) => ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'admin'].includes(role || '');
const isTeacher = (role?: string) => role === 'TEACHER';

const demoClasses = [
    { id: '1', name: '10A1' },
    { id: '2', name: '10A2' },
    { id: '3', name: '11A1' },
];

const demoSubjects = [
    { id: '1', name: 'Toán', code: 'MATH' },
    { id: '2', name: 'Ngữ văn', code: 'VIET' },
    { id: '3', name: 'Tiếng Anh', code: 'ENG' },
    { id: '4', name: 'Vật lý', code: 'PHY' },
    { id: '5', name: 'Hóa học', code: 'CHEM' },
    { id: '6', name: 'Sinh học', code: 'BIO' },
    { id: '7', name: 'Lịch sử', code: 'HIST' },
    { id: '8', name: 'Địa lý', code: 'GEO' },
];

function classifyScore(avg: number | null): { label: string; bg: string; color: string } {
    if (avg === null) return { label: '—', bg: '#F1F4F8', color: '#444746' };
    if (avg >= 8) return { label: 'Giỏi', bg: '#E6F4EA', color: '#0D652D' };
    if (avg >= 6.5) return { label: 'Khá', bg: '#E8F0FE', color: '#0B57D0' };
    if (avg >= 5) return { label: 'TB', bg: '#FEF7E0', color: '#E37400' };
    if (avg >= 3.5) return { label: 'Yếu', bg: '#FCE8E6', color: '#C5221F' };
    return { label: 'Kém', bg: '#F9DEDC', color: '#A8000A' };
}

function StudentGrades() {
    const { user } = useAuthStore();
    const { grades } = useDataStore();
    const [semester, setSemester] = useState<number>(1);

    const studentCode = 'HS20250001';
    const myGrades = grades.filter(g => g.studentCode === studentCode);

    const allSubjectScores = demoSubjects.map(sub => {
        const found = myGrades.find(g => g.subject === sub.name);
        return found || {
            key: `empty-${sub.id}`,
            studentCode,
            studentName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
            subject: sub.name,
            oral: null, fifteenMin: null, fortyFiveMin: null, midterm: null, final: null, average: null,
        };
    });

    const avgsWithData = allSubjectScores.filter(s => s.average != null);
    const overallAvg = avgsWithData.length > 0
        ? (avgsWithData.reduce((sum, s) => sum + (s.average || 0), 0) / avgsWithData.length).toFixed(2)
        : '—';
    const cls = classifyScore(typeof overallAvg === 'string' ? null : parseFloat(overallAvg));

    const columns = [
        { title: 'Môn học', dataIndex: 'subject', width: 130, render: (t: string) => <Text strong>{t}</Text> },
        { title: 'Miệng', dataIndex: 'oral', width: 70, align: 'center' as const, render: (v: number | null) => v ?? '—' },
        { title: '15 phút', dataIndex: 'fifteenMin', width: 70, align: 'center' as const, render: (v: number | null) => v ?? '—' },
        { title: '1 tiết', dataIndex: 'fortyFiveMin', width: 70, align: 'center' as const, render: (v: number | null) => v ?? '—' },
        { title: 'Giữa kỳ', dataIndex: 'midterm', width: 80, align: 'center' as const, render: (v: number | null) => v ?? '—' },
        { title: 'Cuối kỳ', dataIndex: 'final', width: 80, align: 'center' as const, render: (v: number | null) => v ?? '—' },
        {
            title: 'TB', dataIndex: 'average', width: 70, align: 'center' as const,
            render: (v: number | null) => {
                const c = classifyScore(v);
                return <Tag style={{ background: c.bg, color: c.color, border: 'none', fontWeight: 500, minWidth: 40, textAlign: 'center' as const }}>{v ?? '—'}</Tag>;
            },
        },
        {
            title: 'Xếp loại', key: 'rank', width: 80, align: 'center' as const,
            render: (_: any, r: any) => {
                const c = classifyScore(r.average);
                return <Tag style={{ background: c.bg, color: c.color, border: 'none' }}>{c.label}</Tag>;
            },
        },
    ];

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                <Col>
                    <Title level={4} style={{ margin: 0, fontFamily: "'Google Sans', sans-serif", fontWeight: 500, color: '#191C1E' }}>
                        <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: 8, fontSize: 26 }}>emoji_events</span>
                        Kết quả học tập
                    </Title>
                </Col>
                <Col>
                    <Select value={semester} onChange={setSemester} style={{ width: 120 }}>
                        <Option value={1}>Học kỳ 1</Option>
                        <Option value={2}>Học kỳ 2</Option>
                    </Select>
                </Col>
            </Row>

            {}
            <Card bordered={false} style={{ background: '#F8FAFD', borderRadius: 16, marginBottom: 20 }}>
                <Row align="middle" gutter={24}>
                    <Col>
                        <div style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: cls.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span className="material-symbols-outlined" style={{ color: cls.color, fontSize: 28 }}>school</span>
                        </div>
                    </Col>
                    <Col flex="auto">
                        <Text strong style={{ fontSize: 16 }}>{user?.firstName} {user?.lastName}</Text>
                        <br />
                        <Text style={{ color: '#70757A', fontSize: 13 }}>Lớp 10A1 — HK{semester} — Năm học 2025-2026</Text>
                    </Col>
                    <Col>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 600, color: cls.color, fontFamily: "'Google Sans'" }}>{overallAvg}</div>
                            <Tag style={{ background: cls.bg, color: cls.color, border: 'none', fontWeight: 500, fontSize: 13 }}>{cls.label}</Tag>
                        </div>
                    </Col>
                </Row>
            </Card>

            {}
            <Card bordered style={{ marginBottom: 16, borderRadius: 12 }}>
                {myGrades.length === 0 ? (
                    <Empty description="Chưa có dữ liệu điểm số" />
                ) : (
                    <Table columns={columns} dataSource={allSubjectScores} rowKey="subject" pagination={false} bordered={false} size="small" />
                )}
            </Card>

            <Card bordered={false} style={{ background: '#FEF7E0', borderRadius: 12, padding: '0 8px' }}>
                <Row align="middle" gutter={8}>
                    <Col>
                        <span className="material-symbols-outlined" style={{ color: '#7B5800', fontSize: 20, verticalAlign: 'middle' }}>info</span>
                    </Col>
                    <Col flex="auto">
                        <Text style={{ color: '#7B5800', fontSize: 13 }}>
                            Điểm số được cập nhật bởi giáo viên bộ môn. Nếu có sai sót, vui lòng liên hệ giáo viên chủ nhiệm.
                        </Text>
                    </Col>
                </Row>
            </Card>
        </div>
    );
}

function TeacherGrades() {
    const { grades, setGrades, updateGrade, demoLoaded } = useDataStore();
    const [selectedClass, setSelectedClass] = useState<string>('1');
    const [selectedSubject, setSelectedSubject] = useState<string>('Toán');
    const [semester, setSemester] = useState<number>(1);
    const [transcriptOpen, setTranscriptOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<ScoreRow | null>(null);

    const subjectName = selectedSubject;
    const filteredScores = grades.filter(g => g.subject === subjectName);

    const handleScoreChange = (key: string, field: keyof ScoreRow, value: number | null) => {
        updateGrade(key, subjectName, field, value);
    };

    const handleSave = () => {
        message.success(`Đã lưu điểm ${subjectName} — HK${semester}`);
    };

    const avgScores = filteredScores.filter(s => s.average !== null).map(s => s.average!);
    const classAvg = avgScores.length > 0 ? (avgScores.reduce((a, b) => a + b, 0) / avgScores.length).toFixed(2) : '—';
    const excellent = avgScores.filter(s => s >= 8).length;
    const below = avgScores.filter(s => s < 5).length;

    const pieData = [
        { name: 'Giỏi', value: avgScores.filter(s => s >= 8).length, color: '#0D652D' },
        { name: 'Khá', value: avgScores.filter(s => s >= 6.5 && s < 8).length, color: '#0B57D0' },
        { name: 'TB', value: avgScores.filter(s => s >= 5 && s < 6.5).length, color: '#E37400' },
        { name: 'Yếu/Kém', value: avgScores.filter(s => s < 5).length, color: '#C5221F' },
    ].filter(d => d.value > 0);

    const barData = filteredScores.map(s => ({ name: s.studentName.split(' ').pop(), average: s.average }));

    const scoreInput = (key: string, field: keyof ScoreRow, value: number | null) => (
        <InputNumber min={0} max={10} step={0.5} value={value}
            onChange={(v) => handleScoreChange(key, field, v)}
            style={{ width: 65 }} size="small" />
    );

    const columns = [
        { title: 'Mã HS', dataIndex: 'studentCode', width: 120, render: (t: string) => <Text strong style={{ color: '#0B57D0' }}>{t}</Text> },
        { title: 'Họ tên', dataIndex: 'studentName', width: 160 },
        { title: 'Miệng', key: 'oral', width: 80, render: (_: any, r: ScoreRow) => scoreInput(r.key, 'oral', r.oral) },
        { title: '15 phút', key: 'fifteenMin', width: 80, render: (_: any, r: ScoreRow) => scoreInput(r.key, 'fifteenMin', r.fifteenMin) },
        { title: '1 tiết', key: 'fortyFiveMin', width: 80, render: (_: any, r: ScoreRow) => scoreInput(r.key, 'fortyFiveMin', r.fortyFiveMin) },
        { title: 'Giữa kỳ', key: 'midterm', width: 90, render: (_: any, r: ScoreRow) => scoreInput(r.key, 'midterm', r.midterm) },
        { title: 'Cuối kỳ', key: 'final', width: 90, render: (_: any, r: ScoreRow) => scoreInput(r.key, 'final', r.final) },
        {
            title: 'TB', key: 'average', width: 70,
            render: (_: any, r: ScoreRow) => {
                const cls = classifyScore(r.average);
                return <Tag style={{ background: cls.bg, color: cls.color, border: 'none', fontWeight: 500, minWidth: 40, textAlign: 'center' as const }}>{r.average ?? '—'}</Tag>;
            },
        },
        {
            title: 'Xếp loại', key: 'classify', width: 80,
            render: (_: any, r: ScoreRow) => {
                const cls = classifyScore(r.average);
                return <Tag style={{ background: cls.bg, color: cls.color, border: 'none' }}>{cls.label}</Tag>;
            },
        },
        {
            title: '', key: 'action', width: 50,
            render: (_: any, r: ScoreRow) => (
                <Button size="small" type="text" onClick={() => { setSelectedStudent(r); setTranscriptOpen(true); }}>Xem</Button>
            ),
        },
    ];

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                <Col>
                    <Title level={4} style={{ margin: 0, fontFamily: "'Google Sans', sans-serif", fontWeight: 500, color: '#191C1E' }}>
                        Quản lý Điểm số
                    </Title>
                </Col>
                <Col>
                    <Space>
                        <Select value={selectedClass} onChange={setSelectedClass} style={{ width: 120 }}>
                            {demoClasses.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                        </Select>
                        <Select value={selectedSubject} onChange={setSelectedSubject} style={{ width: 140 }}>
                            {demoSubjects.map(s => <Option key={s.id} value={s.name}>{s.name}</Option>)}
                        </Select>
                        <Select value={semester} onChange={setSemester} style={{ width: 100 }}>
                            <Option value={1}>HK1</Option>
                            <Option value={2}>HK2</Option>
                        </Select>
                        <Button type="primary" onClick={handleSave} disabled={filteredScores.length === 0}>Lưu điểm</Button>
                    </Space>
                </Col>
            </Row>

            {filteredScores.length === 0 ? (
                <Card bordered={false} style={{ background: '#F8FAFD', borderRadius: 16, textAlign: 'center', padding: '48px 0' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#C4C7C5' }}>grading</span>
                    <div style={{ color: '#70757A', marginTop: 12, fontSize: 15 }}>Chưa có dữ liệu điểm</div>
                    <div style={{ color: '#C4C7C5', fontSize: 12, marginTop: 4 }}>Dữ liệu sẽ hiển thị khi có điểm được nhập</div>
                </Card>
            ) : (
                <>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                        {[
                            { title: 'Sĩ số', value: filteredScores.length, bg: '#E8F0FE' },
                            { title: 'TB lớp', value: classAvg, bg: '#E6F4EA' },
                            { title: 'Giỏi', value: excellent + ' / ' + filteredScores.length, bg: '#FEF7E0' },
                            { title: 'Dưới TB', value: below + ' / ' + filteredScores.length, bg: '#FCE8E6' },
                        ].map((item, i) => (
                            <Col span={6} key={i}>
                                <Card size="small" bordered={false} style={{ background: item.bg, border: 'none' }}>
                                    <Statistic title={<span style={{ fontSize: 12, color: '#444746' }}>{item.title}</span>}
                                        value={item.value}
                                        valueStyle={{ fontFamily: "'Google Sans', sans-serif", fontWeight: 500 }}
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <Card bordered style={{ marginBottom: 16 }}>
                        <Table columns={columns} dataSource={filteredScores} rowKey="key" pagination={false}
                            bordered={false} size="small" scroll={{ x: 1000 }} />
                    </Card>

                    <Row gutter={16}>
                        <Col xs={24} lg={10}>
                            <Card title="Phân loại học lực" size="small" bordered>
                                {pieData.length === 0 ? <Empty description="Chưa có điểm" /> : (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}>
                                                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </Card>
                        </Col>
                        <Col xs={24} lg={14}>
                            <Card title="Điểm TB từng HS" size="small" bordered>
                                {barData.length === 0 ? <Empty description="Chưa có điểm" /> : (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={barData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E0E2E0" />
                                            <XAxis dataKey="name" tick={{ fill: '#444746', fontSize: 12 }} />
                                            <YAxis domain={[0, 10]} tick={{ fill: '#444746', fontSize: 12 }} />
                                            <Tooltip />
                                            <Bar dataKey="average" name="Điểm TB" radius={[4, 4, 0, 0]}>
                                                {barData.map((d, i) => {
                                                    const cls = classifyScore(d.average);
                                                    return <Cell key={i} fill={cls.color} />;
                                                })}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </>
            )}

            <Drawer title="Bảng điểm học sinh" open={transcriptOpen} onClose={() => setTranscriptOpen(false)} width={500}>
                {selectedStudent && (
                    <>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Mã HS">{selectedStudent.studentCode}</Descriptions.Item>
                            <Descriptions.Item label="Họ tên">{selectedStudent.studentName}</Descriptions.Item>
                        </Descriptions>
                        <Divider />
                        <Title level={5} style={{ fontWeight: 500 }}>Điểm chi tiết — {subjectName} — HK{semester}</Title>
                        <Descriptions column={2} bordered size="small">
                            <Descriptions.Item label="Miệng">{selectedStudent.oral ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="15 phút">{selectedStudent.fifteenMin ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="1 tiết">{selectedStudent.fortyFiveMin ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Giữa kỳ">{selectedStudent.midterm ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Cuối kỳ">{selectedStudent.final ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="TB">
                                <Tag style={{ background: classifyScore(selectedStudent.average).bg, color: classifyScore(selectedStudent.average).color, border: 'none', fontWeight: 500 }}>
                                    {selectedStudent.average ?? '—'}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>
                        <div style={{ textAlign: 'center', marginTop: 24 }}>
                            <Tag style={{
                                background: classifyScore(selectedStudent.average).bg,
                                color: classifyScore(selectedStudent.average).color,
                                border: 'none', fontSize: 16, padding: '8px 24px', fontWeight: 500,
                            }}>
                                Xếp loại: {classifyScore(selectedStudent.average).label}
                            </Tag>
                        </div>
                    </>
                )}
            </Drawer>
        </div>
    );
}

export default function GradesPage() {
    const { user } = useAuthStore();
    const role = user?.role;

    if (isAdmin(role) || isTeacher(role)) {
        return <TeacherGrades />;
    }
    return <StudentGrades />;
}
