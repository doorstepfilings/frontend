"use client";

import { getSession, signIn } from "next-auth/react";
import { apiClient } from "@/lib/api/client";
import type { AuthUser } from "@/lib/auth/types";
import type { User } from "@/lib/features/auth/types";
import { clearStoredUserOverride } from "@/lib/auth/storage";
import { appConfig } from "@/lib/config";

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
  let session = await getSession();
  let user = session?.user;
  let token = session?.accessToken;

  if (!user || !token) {
    // Retry up to 5 times with a 250ms delay to allow NextAuth cookie synchronization
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      session = await getSession();
      user = session?.user;
      token = session?.accessToken;
      if (user && token) {
        break;
      }
    }
  }

  if (!user || !token) {
    throw new Error("We couldn't load your account session. Please check your internet connection and try logging in again.");
  }

  clearStoredUserOverride();

  return { token, user: normalizeSignedInUser(user) };
}

function getCredentialErrorMessage(result: { error?: string; code?: string } | undefined, fallback: string) {
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
  // Call backend directly to get detailed error messages
  const response = await fetch(`${appConfig.backendUrl}/api/user/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = payload?.message;
    const formattedMsg = Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg;
    throw new Error(formattedMsg ?? "Invalid email or password.");
  }

  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
    redirectTo: redirectTo ?? undefined,
  });

  if (!result?.ok) {
    throw new Error(
      getCredentialErrorMessage(result, "Incorrect credentials. Please try again."),
    );
  }

  return resolveSessionAfterSignIn();
}

export async function signInWithMobileOtp({
  mobile_number,
  otp,
  redirectTo,
}: MobileOtpLoginInput): Promise<AuthResult> {
  // Call backend directly to get detailed error messages
  const response = await fetch(`${appConfig.backendUrl}/api/user/login-with-mobile`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mobile_number, otp }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = payload?.message;
    const formattedMsg = Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg;
    throw new Error(formattedMsg ?? "Invalid mobile number or OTP.");
  }

  const result = await signIn("mobile-otp", {
    mobile_number,
    otp,
    redirect: false,
    redirectTo: redirectTo ?? undefined,
  });

  if (!result?.ok) {
    throw new Error(
      getCredentialErrorMessage(result, "Incorrect mobile number or OTP. Please try again."),
    );
  }

  return resolveSessionAfterSignIn();
}

export async function registerAndSignIn(data: RegisterInput) {
  const payload = buildRegisterPayload(data);

  await apiClient.post("/user/register", payload);

  return signInWithPassword({
    email: payload.email,
    password: payload.password,
  });
}
