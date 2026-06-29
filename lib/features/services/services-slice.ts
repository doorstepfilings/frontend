import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { apiClient } from "@/lib/api/client";
import type {
  ServiceCategory,
  ServiceItem,
  ServicesState,
} from "@/lib/features/services/types";

const initialState: ServicesState = {
  items: [],
  serviceDetails: null,
  cart: [],
  myServices: [],
  myOrders: [],
  status: "idle",
  loading: false,
  cartLoading: false,
  applyLoading: false,
  ordersLoading: false,
  paymentLoading: false,
  error: null,
  cartError: null,
  applyError: null,
  ordersError: null,
  paymentError: null,
  applySuccess: false,
  paymentSuccess: false,
};

async function readBlobErrorMessage(blob: Blob) {
  try {
    const text = await blob.text();
    const parsed = JSON.parse(text);
    return parsed?.error || parsed?.message || null;
  } catch {
    return null;
  }
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data && typeof data === "object") {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }

    const errorMessage = (data as { error?: unknown }).error;
    if (typeof errorMessage === "string" && errorMessage.trim()) {
      return errorMessage;
    }
  }

  return fallback;
}

function canFallbackDocumentApproval(error: unknown) {
  if (!isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  return status === 404 || status === 405 || status === 422;
}

export const fetchServices = createAsyncThunk<
  ServiceCategory[],
  void,
  { rejectValue: string; state: { services: ServicesState } }
>(
  "services/fetchServices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/services", {
        skipAuth: true,
        timeout: 8000,
      });
      return response.data?.data ?? [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch services");
    }
  },
  {
    condition: (_, { getState }) => {
      const { items, status } = getState().services;
      return status !== "loading" && (status !== "succeeded" || items.length === 0);
    },
  },
);

export const fetchServiceDetails = createAsyncThunk<
  ServiceItem,
  string,
  { rejectValue: string }
>("services/fetchServiceDetails", async (slug, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`/service/${slug}`);
    return response.data?.data ?? response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return rejectWithValue("Service not found.");
    }
    return rejectWithValue(error.response?.data?.message || "Failed to fetch service details");
  }
});

export const addToCart = createAsyncThunk<
  any,
  number | string,
  { rejectValue: string }
>("services/addToCart", async (serviceId, { rejectWithValue }) => {
  try {
    const response = await apiClient.post("/service/cart/add", {
      service_id: serviceId,
    });
    return response.data;
  } catch (error: any) {
    if (
      error.response?.status === 422 &&
      error.response?.data?.message === "Service already in cart"
    ) {
      return { success: true, message: "Service already in cart", data: null };
    }
    return rejectWithValue(error.response?.data?.message || "Failed to add to cart");
  }
});

export const applyForService = createAsyncThunk<
  any,
  FormData,
  { rejectValue: any }
>("services/applyForService", async (formData, { rejectWithValue }) => {
  try {
    const response = await apiClient.post("/service/apply", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.errors ||
        error.response?.data?.message ||
        "Failed to submit application"
    );
  }
});

export const fetchMyServices = createAsyncThunk<
  any[],
  void,
  { rejectValue: string }
>("services/fetchMyServices", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/service/my-services");
    return response.data?.data ?? [];
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch your services");
  }
});

export const fetchMyOrders = createAsyncThunk<
  any[],
  void,
  { rejectValue: string }
>("services/fetchMyOrders", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/user/orders");
    return response.data?.data ?? [];
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch your orders");
  }
});

export const deleteMyService = createAsyncThunk<
  number | string,
  number | string,
  { rejectValue: string }
>("services/deleteMyService", async (id, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/service/my-services/${id}`);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to remove your service");
  }
});

export const uploadMyDocuments = createAsyncThunk<
  any,
  { id: number | string; formData: FormData },
  { rejectValue: string }
>("services/uploadMyDocuments", async ({ id, formData }, { rejectWithValue }) => {
  try {
    const response = await apiClient.post(`/service/my-services/${id}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to upload documents");
  }
});

export const deleteMyDocument = createAsyncThunk<
  { serviceId: number | string; docId: number | string },
  { serviceId: number | string; docId: number | string },
  { rejectValue: string }
