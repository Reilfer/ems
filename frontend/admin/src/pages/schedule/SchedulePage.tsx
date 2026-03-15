import { useState } from 'react';
import {
    Tabs, Table, Card, Row, Col, Button, Select, Tag, Typography, Statistic,
    Space, Modal, Form, Input, message, TimePicker, Badge, Alert, Calendar, List, Empty,
} from 'antd';
import { useDataStore } from '../../stores/dataStore';
import type { ScheduleEntry, SchoolEvent } from '../../stores/dataStore';

const { Title, Text } = Typography;
const { Option } = Select;

const teachers = [
    { id: 't1', name: 'Nguyễn Văn Tùng', subjects: ['math'] },
    { id: 't2', name: 'Trần Thị Mai', subjects: ['literature'] },
    { id: 't3', name: 'Lê Hồng Phúc', subjects: ['english'] },
    { id: 't4', name: 'Phạm Văn Đức', subjects: ['physics'] },
    { id: 't5', name: 'Vũ Thị Lan', subjects: ['chemistry'] },
    { id: 't6', name: 'Hoàng Minh Tâm', subjects: ['biology', 'chemistry'] },
];

const subjects: Record<string, string> = {
    math: 'Toán', literature: 'Ngữ văn', english: 'Tiếng Anh',
    physics: 'Vật lý', chemistry: 'Hóa học', biology: 'Sinh học',
    history: 'Lịch sử', geography: 'Địa lý', pe: 'Thể dục', it: 'Tin học',
};

const classes = ['10A1', '10A2', '11A1', '11A2', '12A1'];

const periods = [
    { id: 1, label: 'Tiết 1', time: '07:00 - 07:45' },
    { id: 2, label: 'Tiết 2', time: '07:50 - 08:35' },
    { id: 3, label: 'Tiết 3', time: '08:50 - 09:35' },
    { id: 4, label: 'Tiết 4', time: '09:40 - 10:25' },
    { id: 5, label: 'Tiết 5', time: '10:30 - 11:15' },
];

const days = ['T2', 'T3', 'T4', 'T5', 'T6'];

const rooms = ['P.101', 'P.102', 'P.103', 'P.201', 'P.202', 'P.TH1', 'P.TH2', 'Lab 1', 'Lab 2', 'Sân TT'];

interface RoomBooking {
    id: string;
    room: string;
    bookedBy: string;
    date: string;
    period: string;
    purpose: string;
}

const demoBookings: RoomBooking[] = [
    { id: 'b1', room: 'P.TH1', bookedBy: 'Nguyễn Văn Tùng', date: '2025-10-15', period: 'Tiết 3-4', purpose: 'Ôn tập Toán lớp 12' },
    { id: 'b2', room: 'Lab 1', bookedBy: 'Vũ Thị Lan', date: '2025-10-16', period: 'Tiết 1-2', purpose: 'Thí nghiệm Hóa học' },
];

let entryCounter = 20;
let bookingCounter = 10;

