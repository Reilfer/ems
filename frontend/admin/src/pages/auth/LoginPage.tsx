import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login, isLoading, error, clearError } = useAuthStore();
    const [email, setEmail] = useState('gv.nguyen@demo.eduv.vn');
    const [password, setPassword] = useState('Teacher@123');
    const [emailFocused, setEmailFocused] = useState(false);
    const [passFocused, setPassFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [shake, setShake] = useState(false);

    const emailActive = emailFocused || email.length > 0;
    const passActive = passFocused || password.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        const success = await login(email, password);
        if (success) {
            const redirect = searchParams.get('redirect');
            navigate(redirect || '/dashboard');
        } else {
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    return (
        <div style={styles.page}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@400;500&display=swap');
                @keyframes m3shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-6px); }
                    40%, 80% { transform: translateX(6px); }
                }
                .m3-input:focus { outline: none; }
                .m3-btn:hover { box-shadow: 0 1px 3px 1px rgba(0,0,0,0.15), 0 1px 2px 0 rgba(0,0,0,0.3); }
                .m3-btn:active { transform: scale(0.98); }
                .m3-link:hover { text-decoration: underline; }
            `}</style>
            <div
                style={{
                    ...styles.card,
                    animation: shake ? 'm3shake 0.4s ease-in-out' : 'none',
                }}
            >
                {}
                <div style={styles.header}>
                    <h1 style={styles.title}>Đăng nhập</h1>
                    <p style={styles.subtitle}>Hệ thống Quản lý Giáo dục ReilferEDUV</p>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {}
                    <div style={{
                        ...styles.fieldContainer,
                        borderColor: emailFocused ? '#0B57D0' : error ? '#B3261E' : '#79747E',
                        borderWidth: emailFocused ? 2 : 1,
                    }}>
                        <label style={{
                            ...styles.floatingLabel,
                            ...(emailActive ? styles.floatingLabelActive : {}),
                            color: emailFocused ? '#0B57D0' : error ? '#B3261E' : '#49454F',
                        }}>
                            Email
                        </label>
                        <input
                            className="m3-input"
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                            style={styles.input}
                            autoComplete="email"
                        />
                    </div>

                    {}
                    <div style={{
                        ...styles.fieldContainer,
                        borderColor: passFocused ? '#0B57D0' : error ? '#B3261E' : '#79747E',
                        borderWidth: passFocused ? 2 : 1,
                    }}>
                        <label style={{
                            ...styles.floatingLabel,
                            ...(passActive ? styles.floatingLabelActive : {}),
                            color: passFocused ? '#0B57D0' : error ? '#B3261E' : '#49454F',
                        }}>
                            Mật khẩu
                        </label>
                        <input
                            className="m3-input"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setPassFocused(true)}
                            onBlur={() => setPassFocused(false)}
                            style={{ ...styles.input, paddingRight: 48 }}
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={styles.togglePass}
                            tabIndex={-1}
                        >
                            {showPassword ? 'Ẩn' : 'Hiện'}
                        </button>
                    </div>

                    {}
                    {error && (
                        <div style={styles.errorBox}>
                            <span style={styles.errorText}>{error}</span>
                        </div>
                    )}

                    {}
                    <button
                        className="m3-btn"
                        type="submit"
                        disabled={isLoading || !email || !password}
                        style={{
                            ...styles.submitBtn,
                            opacity: isLoading ? 0.7 : 1,
                        }}
                    >
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                {}
                <div style={{ marginTop: 20, textAlign: 'center' as const }}>
                    <p style={{ color: '#79747E', fontSize: 12, margin: '0 0 8px' }}>Demo nhanh:</p>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' as const }}>
                        {[
                            { label: 'Giáo viên', email: 'gv.nguyen@demo.eduv.vn', pass: 'Teacher@123', color: '#0D652D', bg: '#E6F4EA' },
                            { label: 'Học sinh', email: 'hs.an@demo.eduv.vn', pass: 'Student@123', color: '#7B5800', bg: '#FEEFC3' },
                        ].map(acc => (
                            <button
                                key={acc.label}
                                type="button"
                                onClick={() => { setEmail(acc.email); setPassword(acc.pass); }}
                                style={{
                                    background: acc.bg,
                                    color: acc.color,
                                    border: 'none',
                                    borderRadius: 100,
                                    padding: '6px 16px',
                                    fontSize: 12,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    fontFamily: "'Google Sans', sans-serif",
                                }}
                            >
                                {acc.label}
                            </button>
                        ))}
                    </div>
                </div>

                {}
                <div style={styles.links}>
                    <span style={styles.linkText}>
                        Quản trị viên?{' '}
                        <a className="m3-link" href="/admin" style={styles.link}>Đăng nhập Admin</a>
                    </span>
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#FEF7FF',
        fontFamily: "'Google Sans', 'Roboto', sans-serif",
    },
    card: {
        width: 400,
        padding: '40px 32px 32px',
        borderRadius: 28,
        background: '#FFFFFF',
        border: '1px solid #CAC4D0',
        boxShadow: '0 2px 6px 2px rgba(0,0,0,0.05), 0 1px 2px 0 rgba(0,0,0,0.06)',
    },
    header: {
        textAlign: 'center' as const,
        marginBottom: 32,
    },
    title: {
        margin: 0,
        fontSize: 24,
        fontWeight: 400,
        color: '#1D1B20',
        fontFamily: "'Google Sans', sans-serif",
    },
    subtitle: {
        margin: '8px 0 0',
        fontSize: 14,
        color: '#49454F',
        fontWeight: 400,
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 20,
    },
    fieldContainer: {
        position: 'relative' as const,
        borderStyle: 'solid',
        borderRadius: 4,
        background: '#FFFFFF',
        height: 56,
    },
    floatingLabel: {
        position: 'absolute' as const,
        left: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 16,
        fontWeight: 400,
        transition: 'all 0.15s cubic-bezier(0.2, 0, 0, 1)',
        pointerEvents: 'none' as const,
        background: '#FFFFFF',
        padding: '0 4px',
    },
    floatingLabelActive: {
        top: -1,
        transform: 'translateY(-50%)',
        fontSize: 12,
        fontWeight: 500,
    },
    input: {
        width: '100%',
        height: '100%',
        padding: '8px 16px 0',
        border: 'none',
        borderRadius: 4,
        fontSize: 16,
        color: '#1D1B20',
        background: 'transparent',
        fontFamily: "'Roboto', sans-serif",
        boxSizing: 'border-box' as const,
    },
    togglePass: {
        position: 'absolute' as const,
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: '#49454F',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "'Roboto', sans-serif",
        padding: '4px 8px',
        borderRadius: 4,
    },
    errorBox: {
        background: '#F9DEDC',
        borderRadius: 12,
        padding: '12px 16px',
    },
    errorText: {
        color: '#B3261E',
        fontSize: 14,
        fontWeight: 400,
    },
    submitBtn: {
        width: '100%',
        height: 48,
        border: 'none',
        borderRadius: 100,
        background: '#6750A4',
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 500,
        fontFamily: "'Google Sans', sans-serif",
        cursor: 'pointer',
        letterSpacing: 0.1,
        transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
        marginTop: 4,
    },
    demoHint: {
        textAlign: 'center' as const,
        marginTop: 20,
        marginBottom: 0,
        color: '#79747E',
        fontSize: 12,
    },
    links: {
        textAlign: 'center' as const,
        marginTop: 16,
    },
    linkText: {
        color: '#49454F',
        fontSize: 14,
    },
    link: {
        color: '#6750A4',
        fontWeight: 500,
        textDecoration: 'none',
    },
};
