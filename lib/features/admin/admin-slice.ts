import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "@/lib/api/client";

interface AdminState {
  serviceApplication: any | null;
  stats: any | null;
  recentActivity: any[];
  users: any[];
  rms: any[];
  accountants: any[];
  categories: any[];
  services: any[];
  applications: any[];
  selectedApplication: any | null;
  loading: boolean;
  usersLoading: boolean;
  catalogLoading: boolean;
  statsLoading: boolean;
  activityLoading: boolean;
  actionLoading: boolean;
  error: string | null;
  actionError: any | null;
}

const initialState: AdminState = {
  serviceApplication: null,
  stats: null,
  recentActivity: [],
  users: [],
  rms: [],
  accountants: [],
  categories: [],
  services: [],
  applications: [],
  selectedApplication: null,
  loading: false,
  statsLoading: false,
  activityLoading: false,
  usersLoading: false,
  catalogLoading: false,
  actionLoading: false,
  error: null,
  actionError: null,
};

function normalizeAdminList(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: unknown[] }).data;
  }

  return [];
}

function normalizePersonRecord(person: any) {
  if (!person || typeof person !== "object") {
    return person;
  }

  return {
    ...person,
    mobile_number: person.mobile_number ?? person.mobileNumber ?? null,
    rm_id: person.rm_id ?? person.rmId ?? null,
    accountant_id: person.accountant_id ?? person.accountantId ?? null,
    rm_unique_id: person.rm_unique_id ?? person.rmUniqueId ?? null,
    accountant_unique_id:
      person.accountant_unique_id ?? person.accountantUniqueId ?? null,
    created_at: person.created_at ?? person.createdAt ?? null,
    updated_at: person.updated_at ?? person.updatedAt ?? null,
  };
}

function normalizeApplicationDocumentRecord(document: any) {
  if (!document || typeof document !== "object") {
    return document;
  }

  return {
    ...document,
    document_type: document.document_type ?? document.documentType ?? null,
    document_category:
      document.document_category ?? document.documentCategory ?? null,
    document_name: document.document_name ?? document.documentName ?? null,
    service_document_id:
      document.service_document_id ?? document.serviceDocumentId ?? null,
    source_document_id:
      document.source_document_id ?? document.sourceDocumentId ?? null,
    file_name: document.file_name ?? document.fileName ?? null,
    file_url: document.file_url ?? document.fileUrl ?? null,
    file_size: document.file_size ?? document.fileSize ?? null,
    mime_type: document.mime_type ?? document.mimeType ?? null,
    is_final: document.is_final ?? document.isFinal ?? false,
    uploaded_by: normalizePersonRecord(
      document.uploaded_by ?? document.uploadedBy ?? null,
    ),
    created_at: document.created_at ?? document.createdAt ?? null,
    uploaded_at:
      document.uploaded_at ?? document.createdAt ?? document.created_at ?? null,
  };
}

function normalizeApplicationRecord(application: any) {
  if (!application || typeof application !== "object") {
    return application;
  }

  const requestDocuments = Array.isArray(application.request_documents)
    ? application.request_documents
    : Array.isArray(application.requestDocuments)
      ? application.requestDocuments
      : [];

  return {
    ...application,
    user: normalizePersonRecord(application.user ?? null),
    accountant: normalizePersonRecord(application.accountant ?? null),
    request_documents: requestDocuments.map(normalizeApplicationDocumentRecord),
    order_unique_id:
      application.order_unique_id ??
      application.orderUniqueId ??
      null,
    invoice_unique_id:
      application.invoice_unique_id ??
      application.invoiceUniqueId ??
      null,
    payment_id: application.payment_id ?? application.paymentId ?? null,
    order_created_at:
      application.order_created_at ?? application.orderCreatedAt ?? null,
    application_unique_id:
      application.application_unique_id ??
      application.applicationUniqueId ??
      null,
    payment_status: application.payment_status ?? application.paymentStatus ?? null,
    form_data: application.form_data ?? application.formData ?? null,
    revision_notes: application.revision_notes ?? application.revisionNotes ?? null,
    ca_notes: application.ca_notes ?? application.caNotes ?? null,
    update_note: application.update_note ?? application.updateNote ?? null,
    rejection_reason:
      application.rejection_reason ?? application.rejectionReason ?? null,
    certificate_url:
      application.certificate_url ?? application.certificateUrl ?? null,
    submitted_to_ca_at:
      application.submitted_to_ca_at ?? application.submittedToCaAt ?? null,
    created_at: application.created_at ?? application.createdAt ?? null,
    updated_at: application.updated_at ?? application.updatedAt ?? null,
  };
}

