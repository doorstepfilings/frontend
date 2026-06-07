import { api } from './index';

export type UserLocationInput = {
    address?: string | null;
    city?: string | null;
    pincode?: string | null;
    state?: string | null;
};

export type AssignRMInput = UserLocationInput & {
    user_id: number;
    rm_id: number | null;
};

export type UpdateRoleInput = UserLocationInput & {
    role: string;
};

export const adminApi = {
    // Users
    getUsers: (role?: string) => api.get('/admin/users', { params: { role } }),
    getRMs: () => api.get('/admin/rms'),
    getAccountants: () => api.get('/admin/accountants'),
    storeUser: (data: any) => api.post('/admin/users/store', data),
    deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
    assignRM: (data: AssignRMInput) => api.post('/admin/users/assign-rm', data),
    assignAccountant: (data: { user_id: number; accountant_id: number | null }) => api.post('/admin/users/assign-accountant', data),
    updateRole: (id: number, data: UpdateRoleInput) => api.post(`/admin/users/update-role/${id}`, data),
    
    // Categories
    getCategories: () => api.get('/admin/categories'),
    storeCategory: (data: any) => api.post('/admin/categories/store', data),
    updateCategory: (id: number, data: any) => api.patch(`/admin/categories/update/${id}`, data),
    deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),
    
    // Services
    getServices: () => api.get('/admin/services'),
    getService: (id: number) => api.get(`/admin/services/${id}`),
    storeService: (data: any) => api.post('/admin/services/store', data),
    updateService: (id: number, data: any) => api.patch(`/admin/services/update/${id}`, data),
    deleteService: (id: number) => api.delete(`/admin/services/${id}`),
    
    // Applications
    getApplications: (status?: string) => api.get('/admin/service-applications', { params: { status } }),
    getApplication: (id: number) => api.get(`/admin/service-applications/${id}`),
    updateApplicationStatus: (id: number, data: any) => api.patch(`/admin/service-applications/${id}/status`, data),
    assignAccountantToService: (id: number, accountantId: number) => api.post(`/admin/service-applications/${id}/assign-accountant`, { accountant_id: accountantId }),
    
    // Details
    getRMDetails: (id: number) => api.get(`/admin/regional-managers/${id}/details`),
    getAccountantDetails: (id: number) => api.get(`/admin/accountants/${id}/details`),
    getUserDetails: (id: number) => api.get(`/admin/users/${id}/details`),
    
    // Enquiries
    getEnquiries: () => api.get('/admin/enquiries'),
};
