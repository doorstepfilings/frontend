import type { AuthUser } from "@/lib/auth/types";

export type User = AuthUser & {
  id: number;
  name: string;
  email: string;
  role: string;
  mobile_number?: string;
  avatar?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string | number;
};

export type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
};

export type AuthResponse = {
  user: User;
  token: string;
};
