import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "@/lib/api/client";
import { AuthState, AuthResponse, User } from "./types";
import {
  clearStoredAuth,
  setStoredUser,
} from "@/lib/auth/storage";
import {
  registerAndSignIn,
  signInWithMobileOtp,
  signInWithPassword,
} from "@/lib/auth/auth-client";

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  status: "idle",
};

export const login = createAsyncThunk<
  AuthResponse,
  any,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    return await signInWithPassword(credentials);
  } catch (error: any) {
    return rejectWithValue(
      error?.message || "Login failed. Please check your credentials."
    );
  }
});

export const loginWithMobile = createAsyncThunk<
  AuthResponse,
  { mobile_number: string; otp: string },
  { rejectValue: string }
>("auth/loginWithMobile", async (data, { rejectWithValue }) => {
  try {
    return await signInWithMobileOtp(data);
  } catch (error: any) {
    return rejectWithValue(
      error?.message || "OTP verification failed."
    );
  }
});

export const register = createAsyncThunk<
  AuthResponse,
  any,
  { rejectValue: string }
>("auth/register", async (userData, { rejectWithValue }) => {
  try {
    return await registerAndSignIn(userData);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error?.message || "Registration failed. Please try again."
    );
  }
});

export const logout = createAsyncThunk(
  "auth/logout",
  async () => {
    try {
      await apiClient.post("/user/logout");
    } catch {
      // Ignore logout errors
    } finally {
      await clearStoredAuth();
    }
    return null;
  }
);

export const updateProfile = createAsyncThunk<
  User,
  Partial<User>,
  { rejectValue: string }
>("auth/updateProfile", async (data, { rejectWithValue }) => {
  try {
    const response = await apiClient.put("/user/profile", data);
    const updatedUser = response.data.data || response.data;
    setStoredUser(updatedUser);
    return updatedUser;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to update profile.");
  }
});

export const changePassword = createAsyncThunk<
  void,
  any,
  { rejectValue: string }
>("auth/changePassword", async (data, { rejectWithValue }) => {
  try {
    await apiClient.post("/user/change-password", data);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to change password.");
  }
});

export const searchRM = createAsyncThunk<
  any,
  string,
  { rejectValue: string }
>("auth/searchRM", async (rmUniqueId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get("/user/search-rm", {
        params: { rm_unique_id: rmUniqueId }
    });
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Regional Manager not found.");
  }
});

export const connectRM = createAsyncThunk<
  User,
  string,
  { rejectValue: string }
>("auth/connectRM", async (rmUniqueId, { rejectWithValue }) => {
  try {
    const response = await apiClient.post("/user/connect-rm", { rm_unique_id: rmUniqueId });
    const updatedUser = response.data.data;
    setStoredUser(updatedUser);
    return updatedUser;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to connect to Regional Manager.");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      if (action.payload) {
          setStoredUser(action.payload);
      } else {
          clearStoredAuth();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.status = "loading";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.status = "succeeded";
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.status = "failed";
      })
      .addCase(loginWithMobile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.status = "loading";
      })
      .addCase(loginWithMobile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.status = "succeeded";
      })
      .addCase(loginWithMobile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.status = "failed";
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.status = "loading";
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.status = "succeeded";
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.status = "failed";
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.status = "idle";
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(connectRM.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export const authReducer = authSlice.reducer;
