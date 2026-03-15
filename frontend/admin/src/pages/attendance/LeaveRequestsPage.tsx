import React, { useEffect, useState } from 'react';
import { Table, Tabs, Button, Form, Input, DatePicker, Select, message, Space, Tag, Modal } from 'antd';
import { leaveRequestsApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

type LeaveRequest = {
    id: string;
    type: string;
    student?: { id: string; firstName: string; lastName: string; class?: { name: string } };
    user?: { id: string; firstName: string; lastName: string; role: string };
    requestedBy: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
};

export const LeaveRequestsPage: React.FC = () => {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('student');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [form] = Form.useForm();

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await leaveRequestsApi.list(isAdmin ? { type: activeTab } : undefined);
            setRequests(res.data?.data || res.data || []);
        } catch (error) {
            message.error('Lỗi tải danh sách xin nghỉ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [activeTab]);

    const handleCreate = async (values: any) => {
        try {
            await leaveRequestsApi.create({
                type: values.type,
                startDate: values.dates[0].toISOString(),
                endDate: values.dates[1].toISOString(),
                reason: values.reason,
            });
            message.success('Đã gửi đơn xin nghỉ thành công');
            setIsCreateModalOpen(false);
            form.resetFields();
            fetchRequests();
        } catch (err) {
            message.error('Không thể tạo đơn xin nghỉ');
        }
    };

    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await leaveRequestsApi.updateStatus(id, status);
            message.success(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} đơn xin nghỉ`);
            fetchRequests();
        } catch (error) {
            message.error('Lỗi cập nhật trạng thái');
        }
    };

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => <span style={{ fontFamily: 'monospace' }}>{id.substring(0, 8)}</span>,
        },
        {
            title: 'Người xin nghỉ',
            key: 'requestedBy',
            render: (_: any, record: LeaveRequest) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{record.requestedBy}</div>
                    <div style={{ fontSize: '12px', color: '#5f6368' }}>
                        {record.type === 'student' ? 'Học sinh' : 'Cán bộ / Giáo viên'}
                    </div>
                </div>
            ),
        },
        {
            title: 'Thời gian nghỉ',
            key: 'time',
            render: (_: any, record: LeaveRequest) => (
                <span>
                    {dayjs(record.startDate).format('DD/MM/YYYY')} - {dayjs(record.endDate).format('DD/MM/YYYY')}
                </span>
            ),
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = '#5f6368';
                let text = 'Chờ duyệt';
                if (status === 'approved') {
                    color = '#188038';
                    text = 'Đã duyệt';
                } else if (status === 'rejected') {
                    color = '#d93025';
                    text = 'Từ chối';
                }
                return (
                    <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        backgroundColor: `${color}15`,
                        color: color,
                        borderRadius: '4px',
                        fontWeight: 500,
                        fontSize: '13px'
                    }}>
                        {text}
                    </span>
                );
            },
        },
        ...(isAdmin ? [{
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: LeaveRequest) => (
                record.status === 'pending' ? (
                    <Space size="middle">
                        <Button 
                            type="primary" 
                            size="small" 
                            style={{ backgroundColor: '#188038', borderColor: '#188038', boxShadow: 'none', borderRadius: '4px' }}
                            onClick={() => handleUpdateStatus(record.id, 'approved')}
                        >
                            Duyệt
                        </Button>
                        <Button 
                            type="primary" 
                            danger 
                            size="small" 
                            style={{ boxShadow: 'none', borderRadius: '4px' }}
                            onClick={() => handleUpdateStatus(record.id, 'rejected')}
                        >
                            Từ chối
                        </Button>
                    </Space>
                ) : null
            ),
        }] : []),
    ];

    return (
        <div style={{ padding: '24px', backgroundColor: '#fff', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 400, color: '#202124' }}>Quản lý Đơn xin nghỉ</h1>
                    <p style={{ margin: 0, color: '#5f6368', fontSize: '14px', marginTop: '4px' }}>Duyệt hoặc tạo mới đơn xin phép nghỉ học/nghỉ làm</p>
                </div>
                {!isAdmin && (
                    <Button 
                        type="primary" 
                        style={{ backgroundColor: '#1a73e8', boxShadow: 'none', borderRadius: '4px', height: '36px', padding: '0 24px' }}
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        Tạo đơn mới
                    </Button>
                )}
            </div>

            {isAdmin ? (
                <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab}
                    items={[
                        { key: 'student', label: 'Học sinh nghỉ học' },
                        { key: 'staff', label: 'Giáo viên/Nhân viên nghỉ làm' },
                    ]}
                />
            ) : null}

            <Table
                columns={columns}
                dataSource={requests}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 20 }}
                style={{ border: '1px solid #dadce0', borderRadius: '8px', overflow: 'hidden' }}
            />

            <Modal
                title={<span style={{ fontSize: '18px', fontWeight: 500 }}>Tạo đơn xin nghỉ</span>}
                open={isCreateModalOpen}
                onCancel={() => setIsCreateModalOpen(false)}
                footer={null}
                width={500}
                style={{ top: 20 }}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: '20px' }}>
                    <Form.Item name="type" label="Loại đơn" initialValue="student" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="student">Nghỉ học (Học sinh)</Select.Option>
                            <Select.Option value="staff">Nghỉ làm (Giáo viên/Nhân viên)</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="dates" label="Thời gian nghỉ (Từ ngày - Đến ngày)" rules={[{ required: true, message: 'Vui lòng chọn thời gian nghỉ' }]}>
                        <RangePicker style={{ width: '100%', borderRadius: '4px' }} format="DD/MM/YYYY" />
                    </Form.Item>
                    <Form.Item name="reason" label="Lý do xin nghỉ" rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}>
                        <TextArea rows={4} style={{ borderRadius: '4px' }} placeholder="Nhập lý do chi tiết..." />
                    </Form.Item>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                        <Button onClick={() => setIsCreateModalOpen(false)} style={{ borderRadius: '4px', boxShadow: 'none' }}>
                            Hủy bỏ
                        </Button>
                        <Button type="primary" htmlType="submit" style={{ backgroundColor: '#1a73e8', borderRadius: '4px', boxShadow: 'none' }}>
                            Gửi đơn
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};
