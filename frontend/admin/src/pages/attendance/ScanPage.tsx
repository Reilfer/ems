import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Typography, Card, Spin, Result, Button, Select, message } from 'antd';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';

const { Text } = Typography;
const { Option } = Select;

async function hmacVerify(secret: string, data: string, expectedSig: string): Promise<boolean> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex.startsWith(expectedSig);
}

const QR_SECRET = 'ReilferEDUV-2026-SecretKey-QR-Attendance';
const MAX_TIME_DRIFT_MS = 10 * 60 * 1000; 

const DEMO_STUDENTS = [
    { code: 'HS20250001', name: 'Trần Văn An' },
    { code: 'HS20250002', name: 'Lê Thị Bình' },
    { code: 'HS20250003', name: 'Phạm Minh Châu' },
    { code: 'HS20250004', name: 'Hoàng Đức Dũng' },
    { code: 'HS20250005', name: 'Ngô Thùy Em' },
];

type Status = 'loading' | 'verified' | 'success' | 'error';

export default function ScanPage() {
    const [params] = useSearchParams();
    const { user, isAuthenticated } = useAuthStore();
    const { addAttendanceRecord, attendanceSessions, markStudentScanned } = useDataStore();
    const [status, setStatus] = useState<Status>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [qrInfo, setQrInfo] = useState<{ className: string; sessionId: string } | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

    useEffect(() => {
        verifyQR();
    }, []);

    const verifyQR = async () => {
        const payload = params.get('p');
        const sig = params.get('sig');
        const sessionId = params.get('s');

        if (!payload || !sig || !sessionId) {
            setStatus('error');
            setErrorMsg('Mã QR không hợp lệ — thiếu dữ liệu. Vui lòng quét mã QR điểm danh từ bảng.');
            return;
        }

        const valid = await hmacVerify(QR_SECRET, payload, sig);
        if (!valid) {
            setStatus('error');
            setErrorMsg('Mã QR giả mạo — chữ ký số không khớp!');
            return;
        }

        const parts = payload.split('|');
        if (parts.length < 7 || parts[0] !== 'EDUV2') {
            setStatus('error');
            setErrorMsg('Định dạng QR không đúng.');
            return;
        }

        const [, , className, serverTimeStr] = parts;
        const serverTime = parseInt(serverTimeStr);

        const now = Date.now();
        if (Math.abs(now - serverTime) > MAX_TIME_DRIFT_MS) {
            setStatus('error');
            setErrorMsg(`Mã QR đã hết hạn (chênh ${Math.round(Math.abs(now - serverTime) / 1000)}s). Vui lòng quét mã mới.`);
            return;
        }

        setQrInfo({ className, sessionId });

        if (isAuthenticated && user && user.role === 'STUDENT') {
            const studentCode = user.studentCode || `HS${user.id?.slice(-8) || '00000001'}`;
            recordAttendance(studentCode, `${user.firstName || ''} ${user.lastName || ''}`.trim(), className);
            return;
        }

        setStatus('verified');
    };

    const recordAttendance = (studentCode: string, studentName: string, className: string) => {

        const activeSession = attendanceSessions.find(s => s.sessionId === qrInfo?.sessionId && s.active);
        if (activeSession && activeSession.scannedStudents.includes(studentCode)) {
            setStatus('error');
            setErrorMsg(`${studentName} đã điểm danh rồi!`);
            return;
        }

        const now = new Date();
        const isLate = now.getHours() >= 7 && now.getMinutes() > 15;

        addAttendanceRecord({
            id: `att-scan-${Date.now()}-${studentCode}`,
            studentCode,
            studentName,
            className,
            date: now.toISOString().slice(0, 10),
            time: now.toTimeString().slice(0, 5),
            status: isLate ? 'LATE' : 'PRESENT',
            method: 'QR',
            synced: navigator.onLine,
        });

        if (activeSession) {
            markStudentScanned(activeSession.classId, studentCode);
        }

        setStatus('success');
        message.success(`✅ ${studentName} — Điểm danh thành công!`);
    };

    const handleConfirm = () => {
        if (!selectedStudent || !qrInfo) return;
        const student = DEMO_STUDENTS.find(s => s.code === selectedStudent);
        if (!student) return;
        recordAttendance(student.code, student.name, qrInfo.className);
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #E8F0FE 0%, #F8FAFD 100%)',
            padding: 24,
            fontFamily: "'Google Sans', 'Roboto', sans-serif",
        }}>
            <Card bordered={false} style={{
                maxWidth: 440, width: '100%', borderRadius: 24, textAlign: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}>
                {}
                {status === 'loading' && (
                    <div style={{ padding: 40 }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16, color: '#444746', fontSize: 15 }}>Đang xác minh mã QR...</div>
                    </div>
                )}

                {}
                {status === 'verified' && qrInfo && (
                    <div style={{ padding: '32px 24px' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: 20,
                            background: '#E6F4EA', margin: '0 auto 16',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#0D652D' }}>qr_code_scanner</span>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 500, color: '#191C1E', marginBottom: 4 }}>
                            Điểm danh — Lớp {qrInfo.className}
                        </div>
                        <Text style={{ color: '#70757A', fontSize: 13, display: 'block', marginBottom: 24 }}>
                            Mã QR hợp lệ ✓ Chọn tên bạn để xác nhận điểm danh
                        </Text>

                        <Select
                            value={selectedStudent}
                            onChange={setSelectedStudent}
                            placeholder="Chọn tên học sinh..."
                            style={{ width: '100%', textAlign: 'left' }}
                            size="large"
                        >
                            {DEMO_STUDENTS.map(s => (
                                <Option key={s.code} value={s.code}>
                                    {s.code} — {s.name}
                                </Option>
                            ))}
                        </Select>

                        <Button
                            type="primary"
                            size="large"
                            block
                            onClick={handleConfirm}
                            disabled={!selectedStudent}
                            style={{
                                marginTop: 16, borderRadius: 12, height: 48,
                                fontWeight: 500, fontSize: 15,
                            }}
                        >
                            Xác nhận điểm danh
                        </Button>

                        <div style={{
                            marginTop: 20, padding: '12px 16px',
                            background: '#FEF7E0', borderRadius: 12,
                            textAlign: 'left',
                        }}>
                            <Text style={{ fontSize: 12, color: '#7B5800' }}>
                                💡 <strong>Demo:</strong> Trong thực tế, học sinh đăng nhập trước khi quét.
                                Trên demo, chọn tên để test nhanh.
                            </Text>
                        </div>
                    </div>
                )}

                {}
                {status === 'success' && (
                    <Result
                        icon={<span className="material-symbols-outlined" style={{ fontSize: 64, color: '#0D652D' }}>check_circle</span>}
                        title={<span style={{ color: '#0D652D', fontWeight: 500 }}>Điểm danh thành công!</span>}
                        subTitle={
                            <div>
                                {selectedStudent && (
                                    <div style={{ fontSize: 16, fontWeight: 500, color: '#191C1E' }}>
                                        {DEMO_STUDENTS.find(s => s.code === selectedStudent)?.name}
                                    </div>
                                )}
                                {qrInfo && (
                                    <div style={{ color: '#444746', marginTop: 4 }}>
                                        Lớp {qrInfo.className} — {new Date().toLocaleTimeString('vi-VN')}
                                    </div>
                                )}
                            </div>
                        }
                        extra={
                            <Button type="primary" onClick={() => window.close()} style={{ borderRadius: 12 }}>
                                Đóng
                            </Button>
                        }
                    />
                )}

                {}
                {status === 'error' && (
                    <Result
                        icon={<span className="material-symbols-outlined" style={{ fontSize: 64, color: '#B3261E' }}>error</span>}
                        title={<span style={{ color: '#B3261E' }}>Điểm danh thất bại</span>}
                        subTitle={errorMsg}
                        extra={
                            <Button onClick={() => window.close()} style={{ borderRadius: 12 }}>
                                Đóng
                            </Button>
                        }
                    />
                )}
            </Card>
        </div>
    );
}
