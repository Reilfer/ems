import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Select, Typography, Segmented, Row, Col, DatePicker, message } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

type AccountType = 'PARENT' | 'STUDENT' | 'TEACHER';

export const pendingRegistrations: any[] = [];

export default function RegisterPage() {
    const [accountType, setAccountType] = useState<AccountType>('PARENT');
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const handleRegister = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            await new Promise(r => setTimeout(r, 800));

            pendingRegistrations.push({
                id: `reg-${Date.now()}`,
                accountType,
                ...values,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
            });

            message.success('Đăng ký thành công! Tài khoản của bạn sẽ được duyệt bởi quản trị viên.');
            form.resetFields();
            setLoading(false);

            setTimeout(() => navigate('/login'), 1500);
        } catch {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F8FAFD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
        }}>
            <Card bordered style={{
                width: 520,
                borderRadius: 24,
                border: '1px solid #C4C7C5',
                boxShadow: 'none',
            }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={4} style={{
                        fontFamily: "'Google Sans', sans-serif",
                        fontWeight: 500,
                        color: '#191C1E',
                        margin: 0,
                    }}>
                        Đăng ký tài khoản
                    </Title>
                    <Text style={{ color: '#444746', fontSize: 13 }}>
                        Chọn loại tài khoản và điền thông tin
                    </Text>
                </div>

                {}
                <Segmented
                    block
                    value={accountType}
                    onChange={(v) => { setAccountType(v as AccountType); form.resetFields(); }}
                    options={[
                        { label: 'Phụ huynh', value: 'PARENT' },
                        { label: 'Học sinh', value: 'STUDENT' },
                        { label: 'Giáo viên', value: 'TEACHER' },
                    ]}
                    style={{ marginBottom: 24 }}
                />

                <Form form={form} layout="vertical" size="large">
                    {}
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="firstName" label="Họ và tên đệm" rules={[{ required: true, message: 'Nhập họ' }]}>
                                <Input placeholder="Nguyễn Văn" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="lastName" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}>
                                <Input placeholder="A" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}>
                        <Input placeholder="email@example.com" />
                    </Form.Item>

                    <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập SĐT' }]}>
                        <Input placeholder="0901234567" />
                    </Form.Item>

                    <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6, message: 'Tối thiểu 6 ký tự' }]}>
                        <Input.Password placeholder="Tối thiểu 6 ký tự" />
                    </Form.Item>

                    {}
                    {accountType === 'PARENT' && (
                        <>
                            <Form.Item name="childName" label="Họ tên con" rules={[{ required: true, message: 'Nhập tên con' }]}>
                                <Input placeholder="Nguyễn Văn B" />
                            </Form.Item>
                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item name="childClass" label="Lớp">
                                        <Select placeholder="Chọn lớp">
                                            <Option value="10A1">10A1</Option>
                                            <Option value="10A2">10A2</Option>
                                            <Option value="11A1">11A1</Option>
                                            <Option value="11A2">11A2</Option>
                                            <Option value="12A1">12A1</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="childCode" label="Mã học sinh">
                                        <Input placeholder="HS20250001" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item name="relationship" label="Quan hệ với học sinh" rules={[{ required: true }]}>
                                <Select placeholder="Chọn">
                                    <Option value="father">Cha</Option>
                                    <Option value="mother">Mẹ</Option>
                                    <Option value="guardian">Người giám hộ</Option>
                                </Select>
                            </Form.Item>
                        </>
                    )}

                    {}
                    {accountType === 'STUDENT' && (
                        <>
                            <Form.Item name="studentCode" label="Mã học sinh" rules={[{ required: true, message: 'Nhập mã HS' }]}>
                                <Input placeholder="HS20250001" />
                            </Form.Item>
                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item name="class" label="Lớp" rules={[{ required: true }]}>
                                        <Select placeholder="Chọn lớp">
                                            <Option value="10A1">10A1</Option>
                                            <Option value="10A2">10A2</Option>
                                            <Option value="11A1">11A1</Option>
                                            <Option value="11A2">11A2</Option>
                                            <Option value="12A1">12A1</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="gender" label="Giới tính">
                                        <Select placeholder="Chọn">
                                            <Option value="male">Nam</Option>
                                            <Option value="female">Nữ</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item name="parentPhone" label="SĐT phụ huynh">
                                <Input placeholder="0901234567" />
                            </Form.Item>
                        </>
                    )}

                    {}
                    {accountType === 'TEACHER' && (
                        <>
                            <Form.Item name="employeeCode" label="Mã nhân viên (nếu có)">
                                <Input placeholder="GV001" />
                            </Form.Item>
                            <Form.Item name="subject" label="Bộ môn giảng dạy" rules={[{ required: true }]}>
                                <Select placeholder="Chọn bộ môn">
                                    <Option value="math">Toán</Option>
                                    <Option value="literature">Ngữ văn</Option>
                                    <Option value="english">Tiếng Anh</Option>
                                    <Option value="physics">Vật lý</Option>
                                    <Option value="chemistry">Hóa học</Option>
                                    <Option value="biology">Sinh học</Option>
                                    <Option value="history">Lịch sử</Option>
                                    <Option value="geography">Địa lý</Option>
                                    <Option value="pe">Thể dục</Option>
                                    <Option value="it">Tin học</Option>
                                    <Option value="other">Khác</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="qualification" label="Trình độ">
                                <Select placeholder="Chọn trình độ">
                                    <Option value="bachelor">Cử nhân</Option>
                                    <Option value="master">Thạc sĩ</Option>
                                    <Option value="phd">Tiến sĩ</Option>
                                </Select>
                            </Form.Item>
                        </>
                    )}

                    <Form.Item style={{ marginBottom: 8, marginTop: 8 }}>
                        <Button type="primary" block onClick={handleRegister} loading={loading}
                            style={{ height: 44, borderRadius: 50, fontWeight: 500 }}>
                            Đăng ký
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <Text style={{ color: '#444746', fontSize: 13 }}>
                        Đã có tài khoản?{' '}
                        <a onClick={() => navigate('/login')} style={{ color: '#0B57D0', fontWeight: 500, cursor: 'pointer' }}>
                            Đăng nhập
                        </a>
                    </Text>
                </div>

                <div style={{ background: '#E8F0FE', borderRadius: 12, padding: 12, marginTop: 16 }}>
                    <Text style={{ fontSize: 12, color: '#0B57D0' }}>
                        Sau khi đăng ký, tài khoản cần được quản trị viên duyệt trước khi có thể sử dụng.
                    </Text>
                </div>
            </Card>
        </div>
    );
}
