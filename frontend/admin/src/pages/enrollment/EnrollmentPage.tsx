import { useState, useEffect } from 'react';
import {
    Table, Card, Row, Col, Button, Select, Tag, Typography, Statistic,
    Space, Modal, Form, Input, message, Tabs, Badge,
} from 'antd';
import { enrollmentApi } from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const COLORS = {
    bg: '#F8FAFD',
    surface: '#FFFFFF',
    primary: '#0B57D0',
    textPrimary: '#191C1E',
    textSecondary: '#444746',
    border: '#E0E3E1',
    successBg: '#E6F4EA',
    successText: '#0D652D',
    warningBg: '#FEF7E0',
    warningText: '#E37400',
    errorBg: '#FCE8E6',
    errorText: '#B3261E',
    infoBg: '#C2E7FF',
    infoText: '#001D35',
};

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    submitted: { bg: COLORS.infoBg, color: COLORS.infoText, label: 'Mới nộp' },
    reviewing: { bg: COLORS.warningBg, color: COLORS.warningText, label: 'Đang xem xét' },
    accepted: { bg: COLORS.successBg, color: COLORS.successText, label: 'Chấp nhận' },
    rejected: { bg: COLORS.errorBg, color: COLORS.errorText, label: 'Từ chối' },
    enrolled: { bg: '#E8F0FE', color: '#174EA6', label: 'Đã nhập học' },
    new: { bg: COLORS.infoBg, color: COLORS.infoText, label: 'Mới' },
    contacted: { bg: COLORS.warningBg, color: COLORS.warningText, label: 'Đã liên hệ' },
    interested: { bg: '#F3E8FD', color: '#6E1BBE', label: 'Quan tâm' },
    lost: { bg: '#F1F3F4', color: '#444746', label: 'Mất liên lạc' },
};

const demoApps = [
    { id: '1', studentName: 'Nguyễn Văn A', gradeLevelApplying: 10, status: 'submitted', parentName: 'Trần Thị B', phone: '0909123456' },
    { id: '2', studentName: 'Lê Thị C', gradeLevelApplying: 11, status: 'reviewing', parentName: 'Lê Văn D', phone: '0909987654' },
];
const demoLeads = [
    { id: '1', parentName: 'Phạm Văn X', phone: '0912345678', source: 'facebook', status: 'new', studentName: 'Phạm Y' },
];