function sortApplicationsLatestFirst(applications: any[]) {
  return [...applications].sort((left, right) => {
    const rightDate = new Date(
      right?.order_created_at ?? right?.created_at ?? 0,
    ).getTime();
    const leftDate = new Date(
      left?.order_created_at ?? left?.created_at ?? 0,
    ).getTime();

    if (rightDate !== leftDate) {
      return rightDate - leftDate;
    }

    return Number(right?.id ?? 0) - Number(left?.id ?? 0);
  });
}

function isPendingApplicationStatus(status: unknown) {
  if (typeof status !== "string") {
    return false;
  }

  return [
    "pending",
    "applied",
    "paid",
    "under_review",
    "update_required",
    "in_progress",
    "submitted_to_ca",
    "processing",
  ].includes(status);
}

// Async thunk to fetch admin dashboard stats
export const fetchAdminStats = createAsyncThunk(
  "admin/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const results = await Promise.allSettled([
        apiClient.get("/admin/users"),
        apiClient.get("/admin/rms"),
        apiClient.get("/admin/accountants"),
        apiClient.get("/admin/categories"),
        apiClient.get("/admin/services"),
        apiClient.get("/admin/enquiries"),
        apiClient.get("/admin/service-applications"),
      ]);

      const getList = (index: number) => {
        const result = results[index];
        if (result.status !== "fulfilled") {
          return [];
        }

        return normalizeAdminList(result.value.data?.data ?? result.value.data);
      };

      const users = getList(0);
      const rms = getList(1);
      const accountants = getList(2);
      const categories = getList(3);
      const services = getList(4);
      const enquiries = getList(5);
      const applications = getList(6);

      return {
        users: users.length,
        rms: rms.length,
        accountants: accountants.length,
        categories: categories.length,
        services: services.length,
        enquiries: {
          total: enquiries.length,
          pending: enquiries.filter((item: any) => item?.status === "pending").length,
        },
        applications: {
          total: applications.length,
          pending: applications.filter((item: any) =>
            isPendingApplicationStatus(item?.status),
          ).length,
        },
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch admin stats"
      );
    }
  }
);

// Async thunk to fetch recent activity
export const fetchRecentActivity = createAsyncThunk(
  "admin/fetchActivity",
  async (_, { rejectWithValue }) => {
    try {
      const results = await Promise.allSettled([
        apiClient.get("/admin/enquiries"),
        apiClient.get("/admin/service-applications"),
      ]);

      const enquiries =
        results[0].status === "fulfilled"
          ? normalizeAdminList(results[0].value.data?.data ?? results[0].value.data)
          : [];
      const applications =
        results[1].status === "fulfilled"
          ? normalizeAdminList(results[1].value.data?.data ?? results[1].value.data)
          : [];

      return [
        ...enquiries.map((item: any) => ({
          ...item,
          activityType: "enquiry",
        })),
        ...applications.map((item: any) => ({
          ...item,
          activityType: "application",
        })),
      ]
        .sort(
          (a: any, b: any) =>
            new Date(b?.created_at || 0).getTime() -
            new Date(a?.created_at || 0).getTime(),
        )
        .slice(0, 8);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch activity"
      );
    }
  }
);

// Async thunk to fetch all clients
export const fetchUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/users");
      return response.data?.data ?? response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

// Async thunk to fetch all regional managers
export const fetchRMS = createAsyncThunk(
  "admin/fetchRMS",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/rms");
      return response.data?.data ?? response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch regional managers"
      );
    }
  }
);

// Async thunk to fetch all accountants
export const fetchAccountants = createAsyncThunk(
  "admin/fetchAccountants",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/accountants");
      return response.data?.data ?? response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch accountants"
      );
    }
  }
);

