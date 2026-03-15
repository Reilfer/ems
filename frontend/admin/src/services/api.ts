import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;

        const isAuthRequest = originalRequest?.url?.includes('/auth/login') ||
            originalRequest?.url?.includes('/auth/admin/login') ||
            originalRequest?.url?.includes('/auth/register');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const res = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken });
                const { accessToken, refreshToken: newRefresh } = res.data;

                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefresh);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export const authApi = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    adminLogin: (email: string, password: string) =>
        api.post('/auth/admin/login', { email, password }),
    register: (data: any) =>
        api.post('/auth/register', data),
    getProfile: () =>
        api.get('/auth/me'),
    updateProfile: (data: any) =>
        api.patch('/auth/me', data),
    changePassword: (currentPassword: string, newPassword: string) =>
        api.post('/auth/change-password', { currentPassword, newPassword }),
    logout: () =>
        api.post('/auth/logout'),
};

export const studentApi = {
    list: (params?: any) =>
        api.get('/students', { params }),
    getById: (id: string) =>
        api.get(`/students/${id}`),
    create: (data: any) =>
        api.post('/students', data),
    update: (id: string, data: any) =>
        api.patch(`/students/${id}`, data),
    delete: (id: string) =>
        api.delete(`/students/${id}`),
    getStats: () =>
        api.get('/students/stats'),
    assignClass: (studentIds: string[], classId: string) =>
        api.post('/students/assign-class', { studentIds, classId }),
};

export const gradeApi = {
    upsertScore: (data: any) =>
        api.post('/grades/score', data),
    batchScores: (scores: any[]) =>
        api.post('/grades/scores/batch', { scores }),
    classScores: (params: any) =>
        api.get('/grades/class-scores', { params }),
    transcript: (studentId: string, academicYearId: string) =>
        api.get(`/grades/transcript/${studentId}`, { params: { academicYearId } }),
};

export const userApi = {
    list: (params?: any) =>
        api.get('/auth/users', { params }),
    getStats: () =>
        api.get('/auth/users/stats'),
};

export const attendanceApi = {

    createSession: (classId: string) =>
        api.post('/attendance/sessions', { classId }),
    activateSession: (id: string) =>
        api.patch(`/attendance/sessions/${id}/activate`),
    deactivateSession: (id: string) =>
        api.patch(`/attendance/sessions/${id}/deactivate`),
    refreshQR: (id: string) =>
        api.post(`/attendance/sessions/${id}/refresh-qr`),
    getActiveSessions: () =>
        api.get('/attendance/sessions/active'),

    scanQR: (data: any) =>
        api.post('/attendance/records/scan', data),
    syncOffline: (records: any[]) =>
        api.post('/attendance/records/sync', { records }),
    getRecords: (params?: any) =>
        api.get('/attendance/records', { params }),

    dailyStats: (date?: string) =>
        api.get('/attendance/stats/daily', { params: { date } }),
    weeklyStats: (classId?: string) =>
        api.get('/attendance/stats/weekly', { params: { classId } }),
    absentStudents: (date?: string) =>
        api.get('/attendance/stats/absent', { params: { date } }),
};

export const scheduleApi = {

    addSlot: (data: any) =>
        api.post('/schedule/timetable', data),
    classTimetable: (classId: string) =>
        api.get(`/schedule/timetable/class/${classId}`),
    teacherSchedule: (teacherId: string) =>
        api.get(`/schedule/timetable/teacher/${teacherId}`),
    getAllSlots: (schoolId: string) =>
        api.get('/schedule/timetable', { params: { schoolId } }),
    deleteSlot: (id: string) =>
        api.delete(`/schedule/timetable/${id}`),

    createEvent: (data: any) =>
        api.post('/schedule/events', data),
    getEvents: (schoolId: string, month?: string) =>
        api.get('/schedule/events', { params: { schoolId, month } }),
    updateEvent: (id: string, data: any) =>
        api.patch(`/schedule/events/${id}`, data),
    deleteEvent: (id: string) =>
        api.delete(`/schedule/events/${id}`),

    listRooms: (schoolId: string) =>
        api.get('/schedule/rooms', { params: { schoolId } }),
    bookRoom: (data: any) =>
        api.post('/schedule/rooms/book', data),
    roomBookings: (roomId: string, date?: string) =>
        api.get(`/schedule/rooms/${roomId}/bookings`, { params: { date } }),
    cancelBooking: (id: string) =>
        api.patch(`/schedule/rooms/${id}/cancel`),
    availableRooms: (schoolId: string, startTime: string, endTime: string) =>
        api.get('/schedule/rooms/available', { params: { schoolId, startTime, endTime } }),
};

