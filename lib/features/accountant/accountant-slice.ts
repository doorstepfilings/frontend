import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "@/lib/api/client";

export interface AccountantState {
  serviceRequests: any[];
  assignedUsers: any[];
  stats: {
    newAssignments: number;
    ongoing: number;
    underReview: number;
    completed: number;
    totalClients: number;
    totalRequests: number;
    actionRequired: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: AccountantState = {
  serviceRequests: [],
  assignedUsers: [],
  stats: {
    newAssignments: 0,
    ongoing: 0,
    underReview: 0,
    completed: 0,
    totalClients: 0,
    totalRequests: 0,
    actionRequired: 0,
  },
  loading: false,
  error: null,
};

export const fetchAccountantDashboard = createAsyncThunk(
  "accountant/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const [requestsRes, usersRes] = await Promise.all([
        apiClient.get("/accountant/service-requests"),
        apiClient.get("/accountant/users"),
      ]);
      return {
        requests: requestsRes.data?.data || [],
        users: usersRes.data?.data || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch dashboard data");
    }
  }
);

const accountantSlice = createSlice({
  name: "accountant",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountantDashboard.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAccountantDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceRequests = action.payload.requests;
        state.assignedUsers = action.payload.users;
        
        // Calculate stats
        const reqs = action.payload.requests;
        state.stats = {
          newAssignments: reqs.filter((r: any) => r.status === "applied").length,
          ongoing: reqs.filter((r: any) => ["in_progress", "submitted_to_ca"].includes(r.status)).length,
          underReview: reqs.filter((r: any) => r.status === "under_review").length,
          completed: reqs.filter((r: any) => r.status === "completed" || r.status === "approved").length,
          totalClients: action.payload.users.length,
          totalRequests: reqs.length,
          actionRequired: reqs.filter((r: any) => r.status === "update_required").length,
        };
      })
      .addCase(fetchAccountantDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default accountantSlice.reducer;