// Async thunk to fetch all categories
export const fetchAdminCategories = createAsyncThunk(
  "admin/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/categories");
      return response.data?.data ?? response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch categories"
      );
    }
  }
);

// Async thunk to fetch all services
export const fetchAdminServices = createAsyncThunk(
  "admin/fetchServices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/services");
      return response.data?.data ?? response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch services"
      );
    }
  }
);

// Async thunk to fetch all service applications
export const fetchAdminApplications = createAsyncThunk(
  "admin/fetchApplications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/service-applications");
      return response.data?.data ?? response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch applications"
      );
    }
  }
);

// Async thunk to fetch a single application detail
export const fetchAdminApplicationDetail = createAsyncThunk(
  "admin/fetchApplicationDetail",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/admin/service-applications/${id}`);
      return response.data?.data ?? response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch application details"
      );
    }
  }
);

// Async thunk to assign an accountant to an application
export const assignAccountantToApplication = createAsyncThunk(
  "admin/assignAccountant",
  async ({ applicationId, accountantId }: { applicationId: string, accountantId: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/admin/service-applications/${applicationId}/assign`, { 
        accountant_id: accountantId 
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign accountant"
      );
    }
  }
);


// Async thunk to fetch service application details
export const fetchServiceApplication = createAsyncThunk(
  "admin/fetchServiceApplication",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/admin/service-applications/${id}`);
      return response.data?.data ?? response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch service application"
      );
    }
  }
);

// Async thunk to update service application status
export const updateApplicationStatus = createAsyncThunk(
  "admin/updateApplicationStatus",
  async (
    {
      id,
      status,
      ca_notes,
      update_note,
      rejection_reason,
    }: {
      id: string | number;
      status: string;
      ca_notes?: string;
      update_note?: string;
      rejection_reason?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post(
        `/admin/service-applications/${id}/status`,
        {
          status,
          ca_notes,
          update_note,
          rejection_reason,
        }
      );
      return response.data?.data ?? response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update application status"
      );
    }
  }
);

// Async thunk to override service application status
export const overrideApplicationStatus = createAsyncThunk(
  "admin/overrideApplicationStatus",
  async (
    {
      id,
      status,
      override_reason,
    }: { id: string | number; status: string; override_reason?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.patch(
        `/admin/service-applications/${id}/override-status`,
        {
          status,
          override_reason,
        }
      );
      return response.data?.data ?? response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to override application status"
      );
    }
  }
);

// Async thunk to update document status
export const updateDocumentStatus = createAsyncThunk(
  "admin/updateDocumentStatus",
  async (
    {
      applicationId,
      docId,
      status,
      remark,
    }: {
      applicationId: string | number;
      docId: string | number;
      status: string;
      remark?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.patch(
        `/admin/service-applications/${applicationId}/documents/${docId}/status`,
        {
          status,
          remark,
        }
      );
      return response.data?.data ?? response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update document status"
      );
    }
  }
);

// Async thunk to upload document
export const uploadDocument = createAsyncThunk(
  "admin/uploadDocument",
  async (
    {
      applicationId,
      document,
      document_type,
      notes,
    }: {
      applicationId: string | number;
      document: File;
      document_type: string;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("document", document);
      formData.append("document_type", document_type);
      if (notes) {
        formData.append("notes", notes);
      }

      const response = await apiClient.post(
        `/admin/service-applications/${applicationId}/documents`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data?.data ?? response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.errors ||
          error.response?.data?.message ||
          "Failed to upload document"
      );
    }
  }
);

// Async thunk to delete document
export const deleteDocument = createAsyncThunk(
  "admin/deleteDocument",
  async (
    {
      applicationId,
      docId,
    }: { applicationId: string | number; docId: string | number },
    { rejectWithValue }
  ) => {
    try {
      await apiClient.delete(
        `/admin/service-applications/${applicationId}/documents/${docId}`
      );
      return { applicationId, docId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete document"
      );
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.actionError = null;
    },
    clearServiceApplication: (state) => {
      state.serviceApplication = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServiceApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceApplication.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceApplication = normalizeApplicationRecord(action.payload);
      })
      .addCase(fetchServiceApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateApplicationStatus.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const normalizedApplication = normalizeApplicationRecord(action.payload);
        state.serviceApplication = normalizedApplication;
        if (state.selectedApplication && state.selectedApplication.id === normalizedApplication.id) {
          state.selectedApplication = normalizedApplication;
        }
      })
      .addCase(updateApplicationStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      .addCase(overrideApplicationStatus.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(overrideApplicationStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const normalizedApplication = normalizeApplicationRecord(action.payload);
        state.serviceApplication = normalizedApplication;
        if (state.selectedApplication && state.selectedApplication.id === normalizedApplication.id) {
          state.selectedApplication = normalizedApplication;
        }
      })
      .addCase(overrideApplicationStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      .addCase(updateDocumentStatus.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateDocumentStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const normalizedDocument = normalizeApplicationDocumentRecord(action.payload);
        const updateDocs = (item: any) => {
          if (!item) return;
          item.request_documents = (item.request_documents || []).map((doc: any) =>
            doc.id === normalizedDocument.id ? normalizedDocument : doc
          );
        };
        updateDocs(state.serviceApplication);
        updateDocs(state.selectedApplication);
      })
      .addCase(updateDocumentStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      .addCase(uploadDocument.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.actionLoading = false;
        const normalizedDocument = normalizeApplicationDocumentRecord(action.payload);
        const addDoc = (item: any) => {
          if (!item) return;
          if (!item.request_documents) item.request_documents = [];
          item.request_documents.push(normalizedDocument);
        };
        addDoc(state.serviceApplication);
        addDoc(state.selectedApplication);
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      .addCase(deleteDocument.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action: any) => {
        state.actionLoading = false;
        const removeDoc = (item: any) => {
          if (!item) return;
          item.request_documents = (item.request_documents || []).filter(
            (doc: any) => doc.id !== action.payload.docId
          );
        };
        removeDoc(state.serviceApplication);
        removeDoc(state.selectedApplication);
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      // Dashboard Stats
      .addCase(fetchAdminStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, (state) => {
        state.statsLoading = false;
      })
      // Recent Activity
      .addCase(fetchRecentActivity.pending, (state) => {
        state.activityLoading = true;
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.activityLoading = false;
        state.recentActivity = action.payload || [];
      })
      .addCase(fetchRecentActivity.rejected, (state) => {
        state.activityLoading = false;
      })
      // Users
      .addCase(fetchUsers.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload || [];
      })
      .addCase(fetchUsers.rejected, (state) => {
        state.usersLoading = false;
      })
      // RMS
      .addCase(fetchRMS.fulfilled, (state, action) => {
        state.rms = action.payload || [];
      })
      // Accountants
      .addCase(fetchAccountants.fulfilled, (state, action) => {
        state.accountants = action.payload || [];
      })
      // Categories
      .addCase(fetchAdminCategories.pending, (state) => {
        state.catalogLoading = true;
      })
      .addCase(fetchAdminCategories.fulfilled, (state, action) => {
        state.catalogLoading = false;
        state.categories = action.payload || [];
      })
      .addCase(fetchAdminCategories.rejected, (state) => {
        state.catalogLoading = false;
      })
      // Services
      .addCase(fetchAdminServices.pending, (state) => {
        state.catalogLoading = true;
      })
      .addCase(fetchAdminServices.fulfilled, (state, action) => {
        state.catalogLoading = false;
        state.services = action.payload || [];
      })
      .addCase(fetchAdminServices.rejected, (state) => {
        state.catalogLoading = false;
      })
      // Applications
      .addCase(fetchAdminApplications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.applications = sortApplicationsLatestFirst(
          (action.payload || []).map(normalizeApplicationRecord),
        );
      })
      .addCase(fetchAdminApplications.rejected, (state) => {
        state.loading = false;
      })
      // Single Application
      .addCase(fetchAdminApplicationDetail.fulfilled, (state, action) => {
        state.selectedApplication = normalizeApplicationRecord(action.payload);
      });
  },
});

export const { clearError, clearServiceApplication } = adminSlice.actions;
export const adminReducer = adminSlice.reducer;
