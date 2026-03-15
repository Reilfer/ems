import { create } from 'zustand';
import { authApi } from '../services/api';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    role: string;
    schoolId: string;
    studentCode?: string;
    school?: { id: string; name: string; code: string; logo?: string };
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    fetchProfile: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: !!localStorage.getItem('accessToken'),
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
            const res = await authApi.login(email, password);
            const { user, accessToken, refreshToken } = res.data;

            localStorage.setItem('accessToken', accessToken);
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

            set({ user, isAuthenticated: true, isLoading: false });
            return true;
        } catch (err: any) {
            const msg = (!err.response || err.code === 'ERR_NETWORK')
                ? 'Không thể kết nối đến server. Vui lòng kiểm tra backend đã chạy chưa.'
                : (err.response?.data?.message || 'Đăng nhập thất bại');
            set({ error: msg, isLoading: false });
            return false;
        }
    },

    logout: () => {
        authApi.logout().catch(() => { });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false });
    },

    fetchProfile: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            set({ user: null, isAuthenticated: false });
            return;
        }

        try {
            const res = await authApi.getProfile();
            set({ user: res.data, isAuthenticated: true });
        } catch {
            set({ user: null, isAuthenticated: false });
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    },

    clearError: () => set({ error: null }),
}));
