export type AuthUser = {
  id?: number | string;
  user_id?: number;
  name?: string;
  email?: string;
  role?: string;
  mobile_number?: string;
  referral_code?: string | null;
  rm_id?: number | null;
  accountant_id?: number | null;
  rm_unique_id?: string | null;
  accountant_unique_id?: string | null;
  is_mobile_verified?: boolean;
  address?: string;
  city?: string;
  state?: string;
  pincode?: number | string;
  regional_manager?: {
    id?: number;
    name?: string;
    email?: string | null;
    mobile_number?: string | null;
    rm_unique_id?: string | null;
  } | null;
  accountant?: {
    id?: number;
    name?: string;
    email?: string | null;
    mobile_number?: string | null;
    accountant_unique_id?: string | null;
  } | null;
  [key: string]: unknown;
};

export type BackendAuthPayload = {
  token?: string;
  user?: AuthUser;
};

export type BackendAuthResponse = {
  data?: BackendAuthPayload;
  message?: string | string[];
};
