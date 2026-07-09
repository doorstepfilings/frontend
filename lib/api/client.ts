import axios from "axios";
import {
  getStoredToken,
  redirectExpiredSessionToHome,
} from "@/lib/auth/storage";
import { parseApiError } from "@/lib/utils/error-parser";

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  if (config.skipAuth) {
    return config;
  }

  const token = await getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      window.location.pathname !== "/login" &&
      window.location.pathname !== "/"
    ) {
      void redirectExpiredSessionToHome();
    }

    // Safely parse and enrich error message dynamically so all consumers automatically receive it
    if (error && error.response && error.response.data) {
      const parsedMessage = parseApiError(error);
      if (parsedMessage && typeof error.response.data === "object") {
        error.response.data.message = parsedMessage;
      }
    }

    return Promise.reject(error);
  },
);
