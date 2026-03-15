import { useState } from 'react';
import {
    Tabs, Table, Card, Row, Col, Button, Select, Tag, Typography, Statistic,
    Space, message, Divider,
} from 'antd';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    LineChart, Line, AreaChart, Area,
} from 'recharts';

const { Title, Text } = Typography;
const { Option } = Select;

const academicData = [
    { class: '10A1', excellent: 8, good: 12, average: 7, weak: 1, avg: 7.2 },
    { class: '10A2', excellent: 5, good: 10, average: 9, weak: 3, avg: 6.5 },
    { class: '11A1', excellent: 10, good: 15, average: 5, weak: 0, avg: 7.8 },
    { class: '11A2', excellent: 6, good: 11, average: 8, weak: 2, avg: 6.9 },
    { class: '12A1', excellent: 12, good: 10, average: 4, weak: 1, avg: 7.5 },
];

const subjectAvgData = [
    { subject: 'Toán', avg: 7.1 },
    { subject: 'Văn', avg: 6.8 },
    { subject: 'Anh', avg: 7.5 },
    { subject: 'Lý', avg: 6.3 },
    { subject: 'Hóa', avg: 6.9 },
    { subject: 'Sinh', avg: 7.0 },
    { subject: 'Sử', avg: 7.2 },
    { subject: 'Địa', avg: 7.4 },
];

const attendanceMonthly = [
    { month: 'T1', present: 95, late: 3, absent: 2 },
    { month: 'T2', present: 93, late: 4, absent: 3 },
    { month: 'T3', present: 94, late: 3, absent: 3 },
    { month: 'T4', present: 96, late: 2, absent: 2 },
    { month: 'T5', present: 92, late: 5, absent: 3 },
    { month: 'T6', present: 90, late: 4, absent: 6 },
    { month: 'T7', present: 0, late: 0, absent: 0 },
    { month: 'T8', present: 0, late: 0, absent: 0 },
    { month: 'T9', present: 97, late: 2, absent: 1 },
    { month: 'T10', present: 94, late: 3, absent: 3 },
];

const topAbsent = [
    { code: 'HS20250003', name: 'Phạm Minh Châu', class: '10A1', absences: 8 },
    { code: 'HS20250004', name: 'Hoàng Đức Dũng', class: '10A2', absences: 5 },
    { code: 'HS20250001', name: 'Trần Văn An', class: '10A1', absences: 3 },
    { code: 'HS20250005', name: 'Ngô Thùy Em', class: '10A2', absences: 2 },
];

const financeMonthly = [
    { month: 'T1', revenue: 120000000, debt: 15000000 },
    { month: 'T2', revenue: 85000000, debt: 20000000 },
    { month: 'T3', revenue: 100000000, debt: 12000000 },
    { month: 'T4', revenue: 95000000, debt: 18000000 },
    { month: 'T5', revenue: 110000000, debt: 10000000 },
    { month: 'T9', revenue: 250000000, debt: 45000000 },
    { month: 'T10', revenue: 180000000, debt: 30000000 },
];

const feeBreakdown = [
    { name: 'Học phí', value: 65, color: '#0B57D0' },
    { name: 'Ăn trưa', value: 15, color: '#0D652D' },
    { name: 'Xe đưa đón', value: 10, color: '#E37400' },
    { name: 'BHYT', value: 5, color: '#6750A4' },
    { name: 'Khác', value: 5, color: '#444746' },
];

function formatVND(n: number) {
    if (n >= 1000000) return (n / 1000000).toFixed(0) + 'tr';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
    return n.toString();
}

function exportCSV(data: any[], filename: string) {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => row[h]).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`Đã xuất ${filename}`);
}

