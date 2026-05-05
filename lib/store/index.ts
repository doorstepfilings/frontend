import { configureStore } from "@reduxjs/toolkit";
import { servicesReducer } from "@/lib/features/services/services-slice";
import { adminReducer } from "@/lib/features/admin/admin-slice";
import { authReducer } from "@/lib/features/auth/auth-slice";
import accountantReducer from "@/lib/features/accountant/accountant-slice";

export const store = configureStore({
  reducer: {
    services: servicesReducer,
    admin: adminReducer,
    auth: authReducer,
    accountant: accountantReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
