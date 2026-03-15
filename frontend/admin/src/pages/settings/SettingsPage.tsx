import { useState } from 'react';
import {
 Tabs, Card, Row, Col, Button, Select, Tag, Typography, Statistic,
 Space, Modal, Form, Input, message, Switch, Divider, List, Avatar,
 Tooltip, Progress, Popconfirm, TimePicker,
} from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

interface SchoolConfig {
 name: string;
 code: string;
 address: string;
 phone: string;
 email: string;
 principal: string;
 type: string;
 academicYear: string;
 maxStudentsPerClass: number;
 periodsPerDay: number;
 startTime: string;
 periodDuration: number;
 breakDuration: number;
}

const initialConfig: SchoolConfig = {
 name: 'Trường THPT Demo ReilferEDUV',
 code: 'THPT-DEMO-01',
 address: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
 phone: '028 1234 5678',
 email: 'contact@demo.eduv.vn',
 principal: 'Nguyễn Văn A',
 type: 'THPT',
 academicYear: '2025-2026',
 maxStudentsPerClass: 45,
 periodsPerDay: 5,
 startTime: '07:00',
 periodDuration: 45,
 breakDuration: 10,
};

interface RolePermission {
 role: string;
 roleName: string;
 permissions: Record<string, boolean>;
}

const permissionList = [
 { key: 'students.view', label: 'Xem học sinh' },
 { key: 'students.edit', label: 'Sửa học sinh' },
 { key: 'grades.view', label: 'Xem điểm' },
 { key: 'grades.edit', label: 'Nhập/sửa điểm' },
 { key: 'attendance.view', label: 'Xem điểm danh' },
 { key: 'attendance.manage', label: 'Quản lý điểm danh' },
 { key: 'finance.view', label: 'Xem tài chính' },
 { key: 'finance.manage', label: 'Quản lý tài chính' },
 { key: 'schedule.view', label: 'Xem TKB' },
 { key: 'schedule.edit', label: 'Sửa TKB' },
 { key: 'reports.view', label: 'Xem báo cáo' },
 { key: 'reports.export', label: 'Xuất báo cáo' },
 { key: 'accounts.manage', label: 'Quản lý tài khoản' },
 { key: 'settings.manage', label: 'Quản lý cài đặt' },
];

const initialPermissions: RolePermission[] = [
 { role: 'SCHOOL_ADMIN', roleName: 'Quản trị viên', permissions: Object.fromEntries(permissionList.map(p => [p.key, true])) },
 { role: 'PRINCIPAL', roleName: 'Hiệu trưởng', permissions: Object.fromEntries(permissionList.map(p => [p.key, true])) },
 {
 role: 'TEACHER', roleName: 'Giáo viên', permissions: {
 'students.view': true, 'students.edit': false, 'grades.view': true, 'grades.edit': true,
 'attendance.view': true, 'attendance.manage': true, 'finance.view': false, 'finance.manage': false,
 'schedule.view': true, 'schedule.edit': false, 'reports.view': true, 'reports.export': false,
 'accounts.manage': false, 'settings.manage': false,
 }
 },
 {
 role: 'ACCOUNTANT', roleName: 'Kế toán', permissions: {
 'students.view': true, 'students.edit': false, 'grades.view': false, 'grades.edit': false,
 'attendance.view': false, 'attendance.manage': false, 'finance.view': true, 'finance.manage': true,
 'schedule.view': false, 'schedule.edit': false, 'reports.view': true, 'reports.export': true,
 'accounts.manage': false, 'settings.manage': false,
 }
 },
 {
 role: 'PARENT', roleName: 'Phụ huynh', permissions: {
 'students.view': true, 'students.edit': false, 'grades.view': true, 'grades.edit': false,
 'attendance.view': true, 'attendance.manage': false, 'finance.view': true, 'finance.manage': false,
 'schedule.view': true, 'schedule.edit': false, 'reports.view': false, 'reports.export': false,
 'accounts.manage': false, 'settings.manage': false,
 }
 },
];

interface BackupRecord {
 id: string;
 date: string;
 size: string;
 type: 'AUTO' | 'MANUAL';
 status: 'SUCCESS' | 'FAILED';
}