export default function EnrollmentPage() {
    const [applications, setApplications] = useState<any[]>(demoApps);
    const [leads, setLeads] = useState<any[]>(demoLeads);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ totalApps: 0, pendingApps: 0, totalLeads: 0, newLeads: 0 });
    const [activeTab, setActiveTab] = useState('applications');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [appsRes, leadsRes, statsRes] = await Promise.all([
                enrollmentApi.getApplications(),
                enrollmentApi.getLeads(),
                enrollmentApi.getApplicationStats()
            ]);
            setApplications(appsRes.data.data || demoApps);
            setLeads(leadsRes.data.data || demoLeads);

            setStats({
                totalApps: appsRes.data.data?.length || 0,
                pendingApps: appsRes.data.data?.filter((a: any) => a.status === 'submitted').length || 0,
                totalLeads: leadsRes.data.data?.length || 0,
                newLeads: leadsRes.data.data?.filter((l: any) => l.status === 'new').length || 0,
            });
        } catch (error) {
            console.log('Using demo data');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, type: 'app' | 'lead', newStatus: string) => {
        try {
            if (type === 'app') {
                await enrollmentApi.updateApplicationStatus(id, newStatus);
                message.success('Đã cập nhật trạng thái hồ sơ');
            } else {
                await enrollmentApi.updateLead(id, { status: newStatus });
                message.success('Đã cập nhật trạng thái Lead');
            }
            fetchData();
        } catch {

            if (type === 'app') {
                setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
            } else {
                setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
            }
            message.success('Đã cập nhật (Demo mode)');
        }
    };

    const appColumns = [
        {
            title: 'Học sinh', dataIndex: 'studentName', key: 'studentName',
            render: (text: string, record: any) => (
                <div>
                    <Text strong style={{ color: COLORS.textPrimary }}>{text}</Text>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>Lớp {record.gradeLevelApplying}</div>
                </div>
            )
        },
        {
            title: 'Phụ huynh', dataIndex: 'parentName', key: 'parentName',
            render: (text: string, record: any) => (
                <div>
                    <div>{text}</div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{record.phone}</div>
                </div>
            )
        },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status',
            render: (status: string) => {
                const config = statusConfig[status] || statusConfig.new;
                return (
                    <Tag style={{
                        background: config.bg,
                        color: config.color,
                        border: 'none',
                        borderRadius: 8,
                        padding: '2px 8px',
                        fontWeight: 500
                    }}>
                        {config.label}
                    </Tag>
                );
            }
        },
        {
            title: '', key: 'action',
            render: (_: any, record: any) => (
                <Select
                    defaultValue={record.status}
                    onChange={(val) => handleStatusChange(record.id, 'app', val)}
                    style={{ width: 140 }}
                    bordered={false}
                    size="small"
                >
                    <Option value="submitted">Mới nộp</Option>
                    <Option value="reviewing">Đang xem</Option>
                    <Option value="accepted">Chấp nhận</Option>
                    <Option value="rejected">Từ chối</Option>
                    <Option value="enrolled">Nhập học</Option>
                </Select>
            )
        }
    ];

    const leadColumns = [
        {
            title: 'Phụ huynh', dataIndex: 'parentName', key: 'parentName',
            render: (text: string, record: any) => (
                <div>
                    <Text strong style={{ color: COLORS.textPrimary }}>{text}</Text>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{record.phone}</div>
                </div>
            )
        },
        {
            title: 'Quan tâm cho', dataIndex: 'studentName', key: 'studentName',
            render: (text: string) => text || <Text type="secondary">Chưa biết</Text>
        },
        {
            title: 'Nguồn', dataIndex: 'source', key: 'source',
            render: (source: string) => (
                <Text style={{ textTransform: 'capitalize', color: COLORS.textSecondary }}>{source}</Text>
            )
        },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status',
            render: (status: string) => {
                const config = statusConfig[status] || statusConfig.new;
                return (
                    <Tag style={{
                        background: config.bg,
                        color: config.color,
                        border: 'none',
                        borderRadius: 8,
                        padding: '2px 8px',
                        fontWeight: 500
                    }}>
                        {config.label}
                    </Tag>
                );
            }
        },
        {
            title: '', key: 'action',
            render: (_: any, record: any) => (
                <Select
                    defaultValue={record.status}
                    onChange={(val) => handleStatusChange(record.id, 'lead', val)}
                    style={{ width: 140 }}
                    bordered={false}
                    size="small"
                >
                    <Option value="new">Mới</Option>
                    <Option value="contacted">Đã liên hệ</Option>
                    <Option value="interested">Quan tâm</Option>
                    <Option value="lost">Mất khách</Option>
                </Select>
            )
        }
    ];

    return (
        <div style={{ fontFamily: "'Google Sans', sans-serif" }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0, color: COLORS.textPrimary, fontWeight: 500 }}>
                    Tuyển sinh & CRM - ReilferEDUV
                </Title>
                <Text style={{ color: COLORS.textSecondary }}>Quản lý hồ sơ và khách hàng tiềm năng</Text>
            </div>

            {}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card bordered={false} style={{ background: COLORS.infoBg, borderRadius: 16, height: '100%' }}>
                        <Statistic
                            title={<Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 500 }}>Tổng hồ sơ</Text>}
                            value={stats.totalApps}
                            valueStyle={{ color: COLORS.textPrimary, fontSize: 24, fontWeight: 500 }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} style={{ background: COLORS.warningBg, borderRadius: 16, height: '100%' }}>
                        <Statistic
                            title={<Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 500 }}>Chờ duyệt</Text>}
                            value={stats.pendingApps}
                            valueStyle={{ color: COLORS.textPrimary, fontSize: 24, fontWeight: 500 }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, height: '100%' }}>
                        <Statistic
                            title={<Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 500 }}>CRM Leads</Text>}
                            value={stats.totalLeads}
                            valueStyle={{ color: COLORS.textPrimary, fontSize: 24, fontWeight: 500 }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, height: '100%' }}>
                        <Statistic
                            title={<Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 500 }}>Leads Mới</Text>}
                            value={stats.newLeads}
                            valueStyle={{ color: COLORS.infoText, fontSize: 24, fontWeight: 500 }}
                        />
                    </Card>
                </Col>
            </Row>

            {}
            <Card
                bordered={false}
                style={{
                    borderRadius: 24,
                    background: COLORS.surface,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                bodyStyle={{ padding: 0 }}
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    tabBarStyle={{ padding: '0 24px', margin: 0, borderBottom: `1px solid ${COLORS.border}` }}
                    items={[
                        {
                            key: 'applications',
                            label: 'Hồ sơ tuyển sinh',
                            children: (
                                <Table
                                    columns={appColumns}
                                    dataSource={applications}
                                    rowKey="id"
                                    pagination={{ pageSize: 8, hideOnSinglePage: true }}
                                    loading={loading}
                                    style={{ padding: '8px 16px' }}
                                />
                            )
                        },
                        {
                            key: 'leads',
                            label: 'CRM Leads',
                            children: (
                                <div>
                                    <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button type="primary" style={{ background: COLORS.primary, borderRadius: 20 }}>
                                            Thêm Lead
                                        </Button>
                                    </div>
                                    <Table
                                        columns={leadColumns}
                                        dataSource={leads}
                                        rowKey="id"
                                        pagination={{ pageSize: 8, hideOnSinglePage: true }}
                                        loading={loading}
                                        style={{ padding: '0 16px 16px' }}
                                    />
                                </div>
                            )
                        }
                    ]}
                />
            </Card>
        </div>
    );
}
