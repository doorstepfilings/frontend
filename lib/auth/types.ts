export enum AccountantType {
  Salaried = "salaried",
  Enterprise = "enterprise",
}

type RelationshipManagerSummary = {
  id?: number;
  name?: string;
  email?: string | null;
  mobile_number?: string | null;
  rm_unique_id?: string | null;
};

export type AuthUser = {
  id?: number | string;
  user_id?: number;
  name?: string;
  email?: string;
  role?: string;
  accountant_type?: AccountantType | null;
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
  relationship_manager?: RelationshipManagerSummary | null;
  regional_manager?: RelationshipManagerSummary | null;
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
  code?: string;
  data?: BackendAuthPayload;
  message?: string | string[];
};
