import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Tag, Divider, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { studentApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const isAdmin = (role?: string) => ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'admin'].includes(role || '');
const isTeacher = (role?: string) => role === 'TEACHER';

const typeColors: Record<string, { bg: string; color: string }> = {
    school: { bg: '#E8F0FE', color: '#0B57D0' },
    assignment: { bg: '#F3E8FD', color: '#7B1FA2' },
    grade: { bg: '#E6F4EA', color: '#0D652D' },
    finance: { bg: '#FEEFC3', color: '#7B5800' },
    attendance: { bg: '#FEF7E0', color: '#E37400' },
};

function StudentDashboard() {
    const { user } = useAuthStore();
    const { assignments, notifications, grades, attendanceRecords } = useDataStore();

    const pendingAssignments = assignments.filter(a => a.status === 'published').length;
    const myGrades = grades.filter(g => g.studentCode === 'HS20250001');
    const avgGrade = myGrades.length > 0
        ? (myGrades.reduce((sum, g) => sum + (g.average || 0), 0) / myGrades.filter(g => g.average != null).length).toFixed(2)
        : '—';

    return (
        <div>
            <Title level={4} style={{ marginBottom: 4, fontFamily: "'Google Sans', sans-serif", fontWeight: 500, color: '#191C1E' }}>
                Xin chào, {user?.firstName} {user?.lastName}!
            </Title>
            <Text style={{ color: '#70757A', fontSize: 14 }}>
                {dayjs().format('dddd, DD/MM/YYYY')} — Lớp 10A1
            </Text>

            <Divider />

            {}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {[
                    { title: 'Bài tập chờ làm', value: pendingAssignments, icon: 'assignment', bg: '#F3E8FD', color: '#7B1FA2' },
                    { title: 'Thông báo mới', value: notifications.length, icon: 'notifications', bg: '#E8F0FE', color: '#0B57D0' },
                    { title: 'Điểm TB hiện tại', value: avgGrade, icon: 'trending_up', bg: '#E6F4EA', color: '#0D652D' },
                    { title: 'Buổi điểm danh', value: attendanceRecords.filter(r => r.studentCode === 'HS20250001').length, icon: 'event_available', bg: '#FEEFC3', color: '#7B5800' },
                ].map((item, i) => (
                    <Col xs={24} sm={12} lg={6} key={i}>
                        <Card bordered={false} style={{ background: item.bg, border: 'none', borderRadius: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 12,
                                    background: 'rgba(255,255,255,0.6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <span className="material-symbols-outlined" style={{ color: item.color, fontSize: 22 }}>{item.icon}</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: '#444746', fontWeight: 500 }}>{item.title}</div>
                                    <div style={{ fontSize: 22, fontWeight: 600, color: item.color, fontFamily: "'Google Sans'" }}>{item.value}</div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {}
            <Title level={5} style={{ fontFamily: "'Google Sans'", fontWeight: 500, marginBottom: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: 'middle', marginRight: 6 }}>notifications</span>
                Thông báo gần đây
            </Title>

            {notifications.length === 0 ? (
                <Card bordered={false} style={{ background: '#F8FAFD', borderRadius: 16, textAlign: 'center', padding: '32px 0' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#C4C7C5' }}>notifications_none</span>
                    <div style={{ color: '#70757A', marginTop: 8 }}>Chưa có thông báo</div>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {notifications.map(n => {
                        const tc = typeColors[n.type] || typeColors.school;
                        return (
                            <Card key={n.id} bordered={false} style={{ background: '#F8FAFD', borderRadius: 16 }} hoverable>
                                <Row align="top" gutter={16}>
                                    <Col flex="none">
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 12,
                                            background: tc.bg,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <span className="material-symbols-outlined" style={{ color: tc.color, fontSize: 22 }}>{n.icon}</span>
                                        </div>
                                    </Col>
                                    <Col flex="auto">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Text strong style={{ fontSize: 14 }}>{n.title}</Text>
                                            <Text style={{ fontSize: 11, color: '#70757A', whiteSpace: 'nowrap', marginLeft: 8 }}>
                                                {dayjs(n.date).format('DD/MM')}
                                            </Text>
                                        </div>
                                        <Paragraph style={{ color: '#444746', fontSize: 13, margin: '4px 0 0', lineHeight: 1.5 }} ellipsis={{ rows: 2 }}>
                                            {n.content}
                                        </Paragraph>
                                    </Col>
                                </Row>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { attendanceRecords, grades, assignments, demoLoaded } = useDataStore();

    useEffect(() => {
        studentApi.getStats()
            .then(res => setStats(res.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>;
    }

    const todayStr = dayjs().format('YYYY-MM-DD');
    const todayAttendance = attendanceRecords.filter(r => r.date === todayStr);
    const todayPresent = todayAttendance.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const todayTotal = todayAttendance.length;
    const attendPercent = todayTotal > 0 ? ((todayPresent / todayTotal) * 100).toFixed(1) : '—';

    const attendanceChartData = Array.from({ length: 5 }, (_, i) => {
        const d = dayjs().subtract(4 - i, 'day');
        const dateStr = d.format('YYYY-MM-DD');
        const dayRecords = attendanceRecords.filter(r => r.date === dateStr);
        return {
            day: d.format('dd'),
            present: dayRecords.filter(r => r.status === 'PRESENT').length,
            absent: dayRecords.filter(r => r.status === 'ABSENT').length,
        };
    });

    const allAvgs = grades.filter(g => g.average != null).map(g => g.average!);
    const gradeDistribution = allAvgs.length > 0 ? [
        { name: 'Giỏi', value: allAvgs.filter(a => a >= 8).length, color: '#0B57D0' },
        { name: 'Khá', value: allAvgs.filter(a => a >= 6.5 && a < 8).length, color: '#0D652D' },
        { name: 'TB', value: allAvgs.filter(a => a >= 5 && a < 6.5).length, color: '#E37400' },
        { name: 'Yếu', value: allAvgs.filter(a => a >= 3.5 && a < 5).length, color: '#C5221F' },
        { name: 'Kém', value: allAvgs.filter(a => a < 3.5).length, color: '#A8000A' },
    ].filter(d => d.value > 0) : [];

    const hasData = demoLoaded || attendanceRecords.length > 0 || grades.length > 0;

    return (
        <div>
            <Title level={4} style={{ marginBottom: 20, fontFamily: "'Google Sans', sans-serif", fontWeight: 500, color: '#191C1E' }}>
                Dashboard
            </Title>

            {}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {[
                    { title: 'Tổng học sinh', value: stats?.total || (demoLoaded ? 30 : 0), suffix: '', bg: '#E8F0FE' },
                    { title: 'Lớp học', value: stats?.classCount || (demoLoaded ? 9 : 0), suffix: '', bg: '#E6F4EA' },
                    { title: 'Điểm danh hôm nay', value: attendPercent, suffix: todayTotal > 0 ? '%' : '', bg: '#FEF7E0' },
                    { title: 'Bài tập', value: assignments.length, suffix: '', bg: '#F3E8FD' },
                ].map((item, i) => (
                    <Col xs={24} sm={12} lg={6} key={i}>
                        <Card bordered={false} style={{ background: item.bg, border: 'none' }}>
                            <Statistic
                                title={<Text style={{ fontSize: 12, color: '#444746' }}>{item.title}</Text>}
                                value={item.value}
                                suffix={item.suffix}
                                valueStyle={{ color: '#191C1E', fontWeight: 500, fontFamily: "'Google Sans', sans-serif" }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            {!hasData ? (
                <Card bordered={false} style={{ background: '#F8FAFD', borderRadius: 16, textAlign: 'center', padding: '48px 0' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#C4C7C5' }}>bar_chart</span>
                    <div style={{ color: '#70757A', marginTop: 12, fontSize: 15 }}>Đang tải dữ liệu...</div>
                    <div style={{ color: '#C4C7C5', fontSize: 12, marginTop: 4 }}>Biểu đồ sẽ hiển thị khi có dữ liệu điểm danh và điểm số</div>
                </Card>
            ) : (

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={14}>
                        <Card title="Điểm danh tuần này" bordered>
                            {attendanceRecords.length === 0 ? <Empty description="Chưa có dữ liệu" /> : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={attendanceChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E0E2E0" />
                                        <XAxis dataKey="day" tick={{ fill: '#444746', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#444746', fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="present" name="Có mặt" fill="#0D652D" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="absent" name="Vắng" fill="#C5221F" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Card>
                    </Col>

                    <Col xs={24} lg={10}>
                        <Card title="Phân loại học lực" bordered>
                            {gradeDistribution.length === 0 ? <Empty description="Chưa có điểm" /> : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={gradeDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}
                                        >
                                            {gradeDistribution.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </Card>
                    </Col>
                </Row>
            )}
        </div>
    );
}

export default function DashboardPage() {
    const { user } = useAuthStore();
    const role = user?.role;

    if (isAdmin(role) || isTeacher(role)) {
        return <AdminDashboard />;
    }
    return <StudentDashboard />;
}
