import axios from "axios";
import {
  getStoredToken,
  redirectExpiredSessionToHome,
} from "@/lib/auth/storage";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const headers = error?.config?.headers;
    const authorizationHeader =
      typeof headers?.get === "function"
        ? headers.get("Authorization")
        : headers?.Authorization;

    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      Boolean(authorizationHeader) &&
      window.location.pathname !== "/"
    ) {
      void redirectExpiredSessionToHome();
    }

    return Promise.reject(error);
  },
);
