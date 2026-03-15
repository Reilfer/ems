import { useState, useEffect } from 'react';
import {
    Tabs, Table, Card, Row, Col, Button, Select, Tag, Typography, Statistic,
    Space, Modal, Form, Input, InputNumber, Checkbox, message, Popconfirm, Divider,
} from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const { Title, Text } = Typography;
const { Option } = Select;

const demoClasses = [
    { id: '1', name: '10A1' },
    { id: '2', name: '10A2' },
];

const demoFeeTypes = [
    { id: 'ft-001', name: 'Học phí HK1', amount: 5000000, cycle: 'SEMESTER', isActive: true },
    { id: 'ft-002', name: 'Học phí HK2', amount: 5000000, cycle: 'SEMESTER', isActive: true },
    { id: 'ft-003', name: 'Tiền ăn trưa', amount: 800000, cycle: 'MONTHLY', isActive: true },
    { id: 'ft-004', name: 'Xe đưa đón', amount: 500000, cycle: 'MONTHLY', isActive: true },
    { id: 'ft-005', name: 'BHYT', amount: 600000, cycle: 'YEARLY', isActive: true },
    { id: 'ft-006', name: 'Đồng phục', amount: 350000, cycle: 'ONE_TIME', isActive: true },
];

const demoStudents = [
    { studentCode: 'HS20250001', name: 'Trần Văn An', classId: '1', className: '10A1' },
    { studentCode: 'HS20250002', name: 'Lê Thị Bình', classId: '1', className: '10A1' },
    { studentCode: 'HS20250003', name: 'Phạm Minh Châu', classId: '1', className: '10A1' },
    { studentCode: 'HS20250004', name: 'Hoàng Đức Dũng', classId: '2', className: '10A2' },
    { studentCode: 'HS20250005', name: 'Ngô Thùy Em', classId: '2', className: '10A2' },
];

interface Invoice {
    id: string;
    studentCode: string;
    studentName: string;
    invoiceCode: string;
    items: { feeTypeName: string; amount: number }[];
    totalAmount: number;
    paidAmount: number;
    status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
    dueDate: string;
    createdAt: string;
}

interface PaymentRecord {
    id: string;
    invoiceCode: string;
    studentCode: string;
    studentName: string;
    amount: number;
    method: string;
    transactionId?: string;
    paidAt: string;
}

let invoiceIdCounter = 0;
let paymentIdCounter = 0;

function formatVND(amount: number) {
    return amount.toLocaleString('vi-VN') + '₫';
}

