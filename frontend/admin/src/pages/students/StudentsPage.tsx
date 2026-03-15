import { useState, useEffect } from 'react';
import {
    Table, Button, Input, Space, Tag, Modal, Form, Select, DatePicker,
    Drawer, Descriptions, Typography, Row, Col, Card, Statistic, message, Popconfirm,
} from 'antd';
import { studentApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface Student {
    id: string;
    studentCode: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
    parentName?: string;
    parentPhone?: string;
    currentClass?: { id: string; name: string };
    isActive: boolean;
    createdAt: string;
}

const demoStudents: Student[] = [
    { id: '1', studentCode: 'HS20250001', firstName: 'Trần', lastName: 'Văn An', dateOfBirth: '2009-01-15', gender: 'Nam', parentName: 'Trần Văn B', parentPhone: '0901234561', currentClass: { id: '1', name: '10A1' }, isActive: true, createdAt: '2025-09-01' },
    { id: '2', studentCode: 'HS20250002', firstName: 'Lê', lastName: 'Thị Bình', dateOfBirth: '2009-02-15', gender: 'Nữ', parentName: 'Lê Văn C', parentPhone: '0901234562', currentClass: { id: '1', name: '10A1' }, isActive: true, createdAt: '2025-09-01' },
    { id: '3', studentCode: 'HS20250003', firstName: 'Phạm', lastName: 'Minh Châu', dateOfBirth: '2009-03-15', gender: 'Nam', parentName: 'Phạm Văn D', parentPhone: '0901234563', currentClass: { id: '1', name: '10A1' }, isActive: true, createdAt: '2025-09-01' },
    { id: '4', studentCode: 'HS20250004', firstName: 'Hoàng', lastName: 'Đức Dũng', dateOfBirth: '2010-04-15', gender: 'Nam', parentName: 'Hoàng Văn E', parentPhone: '0901234564', currentClass: { id: '2', name: '10A2' }, isActive: true, createdAt: '2025-09-01' },
    { id: '5', studentCode: 'HS20250005', firstName: 'Ngô', lastName: 'Thùy Em', dateOfBirth: '2009-05-15', gender: 'Nữ', parentName: 'Ngô Văn F', parentPhone: '0901234565', currentClass: { id: '2', name: '10A2' }, isActive: true, createdAt: '2025-09-01' },
    { id: '6', studentCode: 'HS20250006', firstName: 'Vũ', lastName: 'Hoàng Giang', dateOfBirth: '2009-06-20', gender: 'Nam', parentName: 'Vũ Văn G', parentPhone: '0901234566', currentClass: { id: '1', name: '10A1' }, isActive: true, createdAt: '2025-09-01' },
    { id: '7', studentCode: 'HS20250007', firstName: 'Đặng', lastName: 'Thu Hà', dateOfBirth: '2009-07-10', gender: 'Nữ', parentName: 'Đặng Văn H', parentPhone: '0901234567', currentClass: { id: '1', name: '10A1' }, isActive: true, createdAt: '2025-09-01' },
];

const isAdmin = (role?: string) => ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'admin'].includes(role || '');

