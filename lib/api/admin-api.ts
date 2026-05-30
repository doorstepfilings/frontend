import { api } from "./index";

export type AdminStage = {
  id: number;
  name: string;
  slug: string;
  color: string;
  is_active: boolean;
  isActive?: boolean;
  is_default?: boolean;
  isDefault?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminStageInput = {
  name: string;
  color?: string;
  isActive?: boolean;
};

export type AdminServiceWorkflow = {
  id: number;
  service_id: number;
  stage_id: number;
  position: number;
  is_required: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  stage: AdminStage | null;
};

export type AdminDefaultWorkflow = {
  id: number;
  stage_id: number;
  position: number;
  is_required: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  stage: AdminStage | null;
};

export type WorkflowAssignInput = {
  serviceId: number;
  stageId: number;
  position?: number;
  isRequired?: boolean;
};

export type WorkflowReorderInput = {
  serviceId: number;
  orderedWorkflowIds: number[];
};

export type WorkflowUpdateInput = {
  isRequired?: boolean;
};

export type DefaultWorkflowReplaceInput = {
  items: Array<{
    stageId: number;
    position?: number;
    isRequired?: boolean;
  }>;
};

export type ApplyDefaultWorkflowInput = {
  overwrite?: boolean;
  serviceIds?: number[];
};

export type AssignRMInput = {
  user_id: number;
  rm_id: number | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  landmark?: string | null;
  pincode?: string | null;
  state?: string | null;
};

export type UpdateRoleInput = {
  role: string;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  landmark?: string | null;
  pincode?: string | null;
  state?: string | null;
};

export type UpdateApplicationStageInput = {
  service_workflow_id: number | null;
  client_message?: string | null;
};

export type AdminCrmInquiryFilters = {
  search?: string;
  customer_type?: string;
  current_stage?: string;
  payment_status?: string;
  assigned_accountant_id?: string | number;
};

export const adminApi = {
  // Users
  getUsers: (role?: string) => api.get("/admin/users", { params: { role } }),
  getRMs: () => api.get("/admin/rms"),
  getAccountants: () => api.get("/admin/accountants"),
  storeUser: (data: any) => api.post("/admin/users/store", data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  assignRM: (data: AssignRMInput) =>
    api.post("/admin/users/assign-rm", data),
  assignAccountant: (data: {
    user_id: number;
    accountant_id: number | null;
  }) => api.post("/admin/users/assign-accountant", data),
  updateRole: (id: number, data: UpdateRoleInput) =>
    api.post(`/admin/users/update-role/${id}`, data),

  // Categories
  getCategories: () => api.get("/admin/categories"),
  storeCategory: (data: any) => api.post("/admin/categories/store", data),
  updateCategory: (id: number, data: any) =>
    api.patch(`/admin/categories/update/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),

  // Services
  getServices: () => api.get("/admin/services"),
  getService: (id: number) => api.get(`/admin/services/${id}`),
  storeService: (data: any) => api.post("/admin/services/store", data),
  updateService: (id: number, data: any) =>
    api.patch(`/admin/services/update/${id}`, data),
  deleteService: (id: number) => api.delete(`/admin/services/${id}`),

  // Global stages
  getStages: () => api.get("/admin/stages"),
  getLifecycleStages: () => api.get("/admin/lifecycle-stages"),
  getStage: (id: number) => api.get(`/admin/stages/${id}`),
  createStage: (data: AdminStageInput) => api.post("/admin/stages", data),
  updateStage: (id: number, data: Partial<AdminStageInput>) =>
    api.put(`/admin/stages/${id}`, data),
  deleteStage: (id: number) => api.delete(`/admin/stages/${id}`),

  // Default workflow template
  getDefaultWorkflow: () => api.get("/admin/workflows/default"),
  replaceDefaultWorkflow: (data: DefaultWorkflowReplaceInput) =>
    api.put("/admin/workflows/default", data),
  applyDefaultWorkflow: (data: ApplyDefaultWorkflowInput) =>
    api.post("/admin/workflows/default/apply", data),

  // Service workflows
  getServiceWorkflows: (serviceId: number) => api.get(`/admin/workflows/${serviceId}`),
  assignWorkflowStage: (data: WorkflowAssignInput) =>
    api.post("/admin/workflows/assign", data),
  reorderServiceWorkflows: (data: WorkflowReorderInput) =>
    api.put("/admin/workflows/reorder", data),
  updateWorkflowStage: (workflowId: number, data: WorkflowUpdateInput) =>
    api.put(`/admin/workflows/${workflowId}`, data),
  deleteWorkflowStage: (workflowId: number) =>
    api.delete(`/admin/workflows/${workflowId}`),

  // Applications
  getApplications: (status?: string) =>
    api.get("/admin/service-applications", { params: { status } }),
  getApplication: (id: number) => api.get(`/admin/service-applications/${id}`),
  updateApplicationStatus: (id: number, data: any) =>
    api.patch(`/admin/service-applications/${id}/status`, data),
  updateApplicationStage: (id: number, data: UpdateApplicationStageInput) =>
    api.patch(`/admin/service-applications/${id}/stage`, data),
  assignAccountantToService: (id: number, accountantId: number) =>
    api.post(`/admin/service-applications/${id}/assign-accountant`, {
      accountant_id: accountantId,
    }),

  // Details
  getRMDetails: (id: number) => api.get(`/admin/regional-managers/${id}/details`),
  getAccountantDetails: (id: number) =>
    api.get(`/admin/accountants/${id}/details`),
  getUserDetails: (id: number) => api.get(`/admin/users/${id}/details`),

  // Enquiries
  getEnquiries: () => api.get("/admin/enquiries"),

  // CRM inquiries
  getCrmInquiries: (params?: AdminCrmInquiryFilters) =>
    api.get("/admin/crm/inquiries", { params }),
  getCrmInquiry: (id: number) => api.get(`/admin/crm/inquiries/${id}`),
  updateCrmInquiryStage: (
    id: number,
    data: { current_stage: string; note?: string | null },
  ) => api.patch(`/admin/crm/inquiries/${id}/stage`, data),
  assignCrmInquiryAccountant: (
    id: number,
    data: { accountant_id: number | null },
  ) => api.patch(`/admin/crm/inquiries/${id}/assign-accountant`, data),
  createCrmInquiryNote: (id: number, data: { note: string }) =>
    api.post(`/admin/crm/inquiries/${id}/notes`, data),
  uploadCrmInquiryDocuments: (id: number, formData: FormData) =>
    api.post(`/admin/crm/inquiries/${id}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  recommendCrmService: (
    id: number,
    data: {
      service_id: number;
      notes?: string;
      quoted_amount?: number | string | null;
    },
  ) => api.post(`/admin/crm/inquiries/${id}/recommended-services`, data),
  createCrmQuotation: (
    id: number,
    data: {
      subtotal: number | string;
      tax_amount: number | string;
      total_amount: number | string;
      status?: string;
      notes?: string;
    },
  ) => api.post(`/admin/crm/inquiries/${id}/quotations`, data),
  createCrmPayment: (
    id: number,
    data: {
      amount: number | string;
      payment_status: string;
      payment_method?: string;
      reference_number?: string;
      received_at?: string;
    },
  ) => api.post(`/admin/crm/inquiries/${id}/payments`, data),
};
