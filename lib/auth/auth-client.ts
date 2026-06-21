"use client";

import { getSession, signIn } from "next-auth/react";
import { apiClient } from "@/lib/api/client";
import type { AuthUser } from "@/lib/auth/types";
import type { User } from "@/lib/features/auth/types";
import { clearStoredUserOverride } from "@/lib/auth/storage";
import {
  AUTH_ERROR_CODES,
  AUTH_ERROR_MESSAGES,
  getFriendlyAuthErrorMessage,
  logAuthError,
} from "./error-helper";

type AuthResult = {
  token: string;
  user: User;
};

type PasswordLoginInput = {
  email: string;
  password: string;
  redirectTo?: string | null;
};

type MobileOtpLoginInput = {
  mobile_number: string;
  otp: string;
  redirectTo?: string | null;
};

type RegisterInput = {
  name?: string;
  email: string;
  mobile_number?: string;
  password: string;
  referral_code?: string;
  rm_id?: string;
  role?: string;
  dial_code?: string;
  country_iso?: string;
  password_confirmation?: string;
  [key: string]: unknown;
};

type RegisterPayload = {
  name: string;
  email: string;
  mobile_number: string;
  password: string;
  referral_code?: string;
  rm_id?: string;
  role?: string;
};

type CredentialSignInResult = {
  error?: string;
  code?: string;
  ok?: boolean;
};

function normalizeSignedInUser(user: AuthUser): User {
  return {
    ...user,
    id: Number(user.id ?? user.user_id ?? 0),
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.role ?? "user",
    mobile_number: user.mobile_number ?? undefined,
    address: user.address ?? undefined,
    city: user.city ?? undefined,
    state: user.state ?? undefined,
    pincode: user.pincode ?? undefined,
  };
}

async function resolveSessionAfterSignIn() {
  const session = await getSession();
  const user = session?.user;
  const token = session?.accessToken;

  if (!user || !token) {
    throw new Error(AUTH_ERROR_CODES.LOGIN_FAILED);
  }

  clearStoredUserOverride();

  return { token, user: normalizeSignedInUser(user) };
}

function getCredentialErrorMessage(
  result: CredentialSignInResult | undefined,
  fallback: string,
) {
  if (result?.code && result.code !== "credentials") {
    return result.code;
  }

  if (result?.code === "credentials" || result?.error === "CredentialsSignin") {
    return fallback;
  }

  return result?.error ?? fallback;
}

function buildRegisterPayload(data: RegisterInput): RegisterPayload {
  return {
    name: String(data.name ?? "").trim(),
    email: String(data.email ?? "").trim().toLowerCase(),
    mobile_number: String(data.mobile_number ?? "").trim(),
    password: String(data.password ?? ""),
    ...(data.referral_code ? { referral_code: String(data.referral_code).trim() } : {}),
    ...(data.rm_id ? { rm_id: String(data.rm_id).trim() } : {}),
    ...(data.role ? { role: String(data.role).trim() } : {}),
  };
}

export async function signInWithPassword({
  email,
  password,
  redirectTo,
}: PasswordLoginInput): Promise<AuthResult> {
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo: redirectTo ?? undefined,
    });

    // Auth.js credential failures can arrive in a successful HTTP response.
    // Check its parsed error before trying to resolve the new session.
    if (result?.error || !result?.ok) {
      const rawError = getCredentialErrorMessage(
        result,
        AUTH_ERROR_CODES.INVALID_CREDENTIALS,
      );
      throw new Error(rawError);
    }

    return await resolveSessionAfterSignIn();
  } catch (error: unknown) {
    logAuthError("Password sign-in failed", error);
    throw new Error(getFriendlyAuthErrorMessage(error, AUTH_ERROR_MESSAGES.LOGIN_FAILED));
  }
}

export async function signInWithMobileOtp({
  mobile_number,
  otp,
  redirectTo,
}: MobileOtpLoginInput): Promise<AuthResult> {
  try {
    const result = await signIn("mobile-otp", {
      mobile_number,
      otp,
      redirect: false,
      redirectTo: redirectTo ?? undefined,
    });

    if (result?.error || !result?.ok) {
      const rawError = getCredentialErrorMessage(
        result,
        AUTH_ERROR_CODES.INVALID_VERIFICATION_CODE,
      );
      throw new Error(rawError);
    }

    return await resolveSessionAfterSignIn();
  } catch (error: unknown) {
    logAuthError("Mobile sign-in failed", error);
    throw new Error(getFriendlyAuthErrorMessage(error, AUTH_ERROR_MESSAGES.LOGIN_FAILED));
  }
}

export async function registerAndSignIn(data: RegisterInput) {
  const payload = buildRegisterPayload(data);

  try {
    await apiClient.post("/user/register", payload);
  } catch (error: unknown) {
    logAuthError("Registration request failed", error);
    throw new Error(getFriendlyAuthErrorMessage(error, AUTH_ERROR_MESSAGES.GENERIC));
  }

  return signInWithPassword({
    email: payload.email,
    password: payload.password,
  });
}
