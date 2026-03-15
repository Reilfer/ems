import { useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Tag, Tooltip, message } from 'antd';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const isAdmin = (role?: string) => ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'admin'].includes(role || '');
const isTeacher = (role?: string) => role === 'TEACHER';
const isStudent = (role?: string) => ['STUDENT', 'PARENT'].includes(role || '');

const adminMenuItems = [
    { key: '/dashboard', icon: <span className="material-symbols-outlined">dashboard</span>, label: 'Dashboard' },
    { key: '/students', icon: <span className="material-symbols-outlined">school</span>, label: 'Học sinh' },
    { key: '/grades', icon: <span className="material-symbols-outlined">assignment</span>, label: 'Điểm số' },
    { key: '/attendance', icon: <span className="material-symbols-outlined">fact_check</span>, label: 'Điểm danh' },
    { key: '/attendance/leave-requests', icon: <span className="material-symbols-outlined">event_busy</span>, label: 'Đơn xin nghỉ' },
    { key: '/schedule', icon: <span className="material-symbols-outlined">calendar_month</span>, label: 'Thời khóa biểu' },
    { key: '/finance', icon: <span className="material-symbols-outlined">payments</span>, label: 'Tài chính' },
    { key: '/teachers', icon: <span className="material-symbols-outlined">person</span>, label: 'Giáo viên' },
    { key: '/enrollment', icon: <span className="material-symbols-outlined">how_to_reg</span>, label: 'Tuyển sinh' },
    { key: '/ai', icon: <span className="material-symbols-outlined">smart_toy</span>, label: 'Chatbot' },
    { key: '/notifications', icon: <span className="material-symbols-outlined">notifications</span>, label: 'Thông báo' },
    { key: '/reports', icon: <span className="material-symbols-outlined">bar_chart</span>, label: 'Báo cáo' },
    { key: '/settings', icon: <span className="material-symbols-outlined">settings</span>, label: 'Cài đặt' },
];

const teacherMenuItems = [
    { key: '/dashboard', icon: <span className="material-symbols-outlined">dashboard</span>, label: 'Tổng quan' },
    { key: '/students', icon: <span className="material-symbols-outlined">school</span>, label: 'Học sinh lớp tôi' },
    { key: '/assignments', icon: <span className="material-symbols-outlined">assignment</span>, label: 'Bài tập' },
    { key: '/grades', icon: <span className="material-symbols-outlined">grading</span>, label: 'Nhập điểm' },
    { key: '/attendance', icon: <span className="material-symbols-outlined">fact_check</span>, label: 'Điểm danh' },
    { key: '/attendance/leave-requests', icon: <span className="material-symbols-outlined">event_busy</span>, label: 'Đơn xin nghỉ' },
    { key: '/schedule', icon: <span className="material-symbols-outlined">calendar_month</span>, label: 'Lịch dạy' },
    { key: '/notifications', icon: <span className="material-symbols-outlined">inbox</span>, label: 'Hộp thư đến' },
    { key: '/ai', icon: <span className="material-symbols-outlined">smart_toy</span>, label: 'Chatbot' },
];

const studentMenuItems = [
    { key: '/dashboard', icon: <span className="material-symbols-outlined">home</span>, label: 'Trang chủ' },
    { key: '/assignments', icon: <span className="material-symbols-outlined">assignment</span>, label: 'Bài tập' },
    { key: '/grades', icon: <span className="material-symbols-outlined">emoji_events</span>, label: 'Kết quả học tập' },
    { key: '/attendance', icon: <span className="material-symbols-outlined">calendar_today</span>, label: 'Điểm danh' },
    { key: '/attendance/leave-requests', icon: <span className="material-symbols-outlined">event_busy</span>, label: 'Đơn xin nghỉ' },
    { key: '/schedule', icon: <span className="material-symbols-outlined">calendar_month</span>, label: 'Lịch học' },
    { key: '/notifications', icon: <span className="material-symbols-outlined">inbox</span>, label: 'Thông báo' },
    { key: '/ai', icon: <span className="material-symbols-outlined">smart_toy</span>, label: 'Hỏi đáp' },
];