const demoBackups: BackupRecord[] = [
 { id: 'b1', date: '2025-10-10 03:00', size: '245 MB', type: 'AUTO', status: 'SUCCESS' },
 { id: 'b2', date: '2025-10-09 03:00', size: '243 MB', type: 'AUTO', status: 'SUCCESS' },
 { id: 'b3', date: '2025-10-08 16:30', size: '242 MB', type: 'MANUAL', status: 'SUCCESS' },
 { id: 'b4', date: '2025-10-08 03:00', size: '241 MB', type: 'AUTO', status: 'FAILED' },
 { id: 'b5', date: '2025-10-07 03:00', size: '240 MB', type: 'AUTO', status: 'SUCCESS' },
];

const roleColors: Record<string, { bg: string; color: string }> = {
 SCHOOL_ADMIN: { bg: '#F9DEDC', color: '#B3261E' },
 PRINCIPAL: { bg: '#EADDFF', color: '#6750A4' },
 TEACHER: { bg: '#E6F4EA', color: '#0D652D' },
 ACCOUNTANT: { bg: '#FEF7E0', color: '#E37400' },
 PARENT: { bg: '#FFF3E0', color: '#E65100' },
};

export default function SettingsPage() {
 const [config, setConfig] = useState<SchoolConfig>(initialConfig);
 const [permissions, setPermissions] = useState<RolePermission[]>(initialPermissions);
 const [backups] = useState<BackupRecord[]>(demoBackups);
 const [editConfig, setEditConfig] = useState(false);
 const [autoBackup, setAutoBackup] = useState(true);
 const [darkMode, setDarkMode] = useState(false);
 const [notifications, setNotifications] = useState({ email: true, sms: false, push: true });
 const [language, setLanguage] = useState('vi');
 const [form] = Form.useForm();

 const saveConfig = () => {
 form.validateFields().then(values => {
 setConfig(prev => ({ ...prev, ...values }));
 message.success('Đã lưu cấu hình trường');
 setEditConfig(false);
 });
 };

 const togglePermission = (roleIndex: number, permKey: string) => {
 setPermissions(prev => prev.map((rp, i) => {
 if (i !== roleIndex) return rp;
 return { ...rp, permissions: { ...rp.permissions, [permKey]: !rp.permissions[permKey] } };
 }));
 message.success('Đã cập nhật quyền');
 };

 const backupNow = () => {
 message.loading({ content: 'Đang sao lưu...', key: 'backup', duration: 2 });
 setTimeout(() => message.success({ content: 'Sao lưu thành công — 246 MB', key: 'backup' }), 2000);
 };

 return (
 <div>
 <Title level={4} style={{ margin: '0 0 20px', fontFamily: "'Google Sans', sans-serif", fontWeight: 500, color: '#191C1E' }}>
 Cài đặt
 </Title>

 <Tabs defaultActiveKey="school" items={[
 {
 key: 'school',
 label: 'Trường học',
 children: (
 <Row gutter={16}>
 <Col xs={24} lg={14}>
 <Card bordered size="small" title="Thông tin trường" extra={
 !editConfig
 ? <Button size="small" onClick={() => { setEditConfig(true); form.setFieldsValue(config); }}>Sửa</Button>
 : <Space><Button size="small" onClick={() => setEditConfig(false)}>Hủy</Button><Button size="small" type="primary" onClick={saveConfig}>Lưu</Button></Space>
 }>
 {!editConfig ? (
 <div>
 {[
 { label: 'Tên trường', value: config.name },
 { label: 'Mã trường', value: config.code },
 { label: 'Địa chỉ', value: config.address },
 { label: 'SĐT', value: config.phone },
 { label: 'Email', value: config.email },
 { label: 'Hiệu trưởng', value: config.principal },
 { label: 'Loại trường', value: config.type },
 { label: 'Năm học', value: config.academicYear },
 ].map((item, i) => (
 <Row key={i} style={{ padding: '8px 0', borderBottom: '1px solid #F1F4F8' }}>
 <Col span={8}><Text style={{ color: '#444746', fontSize: 13 }}>{item.label}</Text></Col>
 <Col span={16}><Text strong style={{ fontSize: 13 }}>{item.value}</Text></Col>
 </Row>
 ))}
 </div>
 ) : (
 <Form form={form} layout="vertical" size="small">
 <Form.Item name="name" label="Tên trường" rules={[{ required: true }]}>
 <Input />
 </Form.Item>
 <Row gutter={12}>
 <Col span={12}><Form.Item name="code" label="Mã trường"><Input /></Form.Item></Col>
 <Col span={12}><Form.Item name="type" label="Loại trường">
 <Select><Option value="TH">Tiểu học</Option><Option value="THCS">THCS</Option><Option value="THPT">THPT</Option></Select>
 </Form.Item></Col>
 </Row>
 <Form.Item name="address" label="Địa chỉ"><Input /></Form.Item>
 <Row gutter={12}>
 <Col span={12}><Form.Item name="phone" label="SĐT"><Input /></Form.Item></Col>
 <Col span={12}><Form.Item name="email" label="Email"><Input /></Form.Item></Col>
 </Row>
 <Row gutter={12}>
 <Col span={12}><Form.Item name="principal" label="Hiệu trưởng"><Input /></Form.Item></Col>
 <Col span={12}><Form.Item name="academicYear" label="Năm học"><Input /></Form.Item></Col>
 </Row>
 </Form>
 )}
 </Card>
 </Col>
 <Col xs={24} lg={10}>
 <Card bordered size="small" title="Cấu hình học tập">
 {[
 { label: 'Sĩ số tối đa/lớp', value: config.maxStudentsPerClass, suffix: 'HS' },
 { label: 'Số tiết/ngày', value: config.periodsPerDay, suffix: 'tiết' },
 { label: 'Giờ bắt đầu', value: config.startTime, suffix: '' },
 { label: 'Thời lượng tiết', value: config.periodDuration, suffix: 'phút' },
 { label: 'Giờ nghỉ giữa tiết', value: config.breakDuration, suffix: 'phút' },
 ].map((item, i) => (
 <Row key={i} style={{ padding: '8px 0', borderBottom: '1px solid #F1F4F8' }} align="middle">
 <Col span={14}><Text style={{ color: '#444746', fontSize: 13 }}>{item.label}</Text></Col>
 <Col span={10}><Text strong style={{ fontSize: 13 }}>{item.value} {item.suffix}</Text></Col>
 </Row>
 ))}
 </Card>

 <Card bordered size="small" title="Thống kê" style={{ marginTop: 16 }}>
 <Row gutter={12}>
 {[
 { label: 'Học sinh', value: 156, bg: '#E8F0FE' },
 { label: 'Giáo viên', value: 24, bg: '#E6F4EA' },
 { label: 'Lớp học', value: 8, bg: '#FEF7E0' },
 ].map((item, i) => (
 <Col span={8} key={i}>
 <div style={{ background: item.bg, borderRadius: 8, padding: 10, textAlign: 'center' }}>
 <div style={{ fontSize: 18, fontWeight: 600, color: '#191C1E' }}>{item.value}</div>
 <div style={{ fontSize: 11, color: '#444746' }}>{item.label}</div>
 </div>
 </Col>
 ))}
 </Row>
 </Card>
 </Col>
 </Row>
 ),
 },
 {
 key: 'permissions',
 label: 'Phân quyền',
 children: (
 <Card bordered size="small">
 <Text style={{ fontSize: 12, color: '#444746', display: 'block', marginBottom: 16 }}>
 Bấm vào toggle để bật/tắt quyền cho từng vai trò. Thay đổi có hiệu lực ngay lập tức.
 </Text>
 <div style={{ overflowX: 'auto' }}>
 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
 <thead>
 <tr>
 <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: '#444746', borderBottom: '2px solid #E0E2E0', minWidth: 140 }}>Quyền</th>
 {permissions.map(rp => (
 <th key={rp.role} style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '2px solid #E0E2E0', minWidth: 90 }}>
 <Tag style={{ background: roleColors[rp.role]?.bg, color: roleColors[rp.role]?.color, border: 'none', fontSize: 11 }}>
 {rp.roleName}
 </Tag>
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {permissionList.map(perm => (
 <tr key={perm.key}>
 <td style={{ padding: '6px 12px', fontSize: 13, borderBottom: '1px solid #F1F4F8' }}>{perm.label}</td>
 {permissions.map((rp, ri) => (
 <td key={rp.role} style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #F1F4F8' }}>
 <Switch size="small" checked={rp.permissions[perm.key]}
 onChange={() => togglePermission(ri, perm.key)}
 disabled={rp.role === 'SCHOOL_ADMIN'} />
 </td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </Card>
 ),
 },
 {
 key: 'backup',
 label: 'Sao lưu',
 children: (
 <Row gutter={16}>
 <Col xs={24} lg={14}>
 <Card bordered size="small" title="Lịch sử sao lưu" extra={<Button type="primary" size="small" onClick={backupNow}>Sao lưu ngay</Button>}>
 <List size="small" bordered={false} dataSource={backups}
 renderItem={item => (
 <List.Item actions={[
 item.status === 'SUCCESS' && <Button size="small" type="text">Khôi phục</Button>,
 ].filter(Boolean)}>
 <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
 <div style={{
 width: 32, height: 32, borderRadius: 8,
 background: item.status === 'SUCCESS' ? '#E6F4EA' : '#F9DEDC',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontSize: 14,
 }}>
 {item.status === 'SUCCESS' ? 'OK' : 'Loi'}
 </div>
 <div>
 <Text style={{ fontSize: 13 }}>{item.date}</Text>
 <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
 <Tag style={{
 background: item.type === 'AUTO' ? '#E8F0FE' : '#FEF7E0',
 color: item.type === 'AUTO' ? '#0B57D0' : '#E37400',
 border: 'none', fontSize: 10,
 }}>
 {item.type === 'AUTO' ? 'Tự động' : 'Thủ công'}
 </Tag>
 <Text style={{ fontSize: 11, color: '#444746' }}>{item.size}</Text>
 </div>
 </div>
 </div>
 </List.Item>
 )} />
 </Card>
 </Col>
 <Col xs={24} lg={10}>
 <Card bordered size="small" title="Cấu hình sao lưu">
 <Row style={{ padding: '8px 0', borderBottom: '1px solid #F1F4F8' }} align="middle" justify="space-between">
 <Text style={{ fontSize: 13 }}>Sao lưu tự động</Text>
 <Switch checked={autoBackup} onChange={setAutoBackup} />
 </Row>
 <Row style={{ padding: '8px 0', borderBottom: '1px solid #F1F4F8' }} align="middle" justify="space-between">
 <Text style={{ fontSize: 13 }}>Tần suất</Text>
 <Select value="daily" size="small" style={{ width: 100 }}>
 <Option value="daily">Hàng ngày</Option>
 <Option value="weekly">Hàng tuần</Option>
 </Select>
 </Row>
 <Row style={{ padding: '8px 0', borderBottom: '1px solid #F1F4F8' }} align="middle" justify="space-between">
 <Text style={{ fontSize: 13 }}>Giờ sao lưu</Text>
 <Text strong style={{ fontSize: 13 }}>03:00</Text>
 </Row>
 <Row style={{ padding: '8px 0' }} align="middle" justify="space-between">
 <Text style={{ fontSize: 13 }}>Giữ tối đa</Text>
 <Select value="30" size="small" style={{ width: 100 }}>
 <Option value="7">7 ngày</Option>
 <Option value="30">30 ngày</Option>
 <Option value="90">90 ngày</Option>
 </Select>
 </Row>
 </Card>

 <Card bordered size="small" title="Dung lượng" style={{ marginTop: 16 }}>
 <div style={{ textAlign: 'center', padding: '8px 0' }}>
 <Progress type="dashboard" percent={24} size={100}
 format={() => <div><div style={{ fontSize: 16, fontWeight: 600 }}>245 MB</div><div style={{ fontSize: 10, color: '#444746' }}>/ 1 GB</div></div>}
 strokeColor="#0B57D0" />
 </div>
 </Card>
 </Col>
 </Row>
 ),
 },
 {
 key: 'preferences',
 label: 'Tùy chọn',
 children: (
 <Row gutter={16}>
 <Col xs={24} lg={12}>
 <Card bordered size="small" title="Giao diện">
 <Row style={{ padding: '10px 0', borderBottom: '1px solid #F1F4F8' }} align="middle" justify="space-between">
 <div>
 <Text style={{ fontSize: 13 }}>Chế độ tối</Text>
 <div style={{ fontSize: 11, color: '#444746' }}>Giao diện dark mode</div>
 </div>
 <Switch checked={darkMode} onChange={v => { setDarkMode(v); message.info(v ? 'Dark mode (cần tích hợp theme)' : 'Light mode'); }} />
 </Row>
 <Row style={{ padding: '10px 0', borderBottom: '1px solid #F1F4F8' }} align="middle" justify="space-between">
 <div>
 <Text style={{ fontSize: 13 }}>Ngôn ngữ</Text>
 <div style={{ fontSize: 11, color: '#444746' }}>Ngôn ngữ hiển thị</div>
 </div>
 <Select value={language} onChange={setLanguage} size="small" style={{ width: 120 }}>
 <Option value="vi">Tiếng Việt</Option>
 <Option value="en">English</Option>
 </Select>
 </Row>
 <Row style={{ padding: '10px 0' }} align="middle" justify="space-between">
 <div>
 <Text style={{ fontSize: 13 }}>Múi giờ</Text>
 <div style={{ fontSize: 11, color: '#444746' }}>Hệ thống dùng UTC+7</div>
 </div>
 <Text strong style={{ fontSize: 13 }}>Asia/Ho_Chi_Minh (UTC+7)</Text>
 </Row>
 </Card>
 </Col>
 <Col xs={24} lg={12}>
 <Card bordered size="small" title="Thông báo">
 {[
 { key: 'email', label: 'Email', desc: 'Nhận thông báo qua email' },
 { key: 'sms', label: 'SMS', desc: 'Gửi SMS cho phụ huynh' },
 { key: 'push', label: 'Push', desc: 'Thông báo đẩy trên app' },
 ].map((item, i) => (
 <Row key={item.key} style={{ padding: '10px 0', borderBottom: i < 2 ? '1px solid #F1F4F8' : 'none' }} align="middle" justify="space-between">
 <div>
 <Text style={{ fontSize: 13 }}>{item.label}</Text>
 <div style={{ fontSize: 11, color: '#444746' }}>{item.desc}</div>
 </div>
 <Switch checked={(notifications as any)[item.key]}
 onChange={v => setNotifications(prev => ({ ...prev, [item.key]: v }))} />
 </Row>
 ))}
 </Card>

 <Card bordered size="small" title="Hệ thống" style={{ marginTop: 16 }}>
 <Row style={{ padding: '6px 0' }}><Col span={10}><Text style={{ color: '#444746', fontSize: 12 }}>Phiên bản</Text></Col><Col span={14}><Text strong style={{ fontSize: 12 }}>ReilferEDUV v2.0.0</Text></Col></Row>
 <Row style={{ padding: '6px 0' }}><Col span={10}><Text style={{ color: '#444746', fontSize: 12 }}>Frontend</Text></Col><Col span={14}><Text style={{ fontSize: 12 }}>React 18 + Ant Design 5</Text></Col></Row>
 <Row style={{ padding: '6px 0' }}><Col span={10}><Text style={{ color: '#444746', fontSize: 12 }}>Backend</Text></Col><Col span={14}><Text style={{ fontSize: 12 }}>NestJS + Prisma + PostgreSQL</Text></Col></Row>
 <Row style={{ padding: '6px 0' }}><Col span={10}><Text style={{ color: '#444746', fontSize: 12 }}>Design</Text></Col><Col span={14}><Text style={{ fontSize: 12 }}>Material Design 3</Text></Col></Row>
 </Card>
 </Col>
 </Row>
 ),
 },
 ]} />
 </div>
 );
}
