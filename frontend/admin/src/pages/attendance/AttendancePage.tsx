import { useState, useEffect, useRef } from 'react';
import {
    Tabs, Table, Card, Row, Col, Button, Select, Tag, Typography, Statistic,
    Space, Modal, message, Badge, Alert, Progress, Tooltip, List, Switch, Divider, Empty,
} from 'antd';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import type { AttendanceRecord } from '../../stores/dataStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const isAdminRole = (role?: string) => ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'admin'].includes(role || '');
const isTeacherRole = (role?: string) => role === 'TEACHER';

async function hmacSign(secret: string, data: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const QR_SECRET = 'ReilferEDUV-2026-SecretKey-QR-Attendance';
const QR_ROTATE_SECONDS = 20;
const SCHOOL_LAT = 10.7626;
const SCHOOL_LNG = 106.6602;
const GEOFENCE_RADIUS_M = 200;

const COLORS = ['#0D652D', '#E37400', '#B3261E', '#0B57D0'];

const demoStudents = [
    { code: 'HS20250001', name: 'Trần Văn An', classId: '1' },
    { code: 'HS20250002', name: 'Lê Thị Bình', classId: '1' },
    { code: 'HS20250003', name: 'Phạm Minh Châu', classId: '1' },
    { code: 'HS20250004', name: 'Hoàng Đức Dũng', classId: '2' },
    { code: 'HS20250005', name: 'Ngô Thùy Em', classId: '2' },
];

function TeacherAttendance() {
    const { attendanceRecords, attendanceSessions, activateSession, deactivateSession, addAttendanceRecord, markStudentScanned, demoLoaded } = useDataStore();
    const [tab, setTab] = useState('sessions');
    const qrTimerRef = useRef<any>(null);
    const [qrModal, setQrModal] = useState<{ open: boolean; classId: string }>({ open: false, classId: '' });

    const [qrData, setQrData] = useState<Record<string, { url: string; payload: string; signature: string; generatedAt: number }>>({});
    const [qrCountdown, setQrCountdown] = useState(QR_ROTATE_SECONDS);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
    }, []);

    useEffect(() => {
        const anyActive = attendanceSessions.some(s => s.active);
        if (!anyActive) {
            clearInterval(qrTimerRef.current);
            return;
        }
        qrTimerRef.current = setInterval(() => {
            setQrCountdown(prev => {
                if (prev <= 1) {
                    attendanceSessions.filter(s => s.active).forEach(s => generateQRForClass(s.classId));
                    return QR_ROTATE_SECONDS;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(qrTimerRef.current);
    }, [attendanceSessions.filter(s => s.active).length]);

    const generateQRForClass = async (classId: string) => {
        const session = attendanceSessions.find(s => s.classId === classId);
        if (!session?.active || !session.sessionId) return;

        const serverTime = Date.now();
        const nonce = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
        const payload = `EDUV2|${session.sessionId}|${session.className}|${serverTime}|${nonce}|${SCHOOL_LAT}|${SCHOOL_LNG}`;
        const signature = await hmacSign(QR_SECRET, payload);
        const sigShort = signature.slice(0, 16);

        const baseUrl = window.location.origin;
        const scanUrl = `${baseUrl}/attendance/scan?s=${encodeURIComponent(session.sessionId)}&p=${encodeURIComponent(payload)}&sig=${sigShort}`;
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(scanUrl)}`;

        setQrData(prev => ({ ...prev, [classId]: { url: qrImageUrl, payload, signature: sigShort, generatedAt: serverTime } }));
        setQrCountdown(QR_ROTATE_SECONDS);
    };

    const toggleSession = (classId: string) => {
        const session = attendanceSessions.find(s => s.classId === classId);
        if (!session?.active) {
            activateSession(classId);
            setTimeout(() => generateQRForClass(classId), 100);
            message.success(`Đã kích hoạt điểm danh QR — ${session?.className}`);
        } else {
            deactivateSession(classId);
            setQrData(prev => { const n = { ...prev }; delete n[classId]; return n; });
            message.info(`Đã tắt điểm danh — ${session.className}`);
        }
    };

    const todayStr = dayjs().format('YYYY-MM-DD');
    const todayRecords = attendanceRecords.filter(r => r.date === todayStr);
    const present = todayRecords.filter(r => r.status === 'PRESENT').length;
    const late = todayRecords.filter(r => r.status === 'LATE').length;
    const absent = todayRecords.filter(r => r.status === 'ABSENT').length;
    const total = present + late + absent;

    const pieData = [
        { name: 'Có mặt', value: present },
        { name: 'Đi trễ', value: late },
        { name: 'Vắng', value: absent },
    ].filter(d => d.value > 0);

    const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = dayjs().subtract(6 - i, 'day');
        const dateStr = d.format('YYYY-MM-DD');
        const dayRecords = attendanceRecords.filter(r => r.date === dateStr);
        return {
            day: d.format('dd'),
            present: dayRecords.filter(r => r.status === 'PRESENT').length,
            late: dayRecords.filter(r => r.status === 'LATE').length,
            absent: dayRecords.filter(r => r.status === 'ABSENT').length,
        };
    });

    const columns = [
        { title: 'MSSV', dataIndex: 'studentCode', width: 120 },
        { title: 'Họ tên', dataIndex: 'studentName', width: 150 },
        { title: 'Lớp', dataIndex: 'className', width: 80 },
        { title: 'Ngày', dataIndex: 'date', width: 110, render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
        { title: 'Giờ', dataIndex: 'time', width: 70 },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 100,
            render: (s: string) => {
                const m: Record<string, { bg: string; color: string; text: string }> = {
                    PRESENT: { bg: '#E6F4EA', color: '#0D652D', text: 'Có mặt' },
                    LATE: { bg: '#FEF7E0', color: '#E37400', text: 'Trễ' },
                    ABSENT: { bg: '#F9DEDC', color: '#B3261E', text: 'Vắng' },
                };
                const t = m[s] || m.PRESENT;
                return <Tag style={{ background: t.bg, color: t.color, border: 'none' }}>{t.text}</Tag>;
            },
        },
        {
            title: 'Phương thức', dataIndex: 'method', width: 100,
            render: (m: string) => <Tag style={{ background: '#E8F0FE', color: '#0B57D0', border: 'none' }}>{m}</Tag>,
        },
    ];

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Title level={4} style={{ margin: 0, fontFamily: "'Google Sans', sans-serif", fontWeight: 500, color: '#191C1E' }}>
                        <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: 8, fontSize: 26 }}>fact_check</span>
                        Điểm danh
                    </Title>
                </Col>
            </Row>

            {}
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                {[
                    { title: 'Có mặt', value: present, icon: 'check_circle', bg: '#E6F4EA', color: '#0D652D' },
                    { title: 'Đi trễ', value: late, icon: 'schedule', bg: '#FEF7E0', color: '#E37400' },
                    { title: 'Vắng', value: absent, icon: 'cancel', bg: '#F9DEDC', color: '#B3261E' },
                    { title: 'Tổng HS', value: total, icon: 'groups', bg: '#E8F0FE', color: '#0B57D0' },
                ].map((item, i) => (
                    <Col xs={12} sm={6} key={i}>
                        <Card bordered={false} style={{ background: item.bg, borderRadius: 14, border: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 22, color: item.color }}>{item.icon}</span>
                                <div>
                                    <div style={{ fontSize: 11, color: '#444746' }}>{item.title}</div>
                                    <div style={{ fontSize: 20, fontWeight: 600, color: item.color, fontFamily: "'Google Sans'" }}>{item.value}</div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Tabs activeKey={tab} onChange={setTab} items={[
                {
                    key: 'sessions',
                    label: <span><span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>qr_code_2</span> Phiên QR</span>,
                    children: (
                        <div>
                            {attendanceSessions.length === 0 ? (
                                <Empty description="Chưa có phiên điểm danh" />
                            ) : (
                                <Row gutter={[12, 12]}>
                                    {attendanceSessions.map(session => {
                                        const scanned = session.scannedStudents.length;
                                        const total = demoStudents.filter(s => s.classId === session.classId).length;
                                        const qr = qrData[session.classId];
                                        return (
                                            <Col xs={24} sm={12} lg={8} key={session.classId}>
                                                <Card bordered style={{ borderRadius: 16, border: session.active ? '2px solid #0D652D' : undefined }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <Text strong style={{ fontSize: 15 }}>{session.className}</Text>
                                                            <Badge status={session.active ? 'success' : 'default'} text={session.active ? 'Đang mở' : 'Đã tắt'} style={{ marginLeft: 8 }} />
                                                        </div>
                                                        <Switch checked={session.active} onChange={() => toggleSession(session.classId)}
                                                            style={{ background: session.active ? '#0D652D' : undefined }} />
                                                    </div>
                                                    {session.active ? (
                                                        <div style={{ marginTop: 12 }}>
                                                            <Progress percent={Math.round((scanned / Math.max(total, 1)) * 100)} size="small" strokeColor="#0D652D" format={() => `${scanned}/${total}`} />
                                                            <div style={{ marginTop: 8 }}>
                                                                <Button block size="small" type="primary" onClick={() => { setQrModal({ open: true, classId: session.classId }); if (!qr) generateQRForClass(session.classId); }}>
                                                                    Hiện QR
                                                                </Button>
                                                            </div>

                                                        </div>
                                                    ) : (
                                                        <div style={{ marginTop: 12, textAlign: 'center', padding: '12px 0' }}>
                                                            <Text style={{ fontSize: 12, color: '#747775' }}>Bấm ON để kích hoạt điểm danh QR</Text>
                                                        </div>
                                                    )}
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            )}
                        </div>
                    ),
                },
                {
                    key: 'records',
                    label: <span><span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>table_chart</span> Bảng điểm danh</span>,
                    children: (
                        <Card bordered={false}>
                            {attendanceRecords.length === 0 ? (
                                <Empty description={'Chưa có dữ liệu điểm danh'} />
                            ) : (
                                <Table dataSource={attendanceRecords} columns={columns} rowKey="id" size="small" pagination={{ pageSize: 15 }} />
                            )}
                        </Card>
                    ),
                },
                {
                    key: 'charts',
                    label: <span><span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>bar_chart</span> Thống kê</span>,
                    children: (
                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={14}>
                                <Card bordered title="Điểm danh 7 ngày gần" size="small">
                                    {attendanceRecords.length === 0 ? <Empty description="Chưa có dữ liệu" /> : (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E0E2E0" />
                                                <XAxis dataKey="day" tick={{ fill: '#444746', fontSize: 12 }} />
                                                <YAxis tick={{ fill: '#444746', fontSize: 12 }} />
                                                <RTooltip />
                                                <Bar dataKey="present" name="Có mặt" fill="#0D652D" radius={[3, 3, 0, 0]} stackId="a" />
                                                <Bar dataKey="late" name="Trễ" fill="#E37400" radius={[3, 3, 0, 0]} stackId="a" />
                                                <Bar dataKey="absent" name="Vắng" fill="#B3261E" radius={[3, 3, 0, 0]} stackId="a" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </Card>
                            </Col>
                            <Col xs={24} lg={10}>
                                <Card bordered title="Hôm nay" size="small">
                                    {total === 0 ? <Empty description="Chưa có dữ liệu hôm nay" /> : (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value"
                                                    label={({ name, value }) => `${name}: ${value}`}>
                                                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                                </Pie>
                                                <RTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </Card>
                            </Col>
                        </Row>
                    ),
                },
            ]} />

            {}
            <Modal title="Mã QR điểm danh" open={qrModal.open}
                onCancel={() => setQrModal({ open: false, classId: '' })}
                footer={null} width={420}>
                {(() => {
                    const session = attendanceSessions.find(s => s.classId === qrModal.classId);
                    const qr = qrData[qrModal.classId];
                    if (!session?.active) return <Alert type="warning" message="Phiên chưa được kích hoạt." />;
                    return (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ background: '#FFF', borderRadius: 16, padding: 20, display: 'inline-block', border: '2px solid #C4EED0' }}>
                                {qr?.url ? <img src={qr.url} alt="QR" style={{ width: 240, height: 240 }} /> :
                                    <div style={{ width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#747775' }}>Đang tạo QR...</div>}
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <Progress type="circle" size={48} percent={(qrCountdown / QR_ROTATE_SECONDS) * 100}
                                    format={() => `${qrCountdown}s`} strokeColor={qrCountdown > 7 ? '#0D652D' : '#B3261E'} />
                                <div style={{ fontSize: 12, color: '#444746', marginTop: 8 }}>
                                    Mã QR xoay mỗi {QR_ROTATE_SECONDS}s — HS quét bằng camera điện thoại
                                </div>
                            </div>
                            <Divider />
                            <Text style={{ fontSize: 11, color: '#70757A' }}>
                                Đã quét: {session.scannedStudents.length}/{demoStudents.filter(s => s.classId === session.classId).length} HS
                            </Text>
                        </div>
                    );
                })()}
            </Modal>

        </div>
    );
}

function StudentAttendance() {
    const { user } = useAuthStore();
    const { attendanceRecords, attendanceSessions } = useDataStore();

    const studentCode = user?.studentCode || `HS${user?.id?.slice(-8) || '00000001'}`;
    const myRecords = attendanceRecords.filter(r => r.studentCode === studentCode || r.studentName === `${user?.firstName || ''} ${user?.lastName || ''}`.trim());

    const presentDays = myRecords.filter(r => r.status === 'PRESENT').length;
    const lateDays = myRecords.filter(r => r.status === 'LATE').length;
    const absentDays = myRecords.filter(r => r.status === 'ABSENT').length;
    const total = presentDays + lateDays + absentDays;
    const attendRate = total > 0 ? Math.round(((presentDays + lateDays) / total) * 100) : 0;

    const activeSession = attendanceSessions.find(s => s.active);
    const alreadyScanned = activeSession ? activeSession.scannedStudents.includes(studentCode) : false;
    const todayStr = dayjs().format('YYYY-MM-DD');
    const todayRecord = myRecords.find(r => r.date === todayStr);

    const statusTag = (status: string) => {
        const m: Record<string, { bg: string; color: string; text: string }> = {
            PRESENT: { bg: '#E6F4EA', color: '#0D652D', text: 'Có mặt' },
            LATE: { bg: '#FEF7E0', color: '#E37400', text: 'Trễ' },
            ABSENT: { bg: '#F9DEDC', color: '#B3261E', text: 'Vắng' },
        };
        const s = m[status] || { bg: '#E8F0FE', color: '#0B57D0', text: 'Chờ điểm danh' };
        return <Tag style={{ background: s.bg, color: s.color, border: 'none' }}>{s.text}</Tag>;
    };

    return (
        <div>
            <Title level={4} style={{ marginBottom: 4, fontFamily: "'Google Sans', sans-serif", fontWeight: 500, color: '#191C1E' }}>
                <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: 8, fontSize: 26 }}>fact_check</span>
                Điểm danh
            </Title>
            <Text style={{ color: '#70757A', fontSize: 13 }}>
                {user?.firstName} {user?.lastName} — Lớp 10A1 — {dayjs().format('dddd, DD/MM/YYYY')}
            </Text>

            <Divider />

            {}
            <Card bordered={false} style={{
                background: todayRecord ? '#E6F4EA' : activeSession ? '#FEF7E0' : '#F8FAFD',
                borderRadius: 20, textAlign: 'center', marginBottom: 20,
                border: todayRecord ? '2px solid #0D652D' : activeSession ? '2px solid #E37400' : '1px solid #E0E2E0',
            }}>
                {todayRecord ? (

                    <div style={{ padding: '24px 0' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#0D652D' }}>check_circle</span>
                        <div style={{ marginTop: 8 }}>
                            <Text strong style={{ fontSize: 18, color: '#0D652D', display: 'block' }}>Đã điểm danh hôm nay!</Text>
                            <Text style={{ fontSize: 14, color: '#444746', display: 'block', marginTop: 4 }}>
                                {todayRecord.time} — {todayRecord.method} — {statusTag(todayRecord.status)}
                            </Text>
                        </div>
                    </div>
                ) : activeSession ? (

                    <div style={{ padding: '24px 0' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#E37400' }}>qr_code_scanner</span>
                        <div style={{ marginTop: 8 }}>
                            <Text strong style={{ fontSize: 16, color: '#E37400', display: 'block' }}>Điểm danh đang mở!</Text>
                            <Text style={{ fontSize: 13, color: '#444746', display: 'block', marginTop: 8 }}>
                                Quét mã QR trên bảng bằng camera điện thoại để điểm danh
                            </Text>
                            <div style={{ marginTop: 16, padding: '12px 20px', background: 'rgba(255,255,255,0.7)', borderRadius: 12, display: 'inline-block' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: 'middle', marginRight: 6, color: '#0B57D0' }}>phone_android</span>
                                <Text style={{ fontSize: 13, color: '#191C1E' }}>Mở Camera → Hướng vào QR → Bấm link → Xong!</Text>
                            </div>
                        </div>
                    </div>
                ) : (

                    <div style={{ padding: '28px 0' }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: 20, margin: '0 auto 16',
                            background: '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#0B57D0' }}>qr_code</span>
                        </div>
                        <Text style={{ fontSize: 15, display: 'block', color: '#444746' }}>
                            Chờ giáo viên bật điểm danh...
                        </Text>
                        <Text style={{ fontSize: 12, display: 'block', color: '#70757A', marginTop: 4 }}>
                            QR sẽ hiện trên bảng khi giáo viên kích hoạt phiên điểm danh
                        </Text>
                    </div>
                )}
            </Card>

            {}
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                {[
                    { title: 'Có mặt', value: presentDays, icon: 'check_circle', bg: '#E6F4EA', color: '#0D652D' },
                    { title: 'Đi trễ', value: lateDays, icon: 'schedule', bg: '#FEF7E0', color: '#E37400' },
                    { title: 'Vắng', value: absentDays, icon: 'cancel', bg: '#F9DEDC', color: '#B3261E' },
                    { title: 'Tỉ lệ', value: `${attendRate}%`, icon: 'percent', bg: '#E8F0FE', color: '#0B57D0' },
                ].map((item, i) => (
                    <Col xs={12} sm={6} key={i}>
                        <Card bordered={false} style={{ background: item.bg, borderRadius: 14, border: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 22, color: item.color }}>{item.icon}</span>
                                <div>
                                    <div style={{ fontSize: 11, color: '#444746' }}>{item.title}</div>
                                    <div style={{ fontSize: 20, fontWeight: 600, color: item.color, fontFamily: "'Google Sans'" }}>{item.value}</div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {}
            <Title level={5} style={{ fontFamily: "'Google Sans'", fontWeight: 500, marginBottom: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: 'middle', marginRight: 6 }}>history</span>
                Lịch sử điểm danh
            </Title>

            <Card bordered style={{ borderRadius: 12 }}>
                {myRecords.length === 0 ? (
                    <Empty description="Chưa có lịch sử điểm danh" />
                ) : (
                    <Table
                        dataSource={myRecords}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        columns={[
                            { title: 'Ngày', dataIndex: 'date', width: 110, render: (d: string) => <Text strong>{dayjs(d).format('DD/MM/YYYY')}</Text> },
                            { title: 'Giờ', dataIndex: 'time', width: 70, render: (t: string) => t || '—' },
                            { title: 'Trạng thái', dataIndex: 'status', width: 120, render: (s: string) => statusTag(s) },
                            {
                                title: 'Phương thức', dataIndex: 'method', width: 90,
                                render: (m: string) => m === 'QR'
                                    ? <Tag style={{ background: '#E8F0FE', color: '#0B57D0', border: 'none' }}>QR</Tag>
                                    : m === 'MANUAL'
                                        ? <Tag style={{ background: '#F1F4F8', color: '#444746', border: 'none' }}>Thủ công</Tag>
                                        : <Text style={{ color: '#70757A' }}>—</Text>,
                            },
                        ]}
                    />
                )}
            </Card>
        </div>
    );
}

export default function AttendancePage() {
    const { user } = useAuthStore();
    const role = user?.role;

    if (isAdminRole(role) || isTeacherRole(role)) {
        return <TeacherAttendance />;
    }
    return <StudentAttendance />;
}
