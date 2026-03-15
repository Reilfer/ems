import { useState } from 'react';
import {
    Table, Card, Row, Col, Button, Select, Tag, Typography, Statistic,
    Space, Modal, Form, Input, message, Popconfirm, Avatar, Tooltip, Tabs, Badge,
} from 'antd';
import { pendingRegistrations } from '../auth/RegisterPage';

const { Title, Text } = Typography;
const { Option } = Select;

const roleLabels: Record<string, { label: string; bg: string; color: string }> = {
    SCHOOL_ADMIN: { label: 'Quản trị viên', bg: '#F9DEDC', color: '#B3261E' },
    PRINCIPAL: { label: 'Hiệu trưởng', bg: '#EADDFF', color: '#6750A4' },
    VICE_PRINCIPAL: { label: 'Hiệu phó', bg: '#E8F0FE', color: '#0B57D0' },
    TEACHER: { label: 'Giáo viên', bg: '#E6F4EA', color: '#0D652D' },
    ACCOUNTANT: { label: 'Kế toán', bg: '#FEF7E0', color: '#E37400' },
    LIBRARIAN: { label: 'Thủ thư', bg: '#F1F4F8', color: '#444746' },
    STAFF: { label: 'Nhân viên', bg: '#F1F4F8', color: '#444746' },
    PARENT: { label: 'Phụ huynh', bg: '#FFF3E0', color: '#E65100' },
    STUDENT: { label: 'Học sinh', bg: '#E3F2FD', color: '#1565C0' },
};

const accountTypeLabels: Record<string, { label: string; bg: string; color: string }> = {
    PARENT: { label: 'Phụ huynh', bg: '#FFF3E0', color: '#E65100' },
    STUDENT: { label: 'Học sinh', bg: '#E3F2FD', color: '#1565C0' },
    TEACHER: { label: 'Giáo viên', bg: '#E6F4EA', color: '#0D652D' },
};

interface Account {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    lastLogin: string | null;
}

const initialAccounts: Account[] = [
    { id: '1', email: 'nguyenvana@demo.eduv.vn', firstName: 'Nguyễn Văn', lastName: 'A', phone: '0901234567', role: 'PRINCIPAL', isActive: true, createdAt: '2025-01-15', lastLogin: '2025-10-10' },
    { id: '2', email: 'tranthib@demo.eduv.vn', firstName: 'Trần Thị', lastName: 'B', phone: '0912345678', role: 'VICE_PRINCIPAL', isActive: true, createdAt: '2025-02-01', lastLogin: '2025-10-09' },
    { id: '3', email: 'lehongc@demo.eduv.vn', firstName: 'Lê Hồng', lastName: 'C', phone: '0923456789', role: 'TEACHER', isActive: true, createdAt: '2025-03-10', lastLogin: '2025-10-10' },
    { id: '4', email: 'phamvand@demo.eduv.vn', firstName: 'Phạm Văn', lastName: 'D', phone: '0934567890', role: 'TEACHER', isActive: true, createdAt: '2025-03-10', lastLogin: '2025-10-08' },
    { id: '5', email: 'vuthie@demo.eduv.vn', firstName: 'Vũ Thị', lastName: 'E', phone: '0945678901', role: 'TEACHER', isActive: true, createdAt: '2025-04-01', lastLogin: '2025-10-10' },
    { id: '6', email: 'dangvanf@demo.eduv.vn', firstName: 'Đặng Văn', lastName: 'F', phone: '0956789012', role: 'ACCOUNTANT', isActive: true, createdAt: '2025-05-15', lastLogin: '2025-10-07' },
    { id: '7', email: 'buithig@demo.eduv.vn', firstName: 'Bùi Thị', lastName: 'G', phone: '0967890123', role: 'LIBRARIAN', isActive: false, createdAt: '2025-06-01', lastLogin: null },
];

const demoPending = [
    { id: 'reg-1', accountType: 'PARENT', firstName: 'Đỗ Thị', lastName: 'Hương', email: 'huong.dt@gmail.com', phone: '0971234567', childName: 'Đỗ Minh Khôi', childClass: '10A1', childCode: 'HS20250006', relationship: 'mother', status: 'PENDING', createdAt: '2025-10-10T08:30:00' },
    { id: 'reg-2', accountType: 'STUDENT', firstName: 'Lý Minh', lastName: 'Quân', email: 'quan.lm@gmail.com', phone: '0982345678', studentCode: 'HS20250007', class: '10A2', gender: 'male', status: 'PENDING', createdAt: '2025-10-10T09:15:00' },
    { id: 'reg-3', accountType: 'TEACHER', firstName: 'Hoàng Thị', lastName: 'Lan', email: 'lan.ht@gmail.com', phone: '0993456789', subject: 'english', qualification: 'master', status: 'PENDING', createdAt: '2025-10-09T14:00:00' },
];