export default function FinancePage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [qrModal, setQrModal] = useState<{ visible: boolean; invoice?: Invoice }>({ visible: false });
    const [batchModal, setBatchModal] = useState(false);
    const [simulateModal, setSimulateModal] = useState(false);
    const [batchForm] = Form.useForm();
    const [simForm] = Form.useForm();

    const totalRevenue = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const totalDebt = invoices.reduce((s, i) => s + Math.max(0, i.totalAmount - i.paidAmount), 0);
    const pendingCount = invoices.filter(i => i.status === 'PENDING').length;
    const paidCount = invoices.filter(i => i.status === 'PAID').length;

    const handleBatchGenerate = () => {
        batchForm.validateFields().then(values => {
            const students = demoStudents.filter(s => s.classId === values.classId);
            const selectedFees = demoFeeTypes.filter(ft => values.feeTypeIds.includes(ft.id));
            const total = selectedFees.reduce((s, ft) => s + ft.amount, 0);
            const month = new Date().toISOString().slice(0, 7).replace('-', '');

            const newInvoices: Invoice[] = students.map(st => {
                invoiceIdCounter++;
                return {
                    id: `inv-${String(invoiceIdCounter).padStart(6, '0')}`,
                    studentCode: st.studentCode,
                    studentName: st.name,
                    invoiceCode: `INV-${st.studentCode}-${month}`,
                    items: selectedFees.map(ft => ({ feeTypeName: ft.name, amount: ft.amount })),
                    totalAmount: total,
                    paidAmount: 0,
                    status: 'PENDING',
                    dueDate: values.dueDate || '2025-10-30',
                    createdAt: new Date().toISOString(),
                };
            });

            setInvoices(prev => [...prev, ...newInvoices]);
            message.success(`Đã tạo ${newInvoices.length} hóa đơn cho lớp ${demoClasses.find(c => c.id === values.classId)?.name}`);
            setBatchModal(false);
            batchForm.resetFields();
        });
    };

    const handleSimulate = () => {
        simForm.validateFields().then(values => {
            const content = `HP ${values.studentCode}`;
            const match = content.match(/HS\d+/i);

            if (!match) {
                message.error('Không tìm thấy mã HS trong nội dung CK');
                return;
            }

            const studentCode = match[0].toUpperCase();
            const pending = invoices.filter(i => i.studentCode === studentCode && i.status === 'PENDING');

            if (pending.length === 0) {
                message.warning(`Không tìm thấy hóa đơn PENDING cho ${studentCode}`);
                return;
            }

            const inv = pending[0];
            const amount = values.amount || inv.totalAmount;

            paymentIdCounter++;
            const payment: PaymentRecord = {
                id: `pay-${String(paymentIdCounter).padStart(6, '0')}`,
                invoiceCode: inv.invoiceCode,
                studentCode: inv.studentCode,
                studentName: inv.studentName,
                amount,
                method: 'BANK_TRANSFER',
                transactionId: `SIM-${Date.now()}`,
                paidAt: new Date().toISOString(),
            };

            setPayments(prev => [payment, ...prev]);
            setInvoices(prev => prev.map(i => {
                if (i.id !== inv.id) return i;
                const newPaid = i.paidAmount + amount;
                return {
                    ...i,
                    paidAmount: newPaid,
                    status: newPaid >= i.totalAmount ? 'PAID' : 'PARTIAL',
                };
            }));

            message.success(`Auto Bank: Đã ghi nhận ${formatVND(amount)} cho ${inv.studentName} (${inv.invoiceCode})`);
            setSimulateModal(false);
            simForm.resetFields();
        });
    };

    const getQRUrl = (inv: Invoice) => {
        const remaining = inv.totalAmount - inv.paidAmount;
        const content = `HP ${inv.studentCode}`;
        return `https://img.vietqr.io/image/970422-0123456789-compact2.png?amount=${remaining}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent('TRUONG THPT DEMO')}`;
    };

    const statusTag = (status: string) => {
        const map: Record<string, { bg: string; color: string; text: string }> = {
            PENDING: { bg: '#FEF7E0', color: '#E37400', text: 'Chờ thanh toán' },
            PARTIAL: { bg: '#E8F0FE', color: '#0B57D0', text: 'Thanh toán một phần' },
            PAID: { bg: '#E6F4EA', color: '#0D652D', text: 'Đã thanh toán' },
            OVERDUE: { bg: '#F9DEDC', color: '#B3261E', text: 'Quá hạn' },
        };
        const s = map[status] || map.PENDING;
        return <Tag style={{ background: s.bg, color: s.color, border: 'none' }}>{s.text}</Tag>;
    };

    const invoiceColumns = [
        { title: 'Mã HĐ', dataIndex: 'invoiceCode', width: 200, render: (t: string) => <Text strong style={{ color: '#0B57D0' }}>{t}</Text> },
        { title: 'Học sinh', dataIndex: 'studentName', width: 150 },
        { title: 'Mã HS', dataIndex: 'studentCode', width: 120 },
        {
            title: 'Khoản thu', key: 'items', width: 200,
            render: (_: any, r: Invoice) => r.items.map(i => i.feeTypeName).join(', '),
        },
        { title: 'Tổng tiền', dataIndex: 'totalAmount', width: 130, render: (a: number) => <Text strong>{formatVND(a)}</Text> },
        { title: 'Đã thu', dataIndex: 'paidAmount', width: 130, render: (a: number) => formatVND(a) },
        { title: 'Trạng thái', dataIndex: 'status', width: 140, render: (s: string) => statusTag(s) },
        {
            title: '', key: 'action', width: 80,
            render: (_: any, r: Invoice) => (
                <Button size="small" type="text" onClick={() => setQrModal({ visible: true, invoice: r })}>
                    Xem QR
                </Button>
            ),
        },
    ];

    const paymentColumns = [
        { title: 'Mã HĐ', dataIndex: 'invoiceCode', width: 200, render: (t: string) => <Text strong style={{ color: '#0B57D0' }}>{t}</Text> },
        { title: 'Học sinh', dataIndex: 'studentName', width: 150 },
        { title: 'Số tiền', dataIndex: 'amount', width: 130, render: (a: number) => <Text strong style={{ color: '#0D652D' }}>{formatVND(a)}</Text> },
        { title: 'Phương thức', dataIndex: 'method', width: 140, render: (m: string) => <Tag style={{ background: '#E8F0FE', color: '#0B57D0', border: 'none' }}>{m === 'BANK_TRANSFER' ? 'Chuyển khoản' : m}</Tag> },
        { title: 'Mã GD', dataIndex: 'transactionId', width: 160 },
        { title: 'Thời gian', dataIndex: 'paidAt', width: 180, render: (t: string) => new Date(t).toLocaleString('vi-VN') },
    ];

    const feeTypeColumns = [
        { title: 'Tên khoản thu', dataIndex: 'name', width: 200 },
        { title: 'Số tiền', dataIndex: 'amount', width: 150, render: (a: number) => <Text strong>{formatVND(a)}</Text> },
        {
            title: 'Chu kỳ', dataIndex: 'cycle', width: 120, render: (c: string) => {
                const map: Record<string, string> = { MONTHLY: 'Tháng', SEMESTER: 'Học kỳ', YEARLY: 'Năm', ONE_TIME: 'Một lần' };
                return map[c] || c;
            }
        },
        {
            title: 'Trạng thái', dataIndex: 'isActive', width: 100, render: (a: boolean) => (
                <Tag style={{ background: a ? '#E6F4EA' : '#F9DEDC', color: a ? '#0D652D' : '#B3261E', border: 'none' }}>{a ? 'Hoạt động' : 'Tạm dừng'}</Tag>
            )
        },
    ];

    const pieData = [
        { name: 'Đã thu', value: totalRevenue, color: '#0D652D' },
        { name: 'Còn nợ', value: totalDebt, color: '#E37400' },
    ].filter(d => d.value > 0);

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                <Col>
                    <Title level={4} style={{ margin: 0, fontFamily: "'Google Sans', sans-serif", fontWeight: 500, color: '#191C1E' }}>
                        Quản lý Tài chính
                    </Title>
                </Col>
                <Col>
                    <Space>
                        <Button onClick={() => setBatchModal(true)} type="primary">Tạo hóa đơn</Button>
                        <Button onClick={() => setSimulateModal(true)} style={{ background: '#E6F4EA', color: '#0D652D', border: 'none' }}>
                            Simulate CK
                        </Button>
                    </Space>
                </Col>
            </Row>

            {}
            <Row gutter={16} style={{ marginBottom: 16 }}>
                {[
                    { title: 'Tổng hóa đơn', value: invoices.length, bg: '#E8F0FE' },
                    { title: 'Đã thu', value: formatVND(totalRevenue), bg: '#E6F4EA' },
                    { title: 'Còn nợ', value: formatVND(totalDebt), bg: '#FEF7E0' },
                    { title: 'Chờ TT', value: pendingCount, bg: '#FCE8E6' },
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

            <Tabs
                defaultActiveKey="invoices"
                items={[
                    {
                        key: 'invoices',
                        label: 'Hóa đơn',
                        children: (
                            <Table columns={invoiceColumns} dataSource={invoices} rowKey="id" bordered={false} size="small"
                                pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} hóa đơn` }}
                                locale={{ emptyText: 'Chưa có hóa đơn — bấm "Tạo hóa đơn" để bắt đầu' }}
                            />
                        ),
                    },
                    {
                        key: 'payments',
                        label: 'Lịch sử thanh toán',
                        children: (
                            <Table columns={paymentColumns} dataSource={payments} rowKey="id" bordered={false} size="small"
                                pagination={{ pageSize: 10 }}
                                locale={{ emptyText: 'Chưa có thanh toán — dùng "Simulate CK" để test auto bank' }}
                            />
                        ),
                    },
                    {
                        key: 'feeTypes',
                        label: 'Khoản thu',
                        children: (
                            <Table columns={feeTypeColumns} dataSource={demoFeeTypes} rowKey="id" bordered={false} size="small"
                                pagination={false}
                            />
                        ),
                    },
                    {
                        key: 'chart',
                        label: 'Biểu đồ',
                        children: (
                            <Row gutter={16}>
                                <Col xs={24} lg={12}>
                                    <Card title="Thu / Nợ" bordered size="small">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                                                    dataKey="value" label={({ name, value }) => `${name}: ${formatVND(value)}`}>
                                                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                </Pie>
                                                <Tooltip formatter={(v: any) => formatVND(v)} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </Col>
                                <Col xs={24} lg={12}>
                                    <Card title="Khoản thu" bordered size="small">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={demoFeeTypes}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E0E2E0" />
                                                <XAxis dataKey="name" tick={{ fill: '#444746', fontSize: 11 }} angle={-20} />
                                                <YAxis tick={{ fill: '#444746', fontSize: 12 }} />
                                                <Tooltip formatter={(v: any) => formatVND(v)} />
                                                <Bar dataKey="amount" name="Số tiền" fill="#0B57D0" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </Col>
                            </Row>
                        ),
                    },
                ]}
            />

            {}
            <Modal title="Tạo hóa đơn hàng loạt" open={batchModal} onOk={handleBatchGenerate} onCancel={() => setBatchModal(false)}
                okText="Tạo" width={500}>
                <Form form={batchForm} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="classId" label="Lớp" rules={[{ required: true, message: 'Chọn lớp' }]}>
                        <Select placeholder="Chọn lớp">
                            {demoClasses.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="feeTypeIds" label="Khoản thu" rules={[{ required: true, message: 'Chọn ít nhất 1 khoản thu' }]}>
                        <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {demoFeeTypes.map(ft => (
                                <Checkbox key={ft.id} value={ft.id}>
                                    {ft.name} — <Text strong>{formatVND(ft.amount)}</Text>
                                </Checkbox>
                            ))}
                        </Checkbox.Group>
                    </Form.Item>
                    <Form.Item name="dueDate" label="Hạn thanh toán" initialValue="2025-10-30">
                        <Input type="date" />
                    </Form.Item>
                </Form>
            </Modal>

            {}
            <Modal title="Simulate chuyển khoản ngân hàng" open={simulateModal} onOk={handleSimulate} onCancel={() => setSimulateModal(false)}
                okText="Chuyển khoản" width={460}>
                <div style={{ background: '#E6F4EA', borderRadius: 12, padding: 12, marginBottom: 16 }}>
                    <Text style={{ fontSize: 12, color: '#0D652D' }}>
                        Giả lập PH chuyển khoản qua ngân hàng. Hệ thống sẽ auto match hóa đơn theo mã HS trong nội dung CK.
                    </Text>
                </div>
                <Form form={simForm} layout="vertical">
                    <Form.Item name="studentCode" label="Mã học sinh" rules={[{ required: true }]}>
                        <Select placeholder="Chọn HS">
                            {demoStudents.map(s => <Option key={s.studentCode} value={s.studentCode}>{s.studentCode} — {s.name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="amount" label="Số tiền">
                        <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            placeholder="Để trống = auto match số tiền hóa đơn" min={0} />
                    </Form.Item>
                </Form>
            </Modal>

            {}
            <Modal title="Mã QR chuyển khoản" open={qrModal.visible} onCancel={() => setQrModal({ visible: false })} footer={null} width={400}>
                {qrModal.invoice && (
                    <div style={{ textAlign: 'center' }}>
                        <img
                            src={getQRUrl(qrModal.invoice)}
                            alt="VietQR"
                            style={{ width: 280, height: 'auto', borderRadius: 12 }}
                        />
                        <Divider />
                        <div style={{ textAlign: 'left' }}>
                            <Row gutter={[8, 4]}>
                                <Col span={10}><Text style={{ color: '#444746', fontSize: 13 }}>Ngân hàng</Text></Col>
                                <Col span={14}><Text strong>MBBank</Text></Col>
                                <Col span={10}><Text style={{ color: '#444746', fontSize: 13 }}>Số TK</Text></Col>
                                <Col span={14}><Text strong>0123456789</Text></Col>
                                <Col span={10}><Text style={{ color: '#444746', fontSize: 13 }}>Chủ TK</Text></Col>
                                <Col span={14}><Text strong>TRUONG THPT DEMO</Text></Col>
                                <Col span={10}><Text style={{ color: '#444746', fontSize: 13 }}>Số tiền</Text></Col>
                                <Col span={14}><Text strong style={{ color: '#B3261E' }}>{formatVND(qrModal.invoice.totalAmount - qrModal.invoice.paidAmount)}</Text></Col>
                                <Col span={10}><Text style={{ color: '#444746', fontSize: 13 }}>Nội dung CK</Text></Col>
                                <Col span={14}><Text strong style={{ color: '#0B57D0' }}>HP {qrModal.invoice.studentCode}</Text></Col>
                            </Row>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