export const notificationApi = {
    send: (data: any) =>
        api.post('/notifications/send', data),
    broadcast: (data: any) =>
        api.post('/notifications/broadcast', data),
    notifyAbsence: (data: any) =>
        api.post('/notifications/absence', data),
    getUserNotifications: (userId: string, page?: number, limit?: number) =>
        api.get(`/notifications/user/${userId}`, { params: { page, limit } }),
    getSentNotifications: (senderId: string, page?: number, limit?: number) =>
        api.get(`/notifications/sent/${senderId}`, { params: { page, limit } }),
    getSchoolNotifications: (schoolId: string, page?: number, limit?: number) =>
        api.get(`/notifications/school/${schoolId}`, { params: { page, limit } }),
    markRead: (id: string) =>
        api.patch(`/notifications/${id}/read`),
    markAllRead: (userId: string) =>
        api.patch(`/notifications/user/${userId}/read-all`),
    deleteNotification: (id: string) =>
        api.delete(`/notifications/${id}`),
};

export const financeApi = {
    getInvoices: (params?: any) =>
        api.get('/finance/invoices', { params }),
    createInvoice: (data: any) =>
        api.post('/finance/invoices', data),
    getInvoice: (id: string) =>
        api.get(`/finance/invoices/${id}`),
    markPaid: (id: string, data: any) =>
        api.patch(`/finance/invoices/${id}/pay`, data),
    getPayments: (params?: any) =>
        api.get('/finance/payments', { params }),
    getVietQR: (invoiceId: string) =>
        api.get(`/finance/vietqr/${invoiceId}`),
    getStats: () =>
        api.get('/finance/stats'),
};

export const hrApi = {

    getTeachers: (params?: any) => api.get('/hr/teachers', { params }),
    getTeacher: (id: string) => api.get(`/hr/teachers/${id}`),
    createTeacher: (data: any) => api.post('/hr/teachers', data),
    updateTeacher: (id: string, data: any) => api.patch(`/hr/teachers/${id}`, data),
    deleteTeacher: (id: string) => api.delete(`/hr/teachers/${id}`),
    getTeacherStats: () => api.get('/hr/teachers/stats'),

    checkIn: (data: any) => api.post('/hr/timekeeping/check-in', data),
    checkOut: (data: any) => api.post('/hr/timekeeping/check-out', data),
    getUserTimekeeping: (userId: string, month?: string) => api.get(`/hr/timekeeping/user/${userId}`, { params: { month } }),
    getTimekeepingStats: (month?: string) => api.get('/hr/timekeeping/stats', { params: { month } }),

    calculatePayroll: (data: any) => api.post('/hr/payroll/calculate', data),
    getPayrolls: (params?: any) => api.get('/hr/payroll', { params }),
    approvePayroll: (id: string) => api.patch(`/hr/payroll/${id}/approve`),
    payPayroll: (id: string) => api.patch(`/hr/payroll/${id}/pay`),
    getPayrollStats: (year?: number) => api.get('/hr/payroll/stats', { params: { year } }),

    getContracts: (params?: any) => api.get('/hr/contracts', { params }),
    getContract: (id: string) => api.get(`/hr/contracts/${id}`),
    createContract: (data: any) => api.post('/hr/contracts', data),
    updateContract: (id: string, data: any) => api.patch(`/hr/contracts/${id}`, data),
    terminateContract: (id: string) => api.patch(`/hr/contracts/${id}/terminate`),
    getExpiringContracts: (days?: number) => api.get('/hr/contracts/expiring', { params: { days } }),
};

