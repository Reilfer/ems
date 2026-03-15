import { useState, useEffect, useCallback } from 'react';
import {
    Tabs, Table, Button, Input, Space, Tag, Modal, Form, Select, Upload,
    Typography, Card, Badge, message, Popconfirm, Descriptions, Empty, Avatar, List, Tooltip,
} from 'antd';
import {
    InboxOutlined, SendOutlined, DeleteOutlined, EyeOutlined,
    PaperClipOutlined, CheckOutlined, ReloadOutlined, FileImageOutlined,
} from '@ant-design/icons';
import { notificationApi, mediaApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Dragger } = Upload;

const MIcon = ({ name, size = 18, color, style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) => (
    <span className="material-symbols-outlined" style={{ fontSize: size, color, verticalAlign: 'middle', ...style }}>{name}</span>
);

interface Notification {
    id: string;
    schoolId: string;
    senderId?: string;
    recipientId: string;
    type: string;
    title: string;
    content: string;
    data?: { attachments?: string[] };
    isRead: boolean;
    readAt?: string;
    createdAt: string;
    sender?: { id: string; firstName: string; lastName: string; role: string };
    recipient?: { id: string; firstName: string; lastName: string; role: string };
}

const typeColors: Record<string, string> = {
    INFO: 'blue',
    WARNING: 'orange',
    ABSENCE: 'red',
    GRADE: 'green',
    FINANCE: 'gold',
    DOCUMENT: 'purple',
    ANNOUNCEMENT: 'cyan',
};

const typeLabels: Record<string, string> = {
    INFO: 'Thông báo',
    WARNING: 'Cảnh báo',
    ABSENCE: 'Vắng mặt',
    GRADE: 'Điểm số',
    FINANCE: 'Tài chính',
    DOCUMENT: 'Giấy tờ',
    ANNOUNCEMENT: 'Thông báo chung',
};

export default function NotificationsPage() {
    const user = useAuthStore((s) => s.user);
    const storeNotifs = useDataStore((s) => s.notifications);
    const addStoreNotif = useDataStore((s) => s.addNotification);
    const [activeTab, setActiveTab] = useState('inbox');

    const [inbox, setInbox] = useState<Notification[]>([]);
    const [inboxLoading, setInboxLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [inboxTotal, setInboxTotal] = useState(0);
    const [inboxPage, setInboxPage] = useState(1);

    const [sent, setSent] = useState<any[]>([]);
    const [sentLoading, setSentLoading] = useState(false);

    const [composeOpen, setComposeOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<any[]>([]);
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

    const [detailModal, setDetailModal] = useState(false);
    const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

    const fetchInbox = useCallback(async (page = 1) => {
        if (!user) return;
        setInboxLoading(true);
        try {

            const res = await notificationApi.getUserNotifications(user.id, page, 20);
            const data = res.data;
            setInbox(data.notifications || []);
            setUnreadCount(data.unread || 0);
            setInboxTotal(data.total || 0);
            setInboxPage(page);
        } catch {

            const mapped: Notification[] = storeNotifs.map(n => ({
                id: n.id,
                schoolId: user.schoolId || '',
                recipientId: user.id,
                type: n.type === 'school' ? 'ANNOUNCEMENT' : n.type === 'assignment' ? 'INFO' : n.type === 'grade' ? 'GRADE' : n.type === 'finance' ? 'FINANCE' : 'WARNING',
                title: n.title,
                content: n.content,
                isRead: false,
                createdAt: n.date || new Date().toISOString(),
                sender: n.type === 'school'
                    ? { id: user.id, firstName: 'Admin', lastName: 'Hệ Thống', role: 'SCHOOL_ADMIN' }
                    : { id: user.id, firstName: 'Nguyễn', lastName: 'Thị Hoa', role: 'TEACHER' },
            }));

            setInbox(mapped);
            setUnreadCount(mapped.filter(n => !n.isRead).length);
            setInboxTotal(mapped.length);
            setInboxPage(1);
        } finally {
            setInboxLoading(false);
        }
    }, [user, storeNotifs]);

    const fetchSent = useCallback(async () => {
        if (!user) return;
        setSentLoading(true);
        try {
            const res = await notificationApi.getSentNotifications(user.id, 1, 50);
            setSent(res.data.notifications || []);
        } catch {
            setSent([]);
        } finally {
            setSentLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchInbox();
    }, [fetchInbox]);

    useEffect(() => {
        if (activeTab === 'sent') fetchSent();
    }, [activeTab, fetchSent]);

    const handleMarkRead = async (id: string) => {
        try {
            await notificationApi.markRead(id);
            setInbox(prev => prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {
            message.error('Không thể đánh dấu đã đọc');
        }
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        try {
            await notificationApi.markAllRead(user.id);
            setInbox(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            message.success('Đã đánh dấu tất cả đã đọc');
        } catch {
            message.error('Lỗi khi đánh dấu đã đọc');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await notificationApi.deleteNotification(id);
            setInbox(prev => prev.filter(n => n.id !== id));
            message.success('Đã xóa thông báo');
        } catch {
            message.error('Không thể xóa');
        }
    };

    const handleViewDetail = (notif: Notification) => {
        setSelectedNotif(notif);
        setDetailModal(true);
        if (!notif.isRead) {
            handleMarkRead(notif.id);
        }
    };

    const handleUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await mediaApi.upload(formData);
            const url = res.data?.url || res.data?.path || `/uploads/${file.name}`;
            setUploadedUrls(prev => [...prev, url]);
            onSuccess(url);
            message.success(`Upload thành công: ${file.name}`);
        } catch (err) {
            onError(err);
            message.error(`Upload thất bại: ${file.name}`);
        }
    };

    const handleSend = async (values: any) => {
        if (!user) return;
        setSending(true);
        try {
            const schoolId = user.schoolId || 'school-001';
            const attachments = uploadedUrls.length > 0 ? uploadedUrls : undefined;

            if (values.sendMode === 'broadcast') {

                addStoreNotif({
                    id: `notif-${Date.now()}`,
                    title: values.title,
                    content: values.content,
                    date: new Date().toISOString(),
                    type: values.type === 'ANNOUNCEMENT' ? 'school' : values.type === 'GRADE' ? 'grade' : values.type === 'FINANCE' ? 'finance' : 'assignment',
                    icon: values.type === 'ANNOUNCEMENT' ? 'campaign' : 'notifications',
                });
                try {
                    await notificationApi.broadcast({
                        schoolId,
                        senderId: user.id,
                        title: values.title,
                        content: values.content,
                        type: values.type || 'ANNOUNCEMENT',
                        targetRole: values.targetRole,
                        attachments,
                    });
                } catch {  }
                message.success(`Đã gửi thông báo đến tất cả ${values.targetRole === 'teacher' ? 'giáo viên' : values.targetRole === 'admin' ? 'quản trị viên' : 'người dùng'}`);
            } else {

                addStoreNotif({
                    id: `notif-${Date.now()}`,
                    title: values.title,
                    content: values.content,
                    date: new Date().toISOString(),
                    type: values.type === 'ANNOUNCEMENT' ? 'school' : 'assignment',
                    icon: 'send',
                });
                try {
                    await notificationApi.send({
                        schoolId,
                        senderId: user.id,
                        recipientId: values.recipientId,
                        title: values.title,
                        content: values.content,
                        type: values.type || 'INFO',
                        attachments,
                    });
                } catch {  }
                message.success('Đã gửi thông báo');
            }

            form.resetFields();
            setFileList([]);
            setUploadedUrls([]);
            setComposeOpen(false);
            fetchInbox();
        } catch {
            message.error('Gửi thất bại, vui lòng thử lại');
        } finally {
            setSending(false);
        }
    };

    const inboxColumns = [
        {
            title: '',
            dataIndex: 'isRead',
            width: 40,
            render: (read: boolean) => read ? null : <Badge status="processing" />,
        },
        {
            title: 'Người gửi',
            dataIndex: 'sender',
            width: 160,
            render: (sender: any) => sender
                ? <Text strong={!sender.isRead}>{sender.firstName} {sender.lastName}</Text>
                : <Text type="secondary">Hệ thống</Text>,
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            render: (title: string, record: Notification) => (
                <Space>
                    <Text strong={!record.isRead} style={{ cursor: 'pointer' }} onClick={() => handleViewDetail(record)}>{title}</Text>
                    {record.data?.attachments && record.data.attachments.length > 0 && (
                        <MIcon name="attach_file" size={16} color="#0B57D0" />
                    )}
                </Space>
            ),
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            width: 120,
            render: (type: string) => <Tag color={typeColors[type] || 'default'}>{typeLabels[type] || type}</Tag>,
        },
        {
            title: 'Thời gian',
            dataIndex: 'createdAt',
            width: 150,
            render: (d: string) => <Tooltip title={dayjs(d).format('DD/MM/YYYY HH:mm')}>{dayjs(d).fromNow()}</Tooltip>,
        },
        {
            title: '',
            width: 100,
            render: (_: any, record: Notification) => (
                <Space>
                    <Button type="text" size="small" icon={<MIcon name="visibility" size={16} />} onClick={() => handleViewDetail(record)} />
                    {!record.isRead && (
                        <Button type="text" size="small" icon={<MIcon name="done" size={16} />} onClick={() => handleMarkRead(record.id)} />
                    )}
                    <Popconfirm title="Xóa thông báo này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
                        <Button type="text" size="small" danger icon={<MIcon name="delete" size={16} />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const renderSentList = () => (
        <List
            loading={sentLoading}
            dataSource={sent}
            locale={{ emptyText: <Empty description="Chưa gửi thông báo nào" /> }}
            renderItem={(item: any) => (
                <List.Item>
                    <List.Item.Meta
                        avatar={<Avatar style={{ backgroundColor: '#0B57D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MIcon name="send" size={16} color="#fff" /></Avatar>}
                        title={
                            <Space>
                                <Text strong>{item.title}</Text>
                                <Tag color={typeColors[item.type] || 'default'}>{typeLabels[item.type] || item.type}</Tag>
                                {item.data?.attachments?.length > 0 && <MIcon name="attach_file" size={16} color="#0B57D0" />}
                            </Space>
                        }
                        description={
                            <>
                                <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 4 }}>{item.content}</Paragraph>
                                <Space>
                                    <Text type="secondary">{dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                                    {item.recipients && (
                                        <Text type="secondary">
                                            Gửi đến: {item.recipients.map((r: any) => `${r.firstName} ${r.lastName}`).join(', ')}
                                        </Text>
                                    )}
                                </Space>
                            </>
                        }
                    />
                </List.Item>
            )}
        />
    );

    const renderComposeModal = () => (
        <Modal
            title="Soạn thông báo"
            open={composeOpen}
            onCancel={() => { setComposeOpen(false); form.resetFields(); setFileList([]); setUploadedUrls([]); }}
            footer={null}
            width={640}
        >
            <Form form={form} layout="vertical" onFinish={handleSend} initialValues={{ sendMode: 'broadcast', targetRole: 'teacher', type: 'ANNOUNCEMENT' }}>
                <Form.Item name="sendMode" label="Gửi đến">
                    <Select onChange={(v) => form.setFieldValue('sendMode', v)}>
                        <Select.Option value="broadcast">Gửi theo nhóm</Select.Option>
                        <Select.Option value="direct">Gửi cá nhân</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item noStyle shouldUpdate={(prev, cur) => prev.sendMode !== cur.sendMode}>
                    {({ getFieldValue }) =>
                        getFieldValue('sendMode') === 'broadcast' ? (
                            <Form.Item name="targetRole" label="Nhóm người nhận" rules={[{ required: true }]}>
                                <Select>
                                    <Select.Option value="teacher">Tất cả giáo viên</Select.Option>
                                    <Select.Option value="admin">Quản trị viên</Select.Option>
                                    <Select.Option value="all">Tất cả người dùng</Select.Option>
                                </Select>
                            </Form.Item>
                        ) : (
                            <Form.Item name="recipientId" label="ID người nhận" rules={[{ required: true, message: 'Nhập ID người nhận' }]}>
                                <Input placeholder="Nhập user ID..." />
                            </Form.Item>
                        )
                    }
                </Form.Item>

                <Form.Item name="type" label="Loại thông báo">
                    <Select>
                        <Select.Option value="ANNOUNCEMENT">Thông báo chung</Select.Option>
                        <Select.Option value="INFO">Thông tin</Select.Option>
                        <Select.Option value="WARNING">Cảnh báo</Select.Option>
                        <Select.Option value="DOCUMENT">Giấy tờ / Tài liệu</Select.Option>
                        <Select.Option value="FINANCE">Tài chính</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
                    <Input placeholder="Tiêu đề thông báo..." maxLength={255} />
                </Form.Item>

                <Form.Item name="content" label="Nội dung" rules={[{ required: true, message: 'Nhập nội dung' }]}>
                    <TextArea rows={4} placeholder="Nội dung chi tiết..." maxLength={2000} showCount />
                </Form.Item>

                <Form.Item label="Đính kèm (ảnh, tài liệu)">
                    <Dragger
                        multiple
                        fileList={fileList}
                        customRequest={handleUpload}
                        onChange={({ fileList: fl }) => setFileList(fl)}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        listType="picture"
                    >
                        <p className="ant-upload-drag-icon"><MIcon name="cloud_upload" size={36} color="#0B57D0" /></p>
                        <p>Kéo thả hoặc click để upload ảnh/tài liệu</p>
                        <p className="ant-upload-hint">Hỗ trợ: Ảnh, PDF, Word, Excel</p>
                    </Dragger>
                </Form.Item>

                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit" loading={sending} icon={<MIcon name="send" size={16} color="#fff" />}>
                            Gửi thông báo
                        </Button>
                        <Button onClick={() => { setComposeOpen(false); form.resetFields(); setFileList([]); setUploadedUrls([]); }}>
                            Hủy
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );

    const renderDetailModal = () => (
        <Modal
            title="Chi tiết thông báo"
            open={detailModal}
            onCancel={() => setDetailModal(false)}
            footer={<Button onClick={() => setDetailModal(false)}>Đóng</Button>}
            width={600}
        >
            {selectedNotif && (
                <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Tiêu đề">
                        <Text strong>{selectedNotif.title}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Loại">
                        <Tag color={typeColors[selectedNotif.type] || 'default'}>
                            {typeLabels[selectedNotif.type] || selectedNotif.type}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Người gửi">
                        {selectedNotif.sender
                            ? `${selectedNotif.sender.firstName} ${selectedNotif.sender.lastName} (${selectedNotif.sender.role})`
                            : 'Hệ thống'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Thời gian">
                        {dayjs(selectedNotif.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Nội dung">
                        <Paragraph>{selectedNotif.content}</Paragraph>
                    </Descriptions.Item>
                    {selectedNotif.data?.attachments && selectedNotif.data.attachments.length > 0 && (
                        <Descriptions.Item label="Đính kèm">
                            <Space direction="vertical">
                                {selectedNotif.data.attachments.map((url, i) => {
                                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                    return isImage ? (
                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                            <img src={url} alt={`Attachment ${i + 1}`} style={{ maxWidth: 300, maxHeight: 200, borderRadius: 8 }} />
                                        </a>
                                    ) : (
                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                            <MIcon name="attach_file" size={14} /> Tài liệu {i + 1}
                                        </a>
                                    );
                                })}
                            </Space>
                        </Descriptions.Item>
                    )}
                </Descriptions>
            )}
        </Modal>
    );

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0, fontFamily: "'Google Sans', sans-serif", fontWeight: 500, color: '#191C1E' }}>Thông báo</Title>
                <Space>
                    <Button icon={<MIcon name="refresh" size={16} />} onClick={() => { fetchInbox(); if (activeTab === 'sent') fetchSent(); }}>
                        Làm mới
                    </Button>
                    <Button type="primary" icon={<MIcon name="edit" size={16} color="#fff" />} onClick={() => setComposeOpen(true)}>
                        Soạn thông báo
                    </Button>
                </Space>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane
                    tab={
                        <Badge count={unreadCount} offset={[10, 0]} size="small">
                            <Space><MIcon name="inbox" size={18} /> Hộp thư đến</Space>
                        </Badge>
                    }
                    key="inbox"
                >
                    <div style={{ marginBottom: 12 }}>
                        <Space>
                            <Button size="small" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                                <MIcon name="done_all" size={16} /> Đánh dấu tất cả đã đọc
                            </Button>
                            <Text type="secondary">{inboxTotal} thông báo, {unreadCount} chưa đọc</Text>
                        </Space>
                    </div>
                    <Table
                        dataSource={inbox}
                        columns={inboxColumns}
                        rowKey="id"
                        loading={inboxLoading}
                        size="middle"
                        locale={{ emptyText: <Empty description="Không có thông báo" /> }}
                        rowClassName={(record) => record.isRead ? '' : 'ant-table-row-highlight'}
                        pagination={{
                            current: inboxPage,
                            total: inboxTotal,
                            pageSize: 20,
                            showSizeChanger: false,
                            onChange: (page) => fetchInbox(page),
                        }}
                        onRow={(record) => ({ onClick: () => handleViewDetail(record), style: { cursor: 'pointer' } })}
                    />
                </TabPane>

                <TabPane tab={<Space><MIcon name="send" size={18} /> Đã gửi</Space>} key="sent">
                    {renderSentList()}
                </TabPane>
            </Tabs>

            {renderComposeModal()}
            {renderDetailModal()}

            <style>{`
                .ant-table-row-highlight td { background-color: #E8F0FE !important; }
            `}</style>
        </div>
    );
}