let idCounter = initialAccounts.length;

export default function TeachersPage() {
    const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
    const [pending, setPending] = useState<any[]>([...demoPending, ...pendingRegistrations]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [filterRole, setFilterRole] = useState<string>('');
    const [approveModal, setApproveModal] = useState<{ open: boolean; reg?: any; role?: string }>({ open: false });
    const [form] = Form.useForm();

    const filtered = filterRole ? accounts.filter(a => a.role === filterRole) : accounts;

    const refreshPending = () => {
        const allPending = [...demoPending, ...pendingRegistrations].filter(r => r.status === 'PENDING');
        setPending(allPending);
    };

    const openCreate = () => {
        setEditingAccount(null);
        form.resetFields();
        form.setFieldsValue({ role: 'TEACHER' });
        setModalOpen(true);
    };

    const openEdit = (acc: Account) => {
        setEditingAccount(acc);
        form.setFieldsValue(acc);
        setModalOpen(true);
    };

    const handleSave = () => {
        form.validateFields().then(values => {
            if (editingAccount) {
                setAccounts(prev => prev.map(a => a.id === editingAccount.id ? { ...a, ...values } : a));
                message.success('Đã cập nhật tài khoản');
            } else {
                idCounter++;
                const newAcc: Account = {
                    id: String(idCounter),
                    ...values,
                    isActive: true,
                    createdAt: new Date().toISOString().slice(0, 10),
                    lastLogin: null,
                };
                setAccounts(prev => [newAcc, ...prev]);
                message.success(`Đã tạo tài khoản cho ${values.firstName} ${values.lastName}`);
            }
            setModalOpen(false);
            form.resetFields();
        });
    };

    const handleDelete = (id: string) => {
        setAccounts(prev => prev.filter(a => a.id !== id));
        message.success('Đã xóa tài khoản');
    };

    const toggleActive = (id: string) => {
        setAccounts(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    };

    const handleApprove = (reg: any) => {
        const defaultRole = reg.accountType === 'TEACHER' ? 'TEACHER' : reg.accountType === 'STUDENT' ? 'STUDENT' : 'PARENT';
        setApproveModal({ open: true, reg, role: defaultRole });
    };

    const confirmApprove = () => {
        const { reg, role } = approveModal;
        if (!reg || !role) return;

        idCounter++;
        const newAcc: Account = {
            id: String(idCounter),
            email: reg.email,
            firstName: reg.firstName,
            lastName: reg.lastName,
            phone: reg.phone,
            role: role,
            isActive: true,
            createdAt: new Date().toISOString().slice(0, 10),
            lastLogin: null,
        };
        setAccounts(prev => [newAcc, ...prev]);

        reg.status = 'APPROVED';
        setPending(prev => prev.filter(p => p.id !== reg.id));

        message.success(`Đã duyệt tài khoản ${reg.firstName} ${reg.lastName} — Vai trò: ${roleLabels[role]?.label || role}`);
        setApproveModal({ open: false });
    };

    const handleReject = (regId: string) => {
        const reg = pending.find(p => p.id === regId);
        if (reg) reg.status = 'REJECTED';
        setPending(prev => prev.filter(p => p.id !== regId));
        message.info('Đã từ chối đăng ký');
    };

    const getInitials = (first: string, last: string) => (first.charAt(0) + last.charAt(0)).toUpperCase();

    const active = accounts.filter(a => a.isActive).length;
    const teachers = accounts.filter(a => a.role === 'TEACHER').length;
    const pendingCount = pending.filter(p => p.status === 'PENDING').length;

    const accountColumns = [
        {
            title: 'Tài khoản', key: 'user', width: 260,
            render: (_: any, r: Account) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar style={{ background: roleLabels[r.role]?.bg || '#E8F0FE', color: roleLabels[r.role]?.color || '#0B57D0', fontWeight: 500, fontSize: 13 }} size={34}>
                        {getInitials(r.firstName, r.lastName)}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 500, color: '#191C1E', fontSize: 13 }}>{r.firstName} {r.lastName}</div>
                        <div style={{ fontSize: 12, color: '#444746' }}>{r.email}</div>
                    </div>
                </div>
            ),
        },
        { title: 'SĐT', dataIndex: 'phone', width: 120 },
        {
            title: 'Vai trò', dataIndex: 'role', width: 140,
            render: (role: string) => {
                const r = roleLabels[role] || { label: role, bg: '#F1F4F8', color: '#444746' };
                return <Tag style={{ background: r.bg, color: r.color, border: 'none', fontWeight: 500 }}>{r.label}</Tag>;
            },
        },
        {
            title: 'Trạng thái', dataIndex: 'isActive', width: 110,
            render: (isActive: boolean, r: Account) => (
                <Tooltip title={isActive ? 'Bấm để khóa' : 'Bấm để kích hoạt'}>
                    <Tag style={{ cursor: 'pointer', background: isActive ? '#E6F4EA' : '#F9DEDC', color: isActive ? '#0D652D' : '#B3261E', border: 'none' }}
                        onClick={() => toggleActive(r.id)}>
                        {isActive ? 'Hoạt động' : 'Đã khóa'}
                    </Tag>
                </Tooltip>
            ),
        },
        { title: 'Ngày tạo', dataIndex: 'createdAt', width: 110 },
        {
            title: '', key: 'action', width: 120,
            render: (_: any, r: Account) => (
                <Space>
                    <Button size="small" type="text" onClick={() => openEdit(r)}>Sửa</Button>
                    <Popconfirm title="Xóa tài khoản này?" onConfirm={() => handleDelete(r.id)}>
                        <Button size="small" type="text" danger>Xóa</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const pendingColumns = [
        {
            title: 'Người đăng ký', key: 'user', width: 240,
            render: (_: any, r: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar style={{ background: accountTypeLabels[r.accountType]?.bg || '#F1F4F8', color: accountTypeLabels[r.accountType]?.color || '#444746', fontWeight: 500, fontSize: 13 }} size={34}>
                        {getInitials(r.firstName, r.lastName)}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 500, color: '#191C1E', fontSize: 13 }}>{r.firstName} {r.lastName}</div>
                        <div style={{ fontSize: 12, color: '#444746' }}>{r.email}</div>
                    </div>
                </div>
            ),
        },
        { title: 'SĐT', dataIndex: 'phone', width: 120 },
        {
            title: 'Loại TK', dataIndex: 'accountType', width: 120,
            render: (type: string) => {
                const t = accountTypeLabels[type] || { label: type, bg: '#F1F4F8', color: '#444746' };
                return <Tag style={{ background: t.bg, color: t.color, border: 'none', fontWeight: 500 }}>{t.label}</Tag>;
            },
        },
        {
            title: 'Thông tin thêm', key: 'extra', width: 200,
            render: (_: any, r: any) => {
                if (r.accountType === 'PARENT') return <Text style={{ fontSize: 12, color: '#444746' }}>Con: {r.childName} — Lớp {r.childClass}</Text>;
                if (r.accountType === 'STUDENT') return <Text style={{ fontSize: 12, color: '#444746' }}>Mã: {r.studentCode} — Lớp {r.class}</Text>;
                if (r.accountType === 'TEACHER') return <Text style={{ fontSize: 12, color: '#444746' }}>Môn: {r.subject} — {r.qualification}</Text>;
                return null;
            },
        },
        {
            title: 'Thời gian', dataIndex: 'createdAt', width: 150,
            render: (t: string) => new Date(t).toLocaleString('vi-VN'),
        },
        {
            title: '', key: 'action', width: 160,
            render: (_: any, r: any) => (
                <Space>
                    <Button size="small" type="primary" onClick={() => handleApprove(r)}>Duyệt</Button>
                    <Popconfirm title="Từ chối đăng ký này?" onConfirm={() => handleReject(r.id)}>
                        <Button size="small" danger>Từ chối</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                <Col>
                    <Title level={4} style={{ margin: 0, fontFamily: "'Google Sans', sans-serif", fontWeight: 500, color: '#191C1E' }}>
                        Quản lý Tài khoản
                    </Title>
                </Col>
                <Col>
                    <Space>
                        <Select value={filterRole} onChange={setFilterRole} style={{ width: 160 }} allowClear placeholder="Lọc vai trò">
                            {Object.entries(roleLabels).map(([key, val]) => (
                                <Option key={key} value={key}>{val.label}</Option>
                            ))}
                        </Select>
                        <Button type="primary" onClick={openCreate}>Tạo tài khoản</Button>
                    </Space>
                </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
                {[
                    { title: 'Tổng tài khoản', value: accounts.length, bg: '#E8F0FE' },
                    { title: 'Đang hoạt động', value: active, bg: '#E6F4EA' },
                    { title: 'Giáo viên', value: teachers, bg: '#FEF7E0' },
                    { title: 'Chờ duyệt', value: pendingCount, bg: '#FCE8E6' },
                ].map((item, i) => (
                    <Col span={6} key={i}>
                        <Card size="small" bordered={false} style={{ background: item.bg, border: 'none' }}>
                            <Statistic
                                title={<span style={{ fontSize: 12, color: '#444746' }}>{item.title}</span>}
                                value={item.value}
                                valueStyle={{ fontFamily: "'Google Sans', sans-serif", fontWeight: 500, fontSize: 18 }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Tabs defaultActiveKey="accounts" items={[
                {
                    key: 'accounts',
                    label: 'Tài khoản',
                    children: (
                        <Table columns={accountColumns} dataSource={filtered} rowKey="id" bordered={false} size="small"
                            pagination={{ pageSize: 10, showTotal: t => `Tổng ${t} tài khoản` }}
                        />
                    ),
                },
                {
                    key: 'pending',
                    label: <Badge count={pendingCount} offset={[12, 0]} size="small">Chờ duyệt</Badge>,
                    children: (
                        <Table columns={pendingColumns} dataSource={pending.filter(p => p.status === 'PENDING')} rowKey="id" bordered={false} size="small"
                            pagination={false}
                            locale={{ emptyText: 'Không có đăng ký nào đang chờ duyệt' }}
                        />
                    ),
                },
            ]} />

            {}
            <Modal title={editingAccount ? 'Sửa tài khoản' : 'Tạo tài khoản mới'} open={modalOpen}
                onOk={handleSave} onCancel={() => setModalOpen(false)}
                okText={editingAccount ? 'Cập nhật' : 'Tạo'} width={480}>
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="firstName" label="Họ" rules={[{ required: true, message: 'Nhập họ' }]}>
                                <Input placeholder="Nguyễn Văn" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="lastName" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}>
                                <Input placeholder="A" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email hợp lệ' }]}>
                        <Input placeholder="example@demo.eduv.vn" />
                    </Form.Item>
                    <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập SĐT' }]}>
                        <Input placeholder="0901234567" />
                    </Form.Item>
                    <Form.Item name="role" label="Vai trò" rules={[{ required: true, message: 'Chọn vai trò' }]}>
                        <Select placeholder="Chọn vai trò">
                            {Object.entries(roleLabels).map(([key, val]) => (
                                <Option key={key} value={key}>{val.label}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {!editingAccount && (
                        <div style={{ background: '#E6F4EA', borderRadius: 12, padding: 12 }}>
                            <Text style={{ fontSize: 12, color: '#0D652D' }}>
                                Mật khẩu mặc định: <Text strong>EduV@2025</Text>
                            </Text>
                        </div>
                    )}
                </Form>
            </Modal>

            {}
            <Modal title="Duyệt tài khoản" open={approveModal.open}
                onOk={confirmApprove} onCancel={() => setApproveModal({ open: false })}
                okText="Duyệt & Cấp quyền" width={420}>
                {approveModal.reg && (
                    <div style={{ marginTop: 16 }}>
                        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                            <Col span={8}><Text style={{ color: '#444746', fontSize: 13 }}>Họ tên</Text></Col>
                            <Col span={16}><Text strong>{approveModal.reg.firstName} {approveModal.reg.lastName}</Text></Col>
                            <Col span={8}><Text style={{ color: '#444746', fontSize: 13 }}>Email</Text></Col>
                            <Col span={16}><Text>{approveModal.reg.email}</Text></Col>
                            <Col span={8}><Text style={{ color: '#444746', fontSize: 13 }}>Loại TK</Text></Col>
                            <Col span={16}>
                                <Tag style={{ background: accountTypeLabels[approveModal.reg.accountType]?.bg, color: accountTypeLabels[approveModal.reg.accountType]?.color, border: 'none' }}>
                                    {accountTypeLabels[approveModal.reg.accountType]?.label}
                                </Tag>
                            </Col>
                            {approveModal.reg.accountType === 'PARENT' && (
                                <>
                                    <Col span={8}><Text style={{ color: '#444746', fontSize: 13 }}>Con</Text></Col>
                                    <Col span={16}><Text>{approveModal.reg.childName} — Lớp {approveModal.reg.childClass}</Text></Col>
                                </>
                            )}
                            {approveModal.reg.accountType === 'STUDENT' && (
                                <>
                                    <Col span={8}><Text style={{ color: '#444746', fontSize: 13 }}>Mã HS</Text></Col>
                                    <Col span={16}><Text>{approveModal.reg.studentCode} — Lớp {approveModal.reg.class}</Text></Col>
                                </>
                            )}
                            {approveModal.reg.accountType === 'TEACHER' && (
                                <>
                                    <Col span={8}><Text style={{ color: '#444746', fontSize: 13 }}>Bộ môn</Text></Col>
                                    <Col span={16}><Text>{approveModal.reg.subject} — {approveModal.reg.qualification}</Text></Col>
                                </>
                            )}
                        </Row>

                        <div style={{ marginTop: 8 }}>
                            <Text style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 8, color: '#191C1E' }}>Cấp vai trò</Text>
                            <Select value={approveModal.role} onChange={(v) => setApproveModal(prev => ({ ...prev, role: v }))}
                                style={{ width: '100%' }}>
                                {Object.entries(roleLabels).map(([key, val]) => (
                                    <Option key={key} value={key}>{val.label}</Option>
                                ))}
                            </Select>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
