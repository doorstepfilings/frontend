"use client";

import { useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import type { AuthUser } from "@/lib/auth/types";
import {
  getSessionExpiryRedirecting,
  getStoredUserOverride,
  mergeAuthUsers,
  subscribeToAuth,
} from "@/lib/auth/storage";

export function useStoredSession() {
  const { data, status } = useSession();
  const overrideUser = useSyncExternalStore(subscribeToAuth, getStoredUserOverride, () => null);
  const user = mergeAuthUsers(data?.user ?? null, overrideUser);

  return {
    status,
    token: data?.accessToken ?? null,
    user,
  };
}

export function useStoredUser() {
  return useStoredSession().user as null | AuthUser;
}

export function useStoredToken() {
  return useStoredSession().token;
}

export function useAuthStatus() {
  return useStoredSession().status;
}

export function useSessionExpiryRedirecting() {
  return useSyncExternalStore(
    subscribeToAuth,
    getSessionExpiryRedirecting,
    () => false,
  );
}