function exportHTML(title: string, content: string) {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:'Segoe UI',sans-serif;padding:40px;max-width:800px;margin:0 auto}
h1{color:#0B57D0;font-size:20px}table{width:100%;border-collapse:collapse;margin:16px 0}
th,td{border:1px solid #E0E2E0;padding:8px 12px;text-align:left;font-size:13px}
th{background:#E8F0FE;font-weight:500}.footer{margin-top:30px;font-size:11px;color:#747775}
@media print{body{padding:20px}}</style></head>
<body><h1>${title}</h1><p style="color:#444746;font-size:13px">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</p>
${content}<div class="footer">ReilferEDUV — Hệ thống Quản lý Giáo dục</div></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`Đã xuất báo cáo "${title}" (mở file để in PDF)`);
}

export default function ReportsPage() {
    const [semester, setSemester] = useState('HK1');

    const exportAcademic = () => {
        const rows = academicData.map(d =>
            `<tr><td>${d.class}</td><td>${d.excellent}</td><td>${d.good}</td><td>${d.average}</td><td>${d.weak}</td><td><b>${d.avg}</b></td></tr>`
        ).join('');
        exportHTML(`Báo cáo Kết quả Học tập — ${semester}`, `
            <table><tr><th>Lớp</th><th>Giỏi</th><th>Khá</th><th>TB</th><th>Yếu</th><th>ĐTB</th></tr>${rows}</table>
            <h2>Điểm TB theo môn</h2>
            <table><tr><th>Môn</th><th>ĐTB</th></tr>
            ${subjectAvgData.map(s => `<tr><td>${s.subject}</td><td>${s.avg}</td></tr>`).join('')}</table>
        `);
    };

    const exportAttendance = () => {
        const rows = topAbsent.map(s =>
            `<tr><td>${s.code}</td><td>${s.name}</td><td>${s.class}</td><td style="color:#B3261E"><b>${s.absences}</b></td></tr>`
        ).join('');
        exportHTML('Báo cáo Điểm danh Tổng hợp', `
            <h2>Tỷ lệ điểm danh theo tháng (%)</h2>
            <table><tr><th>Tháng</th><th>Có mặt</th><th>Trễ</th><th>Vắng</th></tr>
            ${attendanceMonthly.filter(m => m.present > 0).map(m =>
            `<tr><td>${m.month}</td><td>${m.present}%</td><td>${m.late}%</td><td>${m.absent}%</td></tr>`
        ).join('')}</table>
            <h2>HS vắng nhiều nhất</h2>
            <table><tr><th>Mã HS</th><th>Họ tên</th><th>Lớp</th><th>Số buổi vắng</th></tr>${rows}</table>
        `);
    };

    const exportFinance = () => {
        exportHTML('Báo cáo Tài chính', `
            <h2>Doanh thu & Công nợ theo tháng</h2>
            <table><tr><th>Tháng</th><th>Doanh thu</th><th>Nợ</th></tr>
            ${financeMonthly.map(m =>
            `<tr><td>${m.month}</td><td>${(m.revenue / 1000000).toFixed(0)} triệu</td><td>${(m.debt / 1000000).toFixed(0)} triệu</td></tr>`
        ).join('')}</table>
            <p><b>Tổng doanh thu:</b> ${(financeMonthly.reduce((s, m) => s + m.revenue, 0) / 1000000).toFixed(0)} triệu VNĐ</p>
            <p><b>Tổng nợ:</b> ${(financeMonthly.reduce((s, m) => s + m.debt, 0) / 1000000).toFixed(0)} triệu VNĐ</p>
        `);
    };

    const exportExcel = () => {
        exportCSV(academicData, `hoc_tap_${semester}.csv`);
    };

    const totalStudents = academicData.reduce((s, d) => s + d.excellent + d.good + d.average + d.weak, 0);
    const totalExcellent = academicData.reduce((s, d) => s + d.excellent, 0);
    const avgAll = (academicData.reduce((s, d) => s + d.avg, 0) / academicData.length).toFixed(2);
    const totalRevenue = financeMonthly.reduce((s, m) => s + m.revenue, 0);

    const classifyPie = [
        { name: 'Giỏi', value: totalExcellent, color: '#0D652D' },
        { name: 'Khá', value: academicData.reduce((s, d) => s + d.good, 0), color: '#0B57D0' },
        { name: 'TB', value: academicData.reduce((s, d) => s + d.average, 0), color: '#E37400' },
        { name: 'Yếu', value: academicData.reduce((s, d) => s + d.weak, 0), color: '#B3261E' },
    ];

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                <Col>
                    <Title level={4} style={{ margin: 0, fontFamily: "'Google Sans', sans-serif", fontWeight: 500, color: '#191C1E' }}>
                        Báo cáo
                    </Title>
                </Col>
                <Col>
                    <Space>
                        <Select value={semester} onChange={setSemester} style={{ width: 100 }}>
                            <Option value="HK1">HK1</Option>
                            <Option value="HK2">HK2</Option>
                        </Select>
                    </Space>
                </Col>
            </Row>

            {}
            <Row gutter={16} style={{ marginBottom: 16 }}>
                {[
                    { title: 'Tổng học sinh', value: totalStudents, bg: '#E8F0FE' },
                    { title: 'ĐTB toàn trường', value: avgAll, bg: '#E6F4EA' },
                    { title: 'HS giỏi', value: `${totalExcellent} (${((totalExcellent / totalStudents) * 100).toFixed(0)}%)`, bg: '#FEF7E0' },
                    { title: 'Doanh thu', value: formatVND(totalRevenue) + '₫', bg: '#EADDFF' },
                ].map((item, i) => (
                    <Col span={6} key={i}>
                        <Card size="small" bordered={false} style={{ background: item.bg, border: 'none' }}>
                            <Statistic title={<span style={{ fontSize: 12, color: '#444746' }}>{item.title}</span>}
                                value={item.value} valueStyle={{ fontFamily: "'Google Sans', sans-serif", fontWeight: 500, fontSize: 18 }} />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Tabs defaultActiveKey="academic" items={[
                {
                    key: 'academic',
                    label: 'Học tập',
                    children: (
                        <>
                            <Row justify="end" style={{ marginBottom: 12 }}>
                                <Space>
                                    <Button onClick={exportAcademic}>Xuất PDF</Button>
                                    <Button onClick={exportExcel}>Xuất Excel</Button>
                                </Space>
                            </Row>
                            <Row gutter={16}>
                                <Col xs={24} lg={14}>
                                    <Card title="Kết quả học tập theo lớp" bordered size="small">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={academicData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E0E2E0" />
                                                <XAxis dataKey="class" tick={{ fill: '#444746', fontSize: 12 }} />
                                                <YAxis tick={{ fill: '#444746', fontSize: 12 }} />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="excellent" name="Giỏi" fill="#0D652D" stackId="a" />
                                                <Bar dataKey="good" name="Khá" fill="#0B57D0" stackId="a" />
                                                <Bar dataKey="average" name="TB" fill="#E37400" stackId="a" />
                                                <Bar dataKey="weak" name="Yếu" fill="#B3261E" stackId="a" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </Col>
                                <Col xs={24} lg={10}>
                                    <Card title="Phân loại toàn trường" bordered size="small">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <PieChart>
                                                <Pie data={classifyPie} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value"
                                                    label={({ name, value }) => `${name}: ${value}`}>
                                                    {classifyPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </Col>
                            </Row>
                            <Card title="ĐTB theo môn học" bordered size="small" style={{ marginTop: 16 }}>
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={subjectAvgData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E0E2E0" />
                                        <XAxis type="number" domain={[0, 10]} tick={{ fill: '#444746', fontSize: 12 }} />
                                        <YAxis type="category" dataKey="subject" tick={{ fill: '#444746', fontSize: 12 }} width={50} />
                                        <Tooltip />
                                        <Bar dataKey="avg" name="ĐTB" radius={[0, 4, 4, 0]}>
                                            {subjectAvgData.map((d, i) => (
                                                <Cell key={i} fill={d.avg >= 7 ? '#0D652D' : d.avg >= 5 ? '#E37400' : '#B3261E'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                        </>
                    ),
                },
                {
                    key: 'attendance',
                    label: 'Điểm danh',
                    children: (
                        <>
                            <Row justify="end" style={{ marginBottom: 12 }}>
                                <Button onClick={exportAttendance}>Xuất PDF</Button>
                            </Row>
                            <Row gutter={16}>
                                <Col xs={24} lg={14}>
                                    <Card title="Tỷ lệ điểm danh theo tháng (%)" bordered size="small">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <AreaChart data={attendanceMonthly.filter(m => m.present > 0)}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E0E2E0" />
                                                <XAxis dataKey="month" tick={{ fill: '#444746', fontSize: 12 }} />
                                                <YAxis domain={[80, 100]} tick={{ fill: '#444746', fontSize: 12 }} />
                                                <Tooltip />
                                                <Legend />
                                                <Area type="monotone" dataKey="present" name="Có mặt" fill="#E6F4EA" stroke="#0D652D" />
                                                <Area type="monotone" dataKey="late" name="Trễ" fill="#FEF7E0" stroke="#E37400" />
                                                <Area type="monotone" dataKey="absent" name="Vắng" fill="#F9DEDC" stroke="#B3261E" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </Col>
                                <Col xs={24} lg={10}>
                                    <Card title="HS vắng nhiều nhất" bordered size="small">
                                        <Table size="small" bordered={false} pagination={false}
                                            dataSource={topAbsent} rowKey="code"
                                            columns={[
                                                { title: 'Mã HS', dataIndex: 'code', width: 110, render: (t: string) => <Text strong style={{ color: '#0B57D0' }}>{t}</Text> },
                                                { title: 'Họ tên', dataIndex: 'name', width: 130 },
                                                { title: 'Lớp', dataIndex: 'class', width: 70 },
                                                { title: 'Vắng', dataIndex: 'absences', width: 60, render: (n: number) => <Tag style={{ background: '#F9DEDC', color: '#B3261E', border: 'none' }}>{n}</Tag> },
                                            ]} />
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    ),
                },
                {
                    key: 'finance',
                    label: 'Tài chính',
                    children: (
                        <>
                            <Row justify="end" style={{ marginBottom: 12 }}>
                                <Button onClick={exportFinance}>Xuất PDF</Button>
                            </Row>
                            <Row gutter={16}>
                                <Col xs={24} lg={14}>
                                    <Card title="Doanh thu & Công nợ" bordered size="small">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={financeMonthly}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E0E2E0" />
                                                <XAxis dataKey="month" tick={{ fill: '#444746', fontSize: 12 }} />
                                                <YAxis tick={{ fill: '#444746', fontSize: 12 }} tickFormatter={v => formatVND(v)} />
                                                <Tooltip formatter={(v: any) => formatVND(v) + '₫'} />
                                                <Legend />
                                                <Bar dataKey="revenue" name="Doanh thu" fill="#0D652D" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="debt" name="Nợ" fill="#B3261E" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </Col>
                                <Col xs={24} lg={10}>
                                    <Card title="Cơ cấu khoản thu" bordered size="small">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <PieChart>
                                                <Pie data={feeBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value"
                                                    label={({ name, value }) => `${name}: ${value}%`}>
                                                    {feeBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                </Pie>
                                                <Tooltip formatter={(v: any) => `${v}%`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    ),
                },
            ]} />
        </div>
    );
}