export default function StudentsPage() {
    const { user } = useAuthStore();
    const userIsAdmin = isAdmin(user?.role);

    const teacherClassName = '10A1';

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Student | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [form] = Form.useForm();

    const fetchStudents = async (page = 1, searchTerm = '') => {
        setLoading(true);
        try {
            const res = await studentApi.list({ page, limit: 20, search: searchTerm });
            let data = res.data.data;

            if (!userIsAdmin) {
                data = data.filter((s: Student) => s.currentClass?.name === teacherClassName);
            }
            setStudents(data);
            setPagination(prev => ({ ...prev, current: page, total: res.data.meta.total }));
        } catch {
            let filtered = searchTerm
                ? demoStudents.filter(s =>
                    `${s.firstName} ${s.lastName} ${s.studentCode}`.toLowerCase().includes(searchTerm.toLowerCase()))
                : demoStudents;

            if (!userIsAdmin) {
                filtered = filtered.filter(s => s.currentClass?.name === teacherClassName);
            }
            setStudents(filtered);
            setPagination(prev => ({ ...prev, current: 1, total: filtered.length }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStudents(); }, []);

    const handleSearch = (value: string) => { setSearch(value); fetchStudents(1, value); };
    const handleAdd = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
    const handleEdit = (record: Student) => {
        setEditing(record);
        form.setFieldsValue({ ...record, dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null });
        setModalOpen(true);
    };
    const handleView = async (record: Student) => {
        try { const res = await studentApi.getById(record.id); setSelectedStudent(res.data); }
        catch { setSelectedStudent(record); }
        setDetailOpen(true);
    };
    const handleDelete = async (id: string) => {
        try { await studentApi.delete(id); message.success('Đã xóa học sinh'); fetchStudents(pagination.current, search); }
        catch { message.error('Không thể xóa'); }
    };
    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (values.dateOfBirth) values.dateOfBirth = values.dateOfBirth.format('YYYY-MM-DD');

            if (!userIsAdmin && !editing) {
                values.className = teacherClassName;
            }
            if (editing) { await studentApi.update(editing.id, values); message.success('Cập nhật thành công'); }
            else { await studentApi.create(values); message.success('Thêm học sinh thành công'); }
            setModalOpen(false); fetchStudents(pagination.current, search);
        } catch (err: any) { if (err.response?.data?.message) message.error(err.response.data.message); }
    };

    const columns: any[] = [
        {
            title: 'Mã HS', dataIndex: 'studentCode', width: 120,
            render: (code: string) => <Text strong style={{ color: '#0B57D0' }}>{code}</Text>,
        },
        {
            title: 'Họ tên', key: 'name',
            render: (_: any, r: Student) => <Text strong>{r.firstName} {r.lastName}</Text>,
        },
    ];

    if (userIsAdmin) {
        columns.push({
            title: 'Lớp', key: 'class', width: 100,
            render: (_: any, r: Student) => (
                <Tag style={{ background: '#E8F0FE', color: '#0B57D0', border: 'none' }}>{r.currentClass?.name || '—'}</Tag>
            ),
        });
    }

    columns.push(
        {
            title: 'Ngày sinh', dataIndex: 'dateOfBirth', width: 120,
            render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '—',
        },
        {
            title: 'Phụ huynh', key: 'parent',
            render: (_: any, r: Student) => (
                <div>
                    <div style={{ fontSize: 13 }}>{r.parentName || '—'}</div>
                    <div style={{ fontSize: 11, color: '#747775' }}>{r.parentPhone}</div>
                </div>
            ),
        },
        {
            title: 'Trạng thái', dataIndex: 'isActive', width: 100,
            render: (active: boolean) => (
                <Tag style={{
                    background: active ? '#E6F4EA' : '#F9DEDC',
                    color: active ? '#0D652D' : '#B3261E',
                    border: 'none',
                }}>{active ? 'Đang học' : 'Nghỉ'}</Tag>
            ),
        },
        {
            title: '', key: 'actions', width: userIsAdmin ? 120 : 80,
            render: (_: any, r: Student) => (
                <Space size="small">
                    <Button size="small" type="text" onClick={() => handleView(r)}>Xem</Button>
                    {userIsAdmin && (
                        <>
                            <Button size="small" type="text" onClick={() => handleEdit(r)}>Sửa</Button>
                            <Popconfirm title="Xóa học sinh này?" onConfirm={() => handleDelete(r.id)}>
                                <Button size="small" type="text" danger>Xóa</Button>
                            </Popconfirm>
                        </>
                    )}
                </Space>
            ),
        },
    );

    const pageTitle = userIsAdmin ? 'Quản lý Học sinh' : `Học sinh lớp ${teacherClassName}`;

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                <Col>
                    <Title level={4} style={{ margin: 0, fontFamily: "'Google Sans', sans-serif", fontWeight: 500, color: '#191C1E' }}>
                        {pageTitle}
                    </Title>
                </Col>
                <Col>
                    <Space>
                        <Input
                            placeholder="Tìm theo tên, mã HS..."
                            allowClear
                            onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
                            onChange={(e) => { if (!e.target.value) handleSearch(''); }}
                            style={{ width: 260 }}
                        />
                        <Button onClick={handleAdd} type="primary">Thêm HS</Button>
                    </Space>
                </Col>
            </Row>

            {}
            <Row gutter={16} style={{ marginBottom: 16 }}>
                {[
                    { title: 'Tổng', value: students.length, bg: '#E8F0FE' },
                    { title: 'Đang học', value: students.filter(s => s.isActive).length, bg: '#E6F4EA' },
                    { title: 'Nam', value: students.filter(s => s.gender === 'Nam').length, bg: '#E8F0FE' },
                    { title: 'Nữ', value: students.filter(s => s.gender === 'Nữ').length, bg: '#F3E8FD' },
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

            <Table
                columns={columns}
                dataSource={students}
                rowKey="id"
                loading={loading}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} học sinh`,
                }}
                onChange={(p) => fetchStudents(p.current, search)}
                bordered={false}
                size="middle"
            />

            <Modal
                title={editing ? 'Sửa học sinh' : 'Thêm học sinh mới'}
                open={modalOpen}
                onOk={handleSave}
                onCancel={() => setModalOpen(false)}
                width={640}
                okText={editing ? 'Cập nhật' : 'Thêm'}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="studentCode" label="Mã học sinh" rules={[{ required: true }]}>
                                <Input placeholder="VD: HS20250001" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="gender" label="Giới tính">
                                <Select placeholder="Chọn">
                                    <Option value="Nam">Nam</Option>
                                    <Option value="Nữ">Nữ</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="firstName" label="Họ" rules={[{ required: true }]}><Input placeholder="VD: Nguyễn" /></Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="lastName" label="Tên" rules={[{ required: true }]}><Input placeholder="VD: Văn A" /></Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="dateOfBirth" label="Ngày sinh"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="address" label="Địa chỉ"><Input placeholder="VD: 123 Nguyễn Huệ" /></Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="parentName" label="Tên phụ huynh"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="parentPhone" label="SĐT phụ huynh"><Input /></Form.Item></Col>
                    </Row>
                    {}
                    {!userIsAdmin && !editing && (
                        <div style={{
                            background: '#E8F0FE',
                            padding: '12px 16px',
                            borderRadius: 12,
                            fontSize: 13,
                            color: '#0B57D0',
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 6 }}>info</span>
                            Học sinh sẽ được thêm vào lớp <strong>{teacherClassName}</strong> của bạn
                        </div>
                    )}
                </Form>
            </Modal>

            <Drawer title="Chi tiết Học sinh" open={detailOpen} onClose={() => setDetailOpen(false)} width={560}>
                {selectedStudent && (
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="Mã HS">{selectedStudent.studentCode}</Descriptions.Item>
                        <Descriptions.Item label="Họ tên">{selectedStudent.firstName} {selectedStudent.lastName}</Descriptions.Item>
                        <Descriptions.Item label="Giới tính">{selectedStudent.gender || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Ngày sinh">{selectedStudent.dateOfBirth ? dayjs(selectedStudent.dateOfBirth).format('DD/MM/YYYY') : '—'}</Descriptions.Item>
                        <Descriptions.Item label="Lớp">
                            <Tag style={{ background: '#E8F0FE', color: '#0B57D0', border: 'none' }}>{selectedStudent.currentClass?.name || 'Chưa phân lớp'}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Phụ huynh">{selectedStudent.parentName || '—'}</Descriptions.Item>
                        <Descriptions.Item label="SĐT PH">{selectedStudent.parentPhone || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag style={{
                                background: selectedStudent.isActive ? '#E6F4EA' : '#F9DEDC',
                                color: selectedStudent.isActive ? '#0D652D' : '#B3261E',
                                border: 'none',
                            }}>{selectedStudent.isActive ? 'Đang học' : 'Nghỉ'}</Tag>
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Drawer>
        </div>
    );
}
