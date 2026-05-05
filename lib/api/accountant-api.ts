import { api } from './index';

export const accountantApi = {
    getAssignedUsers: () => api.get('/accountant/users'),
    getRequests: (status?: string) => api.get('/accountant/service-requests', { params: { status } }),
    getRequest: (id: number) => api.get(`/accountant/service-requests/${id}`),
    updateStatus: (id: number, data: { status: string }) => api.patch(`/accountant/service-requests/${id}/status`, data),
    verifyDocument: (requestId: number, docId: number, status: string, notes?: string) => 
        api.patch(`/accountant/service-requests/${requestId}/documents/${docId}/verify`, { status, notes }),
    getDocuments: (id: number) => api.get(`/accountant/service-requests/${id}/documents`),
    deleteDocument: (docId: number) => api.delete(`/accountant/documents/${docId}`),
};
