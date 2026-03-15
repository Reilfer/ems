import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/auth/LoginPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import StudentsPage from './pages/students/StudentsPage';
import GradesPage from './pages/grades/GradesPage';
import AttendancePage from './pages/attendance/AttendancePage';
import SchedulePage from './pages/schedule/SchedulePage';
import FinancePage from './pages/finance/FinancePage';
import TeachersPage from './pages/teachers/TeachersPage';
import EnrollmentPage from './pages/enrollment/EnrollmentPage';
import AiChatPage from './pages/ai/AiChatPage';
import AssignmentsPage from './pages/assignments/AssignmentsPage';
import ReportsPage from './pages/reports/ReportsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SettingsPage from './pages/settings/SettingsPage';
import ScanPage from './pages/attendance/ScanPage';
import { LeaveRequestsPage } from './pages/attendance/LeaveRequestsPage';

const theme = {
    token: {
        colorPrimary: '#0B57D0',
        borderRadius: 12,
        fontFamily: "'Google Sans Text', 'Roboto', -apple-system, sans-serif",
    },
};

export default function App() {
    return (
        <ConfigProvider locale={viVN} theme={theme}>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/admin" element={<AdminLoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/attendance/scan" element={<ScanPage />} />
                    <Route element={<AdminLayout />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/students" element={<StudentsPage />} />
                        <Route path="/grades" element={<GradesPage />} />
                        <Route path="/attendance" element={<AttendancePage />} />
                        <Route path="/attendance/leave-requests" element={<LeaveRequestsPage />} />
                        <Route path="/schedule" element={<SchedulePage />} />
                        <Route path="/finance" element={<FinancePage />} />
                        <Route path="/teachers" element={<TeachersPage />} />
                        <Route path="/enrollment" element={<EnrollmentPage />} />
                        <Route path="/assignments" element={<AssignmentsPage />} />
                        <Route path="/ai" element={<AiChatPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </ConfigProvider>
    );
}
