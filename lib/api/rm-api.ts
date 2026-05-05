import { api } from './index';

export const rmApi = {
    getAssignedUsers: () => api.get('/rm/assigned-users'),
    getAccountants: () => api.get('/rm/accountants'),
    assignAccountant: (data: { user_id: number; accountant_id: number | null }) => api.post('/rm/assign-accountant', data),
    getServiceRequests: () => api.get('/rm/service-requests'),
};