export const enrollmentApi = {

    getApplications: (params?: any) => api.get('/enrollment/applications', { params }),
    getApplication: (id: string) => api.get(`/enrollment/applications/${id}`),
    createApplication: (data: any) => api.post('/enrollment/applications', data),
    updateApplicationStatus: (id: string, data: any) => api.patch(`/enrollment/applications/${id}/status`, data),
    getApplicationStats: () => api.get('/enrollment/applications/stats'),

    getLeads: (params?: any) => api.get('/enrollment/leads', { params }),
    getLead: (id: string) => api.get(`/enrollment/leads/${id}`),
    createLead: (data: any) => api.post('/enrollment/leads', data),
    updateLead: (id: string, data: any) => api.patch(`/enrollment/leads/${id}`, data),
    deleteLead: (id: string) => api.delete(`/enrollment/leads/${id}`),
    getLeadStats: () => api.get('/enrollment/leads/stats'),
};

export const assetApi = {
    getAssets: () => api.get('/assets'),
    getAsset: (id: string) => api.get(`/assets/${id}`),
    createAsset: (data: any) => api.post('/assets', data),
    getMaintenanceRequests: () => api.get('/assets/maintenance'),
    createMaintenanceRequest: (data: any) => api.post('/assets/maintenance', data),
};

export const mediaApi = {
    upload: (formData: FormData) => api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const workflowApi = {
    getAll: () => api.get('/workflows'),
};

export const analyticsApi = {
    getDashboard: () => api.get('/analytics/dashboard'),
    getPerformance: () => api.get('/analytics/performance'),
    getEnrollmentTrends: () => api.get('/analytics/enrollment-trends'),
};

const AI_BASE = import.meta.env.VITE_AI_URL || 'http://localhost:3016';
export const aiApi = {
    chat: (message: string, conversationHistory?: Array<{ role: string; content: string }>) =>
        axios.post(`${AI_BASE}/api/v1/ai/chat`, { message, conversationHistory }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            timeout: 30000,
        }),
    grade: (question: string, answerKey: string, studentAnswer: string, maxScore: number) =>
        api.post('/ai/grade', { question, answerKey, studentAnswer, maxScore }),
};

export const homeworkApi = {
    list: (params?: Record<string, string>) => api.get('/homework/homework', { params }),
    getById: (id: string) => api.get(`/homework/homework/${id}`),
    getSubmissions: (id: string) => api.get(`/homework/homework/${id}/submissions`),
    create: (data: any) => api.post('/homework/homework', data),
    submitQuiz: (homeworkId: string, data: any) => api.post(`/homework/homework/${homeworkId}/submit-quiz`, data),
    submitEssay: (homeworkId: string, data: any) => api.post(`/homework/homework/${homeworkId}/submit-essay`, data),
    grade: (submissionId: string, data: any) => api.patch(`/homework/homework/submissions/${submissionId}/grade`, data),
    delete: (id: string) => api.delete(`/homework/homework/${id}`),
    stats: () => api.get('/homework/homework/stats'),
    classes: () => api.get('/homework/homework/classes'),
    subjects: () => api.get('/homework/homework/subjects'),
};

export const leaveRequestsApi = {
    list: (params?: Record<string, string>) => api.get('/attendance/leave-requests', { params }),
    create: (data: any) => api.post('/attendance/leave-requests', data),
    updateStatus: (id: string, status: 'approved' | 'rejected') => api.patch(`/attendance/leave-requests/${id}/status`, { status }),
};

export default api;