const teacherPaths = ['/dashboard', '/students', '/assignments', '/grades', '/attendance', '/attendance/leave-requests', '/schedule', '/notifications', '/ai'];
const studentPaths = ['/dashboard', '/assignments', '/grades', '/attendance', '/attendance/leave-requests', '/schedule', '/notifications', '/ai'];

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, logout, fetchProfile } = useAuthStore();
    const { demoLoaded, loadDemoData } = useDataStore();

    useEffect(() => {
        if (!demoLoaded) {
            loadDemoData();
        }
    }, [demoLoaded]);

    const userRole = user?.role;
    const userIsAdmin = isAdmin(userRole);
    const userIsTeacher = isTeacher(userRole);
    const userIsStudent = isStudent(userRole);

    const menuItems = useMemo(() => {
        if (userIsAdmin) return adminMenuItems;
        if (userIsTeacher) return teacherMenuItems;
        return studentMenuItems;
    }, [userIsAdmin, userIsTeacher]);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (!user) {
            fetchProfile();
            return;
        }

        if (!userIsAdmin) {
            const allowedPaths = userIsTeacher ? teacherPaths : studentPaths;
            const isAllowed = allowedPaths.some(p => location.pathname.startsWith(p));
            if (!isAllowed) {
                navigate('/dashboard');
            }
        }
    }, [isAuthenticated, user, location.pathname]);

    const handleMenuClick = (e: any) => {
        navigate(e.key);
    };

    const userMenuItems = [
        { key: 'profile', label: 'Hồ sơ cá nhân' },
        { type: 'divider' as const },
        { key: 'logout', label: 'Đăng xuất', danger: true },
    ];

    const handleUserMenu = ({ key }: { key: string }) => {
        if (key === 'logout') {
            logout();
            navigate('/login');
        } else if (key === 'profile') {
            navigate('/dashboard');
        }
    };

    const initials = user
        ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`
        : '';

    const roleBadge = userIsAdmin
        ? { text: 'Quản trị viên', color: '#0B57D0', avatarBg: '#C2E7FF', avatarFg: '#001D35' }
        : userIsTeacher
            ? { text: 'Giáo viên', color: '#0D652D', avatarBg: '#C4EED0', avatarFg: '#002110' }
            : { text: 'Học sinh & Phụ huynh', color: '#7B5800', avatarBg: '#FEEFC3', avatarFg: '#3B2F00' };

    return (
        <Layout style={{ minHeight: '100vh', background: '#F8FAFD' }}>
            {}
            <Sider
                width={260}
                style={{
                    background: '#F8FAFD',
                    borderRight: 'none',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 100,
                    padding: '0',
                }}
            >
                {}
                <div style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 20px',
                    gap: 10,
                }}>
                    <Text style={{
                        color: '#191C1E',
                        fontSize: 20,
                        fontWeight: 700,
                        fontFamily: "'Google Sans', sans-serif",
                        letterSpacing: -0.3,
                    }}>
                        ReilferEDUV
                    </Text>
                </div>

                {}
                <div style={{ padding: '0 16px', marginBottom: 8 }}>
                    <Tag
                        color={roleBadge.color}
                        style={{
                            borderRadius: 100,
                            padding: '4px 16px',
                            fontSize: 12,
                            fontWeight: 500,
                            fontFamily: "'Google Sans', sans-serif",
                            border: 'none',
                            width: '100%',
                            textAlign: 'center',
                        }}
                    >
                        {roleBadge.text}
                    </Tag>
                </div>

                {}
                {user?.school && (
                    <div style={{
                        padding: '4px 20px 12px',
                        marginBottom: 4,
                    }}>
                        <Text style={{
                            color: '#444746',
                            fontSize: 11,
                            letterSpacing: 0.5,
                            textTransform: 'uppercase',
                            fontWeight: 500,
                        }}>
                            Trường
                        </Text>
                        <div style={{
                            color: '#191C1E',
                            fontSize: 13,
                            fontWeight: 500,
                            marginTop: 2,
                        }}>
                            {user.school.name}
                        </div>
                    </div>
                )}

                {}
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                    style={{
                        border: 'none',
                        background: 'transparent',
                        padding: '4px 0',
                    }}
                />
            </Sider>

            <Layout style={{ marginLeft: 260, background: '#F8FAFD' }}>
                {}
                <Header style={{
                    background: '#F8FAFD',
                    padding: '0 24px',
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: 'none',
                    boxShadow: 'none',
                }}>
                    {}
                    <div style={{
                        flex: 1,
                        maxWidth: 720,
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            background: '#E9EEF6',
                            borderRadius: 50,
                            padding: '0 16px',
                            height: 48,
                        }}>
                            <span className="material-symbols-outlined" style={{ color: '#444746', fontSize: 20 }}>search</span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    outline: 'none',
                                    fontSize: 14,
                                    fontFamily: "'Google Sans Text', sans-serif",
                                    color: '#191C1E',
                                    width: '100%',
                                }}
                            />
                        </div>
                    </div>

                    {}
                    <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} placement="bottomRight">
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            padding: '6px 8px',
                            borderRadius: 50,
                            transition: 'background 0.2s',
                            marginLeft: 16,
                        }}>
                            <Avatar
                                style={{
                                    background: roleBadge.avatarBg,
                                    color: roleBadge.avatarFg,
                                    fontWeight: 500,
                                    fontSize: 14,
                                }}
                                size={36}
                            >
                                {initials}
                            </Avatar>
                        </div>
                    </Dropdown>
                </Header>

                {}
                <Content style={{
                    margin: '0 24px 24px',
                    padding: 24,
                    background: '#FFFFFF',
                    borderRadius: 24,
                    minHeight: 360,
                }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}