export default function SchedulePage() {
    const { scheduleEntries: schedule, schoolEvents, addScheduleEntry, deleteScheduleEntry } = useDataStore();
    const [viewClass, setViewClass] = useState('10A1');
    const [addModal, setAddModal] = useState(false);
    const [bookModal, setBookModal] = useState(false);
    const [conflicts, setConflicts] = useState<string[]>([]);
    const [bookings, setBookings] = useState<RoomBooking[]>([]);
    const [form] = Form.useForm();
    const [bookForm] = Form.useForm();

    const detectConflicts = (entries: ScheduleEntry[]): string[] => {
        const issues: string[] = [];
        for (let i = 0; i < entries.length; i++) {
            for (let j = i + 1; j < entries.length; j++) {
                const a = entries[i], b = entries[j];
                if (a.day !== b.day || a.period !== b.period) continue;

                if (a.teacherId === b.teacherId) {
                    issues.push(`GV ${a.teacherName} bị trùng: ${a.day} Tiết ${a.period} — ${a.className} vs ${b.className}`);
                }

                if (a.room === b.room && a.className !== b.className) {
                    issues.push(`Phòng ${a.room} bị trùng: ${a.day} Tiết ${a.period} — ${a.className} vs ${b.className}`);
                }
            }
        }
        return issues;
    };

    const handleAdd = () => {
        form.validateFields().then(values => {
            const teacher = teachers.find(t => t.id === values.teacherId);
            entryCounter++;
            const newEntry: ScheduleEntry = {
                id: `s${entryCounter}`,
                day: values.day,
                period: values.period,
                className: values.className,
                teacherId: values.teacherId,
                teacherName: teacher?.name || '',
                subject: values.subject,
                room: values.room,
            };

            const updatedScheduleForConflictCheck = [...schedule, newEntry];
            const issues = detectConflicts(updatedScheduleForConflictCheck);
            setConflicts(issues);

            if (issues.length > 0) {
                Modal.confirm({
                    title: `Phát hiện ${issues.length} xung đột!`,
                    content: (
                        <div>{issues.map((issue, i) => (
                            <div key={i} style={{ padding: '4px 0', fontSize: 13, color: '#B3261E' }}>{issue}</div>
                        ))}</div>
                    ),
                    okText: 'Vẫn thêm',
                    cancelText: 'Hủy',
                    onOk: () => {
                        addScheduleEntry(newEntry);
                        message.warning('Đã thêm nhưng có xung đột TKB!');
                        setAddModal(false);
                        form.resetFields();
                    },
                });
            } else {
                addScheduleEntry(newEntry);
                message.success('Đã thêm vào TKB');
                setAddModal(false);
                form.resetFields();
            }
        });
    };

    const handleBook = () => {
        bookForm.validateFields().then(values => {
            bookingCounter++;
            setBookings(prev => [{
                id: `b${bookingCounter}`,
                ...values,
            }, ...prev]);
            message.success('Đã đặt phòng');
            setBookModal(false);
            bookForm.resetFields();
        });
    };

    const handleDelete = (id: string) => {
        deleteScheduleEntry(id);
        message.success('Đã xóa');
    };

    const classSchedule = schedule.filter(s => s.className === viewClass);

    const subjectColors: Record<string, { bg: string; color: string }> = {
        math: { bg: '#E8F0FE', color: '#0B57D0' },
        literature: { bg: '#FCE8E6', color: '#C5221F' },
        english: { bg: '#E6F4EA', color: '#0D652D' },
        physics: { bg: '#EADDFF', color: '#6750A4' },
        chemistry: { bg: '#FEF7E0', color: '#E37400' },
        biology: { bg: '#E6F4EA', color: '#137333' },
        history: { bg: '#FFF3E0', color: '#E65100' },
        geography: { bg: '#E3F2FD', color: '#1565C0' },
        pe: { bg: '#F1F4F8', color: '#444746' },
        it: { bg: '#E8F0FE', color: '#0B57D0' },
    };

    const timetableColumns = [
        {
            title: 'Tiết', key: 'period', width: 120, fixed: 'left' as const,
            render: (_: any, r: any) => (
                <div>
                    <Text strong style={{ fontSize: 13 }}>{r.label}</Text>
                    <div style={{ fontSize: 11, color: '#444746' }}>{r.time}</div>
                </div>
            ),
        },
        ...days.map(day => ({
            title: day, key: day, width: 160,
            render: (_: any, r: any) => {
                const entry = classSchedule.find(e => e.day === day && e.period === r.id);
                if (!entry) return <div style={{ color: '#C4C7C5', fontSize: 12 }}>—</div>;
                const sc = subjectColors[entry.subject] || { bg: '#F1F4F8', color: '#444746' };
                return (
                    <div style={{
                        background: sc.bg,
                        borderRadius: 8,
                        padding: '6px 10px',
                        cursor: 'pointer',
                    }} onClick={() => handleDelete(entry.id)}>
                        <div style={{ fontWeight: 500, fontSize: 13, color: sc.color }}>{subjects[entry.subject]}</div>
                        <div style={{ fontSize: 11, color: '#444746' }}>{entry.teacherName}</div>
                        <div style={{ fontSize: 10, color: '#747775' }}>{entry.room}</div>
                    </div>
                );
            },
        })),
    ];

    const eventTypeColors: Record<string, { bg: string; color: string }> = {
        ACADEMIC: { bg: '#E8F0FE', color: '#0B57D0' },
        HOLIDAY: { bg: '#E6F4EA', color: '#0D652D' },
        EXAM: { bg: '#FCE8E6', color: '#B3261E' },
        EVENT: { bg: '#EADDFF', color: '#6750A4' },
    };

    const eventTypeLabels: Record<string, string> = {
        ACADEMIC: 'Học vụ', HOLIDAY: 'Ngày lễ', EXAM: 'Thi cử', EVENT: 'Sự kiện',
    };

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                <Col>
                    <Title level={4} style={{ margin: 0, fontFamily: "'Google Sans', sans-serif", fontWeight: 500, color: '#191C1E' }}>
                        Thời khóa biểu
                    </Title>
                </Col>
                <Col>
                    <Space>
                        <Select value={viewClass} onChange={setViewClass} style={{ width: 120 }}>
                            {classes.map(c => <Option key={c} value={c}>{c}</Option>)}
                        </Select>
                        <Button type="primary" onClick={() => setAddModal(true)}>Thêm tiết học</Button>
                        <Button onClick={() => setBookModal(true)} style={{ background: '#EADDFF', color: '#6750A4', border: 'none' }}>Đặt phòng</Button>
                    </Space>
                </Col>
            </Row>

            {}
            {conflicts.length > 0 && (
                <Alert type="error" showIcon closable
                    message={`${conflicts.length} xung đột TKB`}
                    description={conflicts.map((c, i) => <div key={i} style={{ fontSize: 12 }}>{c}</div>)}
                    style={{ marginBottom: 16, borderRadius: 12 }} />
            )}

            {}
            <Row gutter={16} style={{ marginBottom: 16 }}>
                {[
                    { title: 'Tổng tiết/tuần', value: classSchedule.length, bg: '#E8F0FE' },
                    { title: 'Giáo viên', value: new Set(classSchedule.map(s => s.teacherId)).size, bg: '#E6F4EA' },
                    { title: 'Môn học', value: new Set(classSchedule.map(s => s.subject)).size, bg: '#FEF7E0' },
                    { title: 'Xung đột', value: conflicts.length, bg: conflicts.length > 0 ? '#F9DEDC' : '#E6F4EA' },
                ].map((item, i) => (
                    <Col span={6} key={i}>
                        <Card size="small" bordered={false} style={{ background: item.bg, border: 'none' }}>
                            <Statistic title={<span style={{ fontSize: 12, color: '#444746' }}>{item.title}</span>}
                                value={item.value} valueStyle={{ fontFamily: "'Google Sans', sans-serif", fontWeight: 500, fontSize: 18 }} />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Tabs defaultActiveKey="timetable" items={[
                {
                    key: 'timetable',
                    label: 'Thời khóa biểu',
                    children: (
                        <Card bordered size="small">
                            <Text style={{ fontSize: 12, color: '#444746', display: 'block', marginBottom: 8 }}>
                                Bấm vào ô để xóa tiết học
                            </Text>
                            <Table columns={timetableColumns} dataSource={periods} rowKey="id" bordered={false} size="small" pagination={false} scroll={{ x: 960 }} />
                        </Card>
                    ),
                },
                {
                    key: 'events',
                    label: 'Sự kiện trường',
                    children: (
                        <Row gutter={16}>
                            <Col xs={24} lg={14}>
                                <List size="small" bordered={false}
                                    dataSource={schoolEvents}
                                    renderItem={event => (
                                        <List.Item>
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', width: '100%' }}>
                                                <div style={{
                                                    minWidth: 48, height: 48, borderRadius: 12,
                                                    background: eventTypeColors[event.type]?.bg || '#F1F4F8',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <Text style={{ fontSize: 16, fontWeight: 700, color: eventTypeColors[event.type]?.color, lineHeight: 1 }}>
                                                        {new Date(event.date).getDate()}
                                                    </Text>
                                                    <Text style={{ fontSize: 10, color: '#444746' }}>
                                                        T{new Date(event.date).getMonth() + 1}
                                                    </Text>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <Text strong style={{ fontSize: 13 }}>{event.title}</Text>
                                                    <div style={{ fontSize: 12, color: '#444746' }}>{event.description}</div>
                                                </div>
                                                <Tag style={{
                                                    background: eventTypeColors[event.type]?.bg,
                                                    color: eventTypeColors[event.type]?.color,
                                                    border: 'none',
                                                }}>{eventTypeLabels[event.type]}</Tag>
                                            </div>
                                        </List.Item>
                                    )} />
                            </Col>
                            <Col xs={24} lg={10}>
                                <Card bordered size="small" title="Lịch">
                                    <Calendar fullscreen={false} />
                                </Card>
                            </Col>
                        </Row>
                    ),
                },
                {
                    key: 'rooms',
                    label: 'Đặt phòng',
                    children: (
                        <Table
                            columns={[
                                { title: 'Phòng', dataIndex: 'room', width: 100, render: (r: string) => <Tag style={{ background: '#EADDFF', color: '#6750A4', border: 'none' }}>{r}</Tag> },
                                { title: 'Người đặt', dataIndex: 'bookedBy', width: 160 },
                                { title: 'Ngày', dataIndex: 'date', width: 120 },
                                { title: 'Tiết', dataIndex: 'period', width: 100 },
                                { title: 'Mục đích', dataIndex: 'purpose', width: 250 },
                            ]}
                            dataSource={bookings} rowKey="id" bordered={false} size="small" locale={{ emptyText: 'Chưa có đặt phòng' }}
                        />
                    ),
                },
            ]} />

            {}
            <Modal title="Thêm tiết học" open={addModal} onOk={handleAdd} onCancel={() => setAddModal(false)}
                okText="Thêm" width={480}>
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="day" label="Thứ" rules={[{ required: true }]}>
                                <Select placeholder="Chọn thứ">
                                    {days.map(d => <Option key={d} value={d}>{d}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="period" label="Tiết" rules={[{ required: true }]}>
                                <Select placeholder="Chọn tiết">
                                    {periods.map(p => <Option key={p.id} value={p.id}>{p.label} ({p.time})</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="className" label="Lớp" rules={[{ required: true }]} initialValue={viewClass}>
                        <Select>
                            {classes.map(c => <Option key={c} value={c}>{c}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="teacherId" label="Giáo viên" rules={[{ required: true }]}>
                        <Select placeholder="Chọn GV">
                            {teachers.map(t => <Option key={t.id} value={t.id}>{t.name} ({t.subjects.map(s => subjects[s]).join(', ')})</Option>)}
                        </Select>
                    </Form.Item>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="subject" label="Môn" rules={[{ required: true }]}>
                                <Select placeholder="Chọn môn">
                                    {Object.entries(subjects).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="room" label="Phòng" rules={[{ required: true }]}>
                                <Select placeholder="Chọn phòng">
                                    {rooms.map(r => <Option key={r} value={r}>{r}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {}
            <Modal title="Đặt phòng họp / phòng học" open={bookModal} onOk={handleBook} onCancel={() => setBookModal(false)}
                okText="Đặt phòng" width={420}>
                <Form form={bookForm} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="room" label="Phòng" rules={[{ required: true }]}>
                        <Select placeholder="Chọn phòng">
                            {rooms.map(r => <Option key={r} value={r}>{r}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="bookedBy" label="Người đặt" rules={[{ required: true }]}>
                        <Input placeholder="Tên người đặt" />
                    </Form.Item>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="date" label="Ngày" rules={[{ required: true }]}>
                                <Input type="date" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="period" label="Tiết / Thời gian" rules={[{ required: true }]}>
                                <Input placeholder="Tiết 3-4" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="purpose" label="Mục đích" rules={[{ required: true }]}>
                        <Input.TextArea rows={2} placeholder="Ôn tập, họp, thí nghiệm..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