>("services/deleteMyDocument", async ({ serviceId, docId }, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/service/my-services/${serviceId}/documents/${docId}`);
    return { serviceId, docId };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to delete document");
  }
});

export const respondToDocumentApproval = createAsyncThunk<
  unknown,
  {
    serviceId: number | string;
    docId: number | string;
    action: "approved" | "correction";
    note?: string;
  },
  { rejectValue: string }
>(
  "services/respondToDocumentApproval",
  async ({ serviceId, docId, action, note }, { rejectWithValue }) => {
    const normalizedNote = note?.trim();
    const approvalStatus = action === "approved" ? "approved" : "correction_requested";
    const documentStatus = action === "approved" ? "approved" : "rejected";
    const approvalPayload = {
      action,
      status: approvalStatus,
      client_approval_status: approvalStatus,
      ...(normalizedNote ? { note: normalizedNote, correction_note: normalizedNote } : {}),
    };
    const statusPayload = {
      status: documentStatus,
      ...(normalizedNote ? { note: normalizedNote, remark: normalizedNote } : {}),
    };
    const fallbackRequests = [
      () =>
        apiClient.patch(
          `/service/my-services/${serviceId}/documents/${docId}/status`,
          statusPayload,
        ),
      () =>
        apiClient.post(
          `/service/my-services/${serviceId}/documents/${docId}/status`,
          statusPayload,
        ),
      () =>
        apiClient.patch(
          `/service/my-services/${serviceId}/documents/${docId}`,
          approvalPayload,
        ),
    ];

    try {
      const response = await apiClient.patch(
        `/service/my-services/${serviceId}/documents/${docId}/client-approval`,
        approvalPayload,
      );
      return response.data?.data ?? response.data;
    } catch (error: unknown) {
      if (!canFallbackDocumentApproval(error)) {
        return rejectWithValue(getApiErrorMessage(error, "Failed to update document approval"));
      }

      let lastError: unknown = error;

      for (const request of fallbackRequests) {
        try {
          const response = await request();
          return response.data?.data ?? response.data;
        } catch (fallbackError) {
          lastError = fallbackError;
          if (!canFallbackDocumentApproval(fallbackError)) {
            break;
          }
        }
      }

      return rejectWithValue(
        getApiErrorMessage(lastError, "Failed to update document approval"),
      );
    }
  },
);

export const downloadInvoice = createAsyncThunk<
  Blob,
  number | string,
  { rejectValue: string }
>("services/downloadInvoice", async (orderId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`/payments/my-orders/${orderId}/invoice`, {
      responseType: "blob",
      headers: {
        Accept: "application/pdf",
      },
    });

    const contentType = String(response.headers?.["content-type"] || "");
    if (!contentType.includes("application/pdf")) {
      const message =
        response.data instanceof Blob
          ? await readBlobErrorMessage(response.data)
          : null;

      return rejectWithValue(message || "Failed to download invoice");
    }

    return response.data;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      if (error.response?.data instanceof Blob) {
        const message = await readBlobErrorMessage(error.response.data);
        return rejectWithValue(message || "Failed to download invoice");
      }

      return rejectWithValue(
        (error.response?.data as { message?: string } | undefined)?.message ||
          "Failed to download invoice",
      );
    }

    return rejectWithValue("Failed to download invoice");
  }
});

export const fetchCart = createAsyncThunk<
  any[],
  void,
  { rejectValue: string }
>("services/fetchCart", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/service/cart");
    return response.data?.data ?? [];
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch cart");
  }
});

export const removeFromCart = createAsyncThunk<
  number | string,
  number | string,
  { rejectValue: string }
>("services/removeFromCart", async (id, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/service/cart/${id}`);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to remove from cart");
  }
});

export const createRazorpayOrder = createAsyncThunk<
  any,
  any[],
  { rejectValue: string }
>("services/createRazorpayOrder", async (serviceIds, { rejectWithValue }) => {
  try {
    const response = await apiClient.post("/payments/razorpay/order", { service_ids: serviceIds });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to create payment order");
  }
});

export const createRazorpaySingleOrder = createAsyncThunk<
  any,
  number | string,
  { rejectValue: string }
>("services/createRazorpaySingleOrder", async (userServiceId, { rejectWithValue }) => {
  try {
    const response = await apiClient.post("/payments/razorpay/order-single", { user_service_id: userServiceId });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to create payment order");
  }
});

