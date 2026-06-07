"use client";

import { getSession, signOut } from "next-auth/react";
import { getDefaultRedirectPath as resolveDefaultRedirectPath } from "@/lib/auth/redirects";
import type { AuthUser } from "@/lib/auth/types";

export type { AuthUser } from "@/lib/auth/types";

const USER_OVERRIDE_KEY = "dsf_user_override";
const AUTH_EVENT = "dsf-auth-change";

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeStoredValue(value: string | null) {
  if (!value || value === "undefined" || value === "null") {
    return null;
  }

  return value;
}

function emitAuthChange() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_EVENT));
}

let cachedUserOverride: AuthUser | null = null;
let lastRawValue: string | null = null;

function readUserOverride() {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = normalizeStoredValue(window.localStorage.getItem(USER_OVERRIDE_KEY));
  if (!rawValue) {
    lastRawValue = null;
    cachedUserOverride = null;
    return null;
  }

  if (rawValue === lastRawValue) {
    return cachedUserOverride;
  }

  try {
    cachedUserOverride = JSON.parse(rawValue) as AuthUser;
    lastRawValue = rawValue;
    return cachedUserOverride;
  } catch {
    lastRawValue = rawValue;
    cachedUserOverride = null;
    return null;
  }
}

export function mergeAuthUsers(baseUser: AuthUser | null, overrideUser: AuthUser | null) {
  if (!baseUser) {
    return null;
  }

  if (!overrideUser) {
    return baseUser;
  }

  const baseIdentifier = baseUser.id ?? baseUser.user_id ?? baseUser.email;
  const overrideIdentifier = overrideUser.id ?? overrideUser.user_id ?? overrideUser.email;

  if (baseIdentifier && overrideIdentifier && String(baseIdentifier) !== String(overrideIdentifier)) {
    return baseUser;
  }

  return {
    ...baseUser,
    ...overrideUser,
  };
}

export function getStoredUserOverride() {
  return readUserOverride();
}

export function clearStoredUserOverride() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(USER_OVERRIDE_KEY);
  emitAuthChange();
}

export async function getStoredToken() {
  const session = await getSession();
  return session?.accessToken ?? null;
}

export async function getStoredUser() {
  const session = await getSession();
  return mergeAuthUsers(session?.user ?? null, readUserOverride());
}

export async function clearStoredAuth() {
  clearStoredUserOverride();
  await signOut({ redirect: false });
}

export function setStoredUser(user: AuthUser) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(USER_OVERRIDE_KEY, JSON.stringify(user));
  emitAuthChange();
}

export function getDefaultRedirectPath(user: AuthUser | null) {
  return resolveDefaultRedirectPath(user);
}

export function subscribeToAuth(callback: () => void) {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener(AUTH_EVENT, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(AUTH_EVENT, handler);
  };
}