export const verifyRazorpayPayment = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>("services/verifyRazorpayPayment", async (payload, { rejectWithValue }) => {
  try {
    const response = await apiClient.post("/payments/razorpay/verify", payload);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Payment verification failed");
  }
});

const servicesSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    clearServiceDetails: (state) => {
      state.serviceDetails = null;
    },
    clearApplyStatus: (state) => {
      state.applySuccess = false;
      state.applyError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchServiceDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceDetails = action.payload;
      })
      .addCase(fetchServiceDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addToCart.pending, (state) => {
        state.cartLoading = true;
        state.cartError = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.cartLoading = false;
        if (action.payload?.cart_item) {
          state.cart.push(action.payload.cart_item);
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.cartLoading = false;
        state.cartError = action.payload as string;
      })
      .addCase(applyForService.pending, (state) => {
        state.applyLoading = true;
        state.applyError = null;
        state.applySuccess = false;
      })
      .addCase(applyForService.fulfilled, (state) => {
        state.applyLoading = false;
        state.applySuccess = true;
      })
      .addCase(applyForService.rejected, (state, action) => {
        state.applyLoading = false;
        state.applyError = action.payload;
        state.applySuccess = false;
      })
      .addCase(fetchMyServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyServices.fulfilled, (state, action) => {
        state.loading = false;
        state.myServices = action.payload;
      })
      .addCase(fetchMyServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMyOrders.pending, (state) => {
        state.ordersLoading = true;
        state.ordersError = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        state.myOrders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.ordersLoading = false;
        state.ordersError = action.payload as string;
      })
      .addCase(deleteMyService.pending, (state) => {
        state.applyLoading = true;
        state.applyError = null;
      })
      .addCase(deleteMyService.fulfilled, (state, action) => {
        state.applyLoading = false;
        state.myServices = state.myServices.filter(
          (service) => String(service.id) !== String(action.payload),
        );
      })
      .addCase(deleteMyService.rejected, (state, action) => {
        state.applyLoading = false;
        state.applyError = action.payload as string;
      })
      .addCase(uploadMyDocuments.pending, (state) => {
        state.applyLoading = true;
        state.applyError = null;
      })
      .addCase(uploadMyDocuments.fulfilled, (state) => {
        state.applyLoading = false;
      })
      .addCase(uploadMyDocuments.rejected, (state, action) => {
        state.applyLoading = false;
        state.applyError = action.payload as string;
      })
      .addCase(deleteMyDocument.pending, (state) => {
        state.applyLoading = true;
        state.applyError = null;
      })
      .addCase(deleteMyDocument.fulfilled, (state, action) => {
        state.applyLoading = false;
        const service = state.myServices.find(s => String(s.id) === String(action.payload.serviceId));
        if (service && service.request_documents) {
          service.request_documents = service.request_documents.filter((d: any) => String(d.id) !== String(action.payload.docId));
        }
      })
      .addCase(deleteMyDocument.rejected, (state, action) => {
        state.applyLoading = false;
        state.applyError = action.payload as string;
      })
      .addCase(respondToDocumentApproval.pending, (state) => {
        state.applyLoading = true;
        state.applyError = null;
      })
      .addCase(respondToDocumentApproval.fulfilled, (state) => {
        state.applyLoading = false;
      })
      .addCase(respondToDocumentApproval.rejected, (state, action) => {
        state.applyLoading = false;
        state.applyError = action.payload as string;
      })
      .addCase(fetchCart.pending, (state) => {
        state.cartLoading = true;
        state.cartError = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.cartLoading = false;
        state.cart = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.cartLoading = false;
        state.cartError = action.payload as string;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.cart = state.cart.filter(item => String(item.id) !== String(action.payload));
      })
      .addCase(verifyRazorpayPayment.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
        state.paymentSuccess = false;
      })
      .addCase(verifyRazorpayPayment.fulfilled, (state) => {
        state.paymentLoading = false;
        state.paymentSuccess = true;
      })
      .addCase(verifyRazorpayPayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload as string;
        state.paymentSuccess = false;
      });
  },
});

export const { clearServiceDetails, clearApplyStatus } = servicesSlice.actions;
export const servicesReducer = servicesSlice.reducer;
