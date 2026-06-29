"use client";

import { getDefaultRedirectPath as resolveDefaultRedirectPath } from "@/lib/auth/redirects";
import type { Session } from "next-auth";
import type { AuthUser } from "@/lib/auth/types";

export type { AuthUser } from "@/lib/auth/types";

const AUTH_BASE_PATH = "/api/auth";
const USER_OVERRIDE_KEY = "dsf_user_override";
const AUTH_EVENT = "dsf-auth-change";
const AUTH_FETCH_TIMEOUT_MS = 5000;
const SESSION_CACHE_TTL_MS = 5000;

type CsrfResponse = {
  csrfToken?: string;
};

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

function broadcastSessionChange(trigger: string) {
  if (!isBrowser() || typeof BroadcastChannel === "undefined") {
    return;
  }

  const channel = new BroadcastChannel("next-auth");
  channel.postMessage({ event: "session", data: { trigger } });
  channel.close();
}

let cachedUserOverride: AuthUser | null = null;
let lastRawValue: string | null = null;
let cachedSession: Session | null = null;
let cachedSessionExpiresAt = 0;
let sessionRequest: Promise<Session | null> | null = null;
let sessionExpiryRedirecting = false;
let sessionExpiryRedirectPromise: Promise<void> | null = null;

function clearSessionCache() {
  cachedSession = null;
  cachedSessionExpiresAt = 0;
  sessionRequest = null;
}

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

async function fetchAuthJson<T>(path: string, init: RequestInit = {}) {
  if (!isBrowser()) {
    return null;
  }

  try {
    const headers = new Headers(init.headers);
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), AUTH_FETCH_TIMEOUT_MS);

    const response = await fetch(`${AUTH_BASE_PATH}/${path}`, {
      ...init,
      headers,
      credentials: "same-origin",
      cache: "no-store",
      signal: init.signal ?? controller.signal,
    }).finally(() => {
      window.clearTimeout(timeoutId);
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json().catch(() => null)) as T | null;
  } catch {
    return null;
  }
}

async function readSession(): Promise<Session | null> {
  const now = Date.now();

  if (cachedSessionExpiresAt > now) {
    return cachedSession;
  }

  if (sessionRequest) {
    return sessionRequest;
  }

  sessionRequest = fetchAuthJson<Session>("session")
    .then((session) => {
      cachedSession = session;
      cachedSessionExpiresAt = Date.now() + SESSION_CACHE_TTL_MS;
      return session;
    })
    .finally(() => {
      sessionRequest = null;
    });

  return sessionRequest;
}

async function requestSignOut() {
  const csrf = await fetchAuthJson<CsrfResponse>("csrf");
  if (!csrf?.csrfToken || !isBrowser()) {
    return;
  }

  try {
    const headers = new Headers();
    headers.set("Content-Type", "application/x-www-form-urlencoded");
    headers.set("X-Auth-Return-Redirect", "1");

    await fetch(`${AUTH_BASE_PATH}/signout`, {
      method: "POST",
      headers,
      credentials: "same-origin",
      body: new URLSearchParams({
        csrfToken: csrf.csrfToken,
        callbackUrl: window.location.href,
      }),
    });
  } catch {
    return;
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
  clearSessionCache();
  emitAuthChange();
}

export async function getStoredToken() {
  const session = await readSession();
  return session?.accessToken ?? null;
}

export async function getStoredUser() {
  const session = await readSession();
  return mergeAuthUsers(session?.user ?? null, readUserOverride());
}

export async function clearStoredAuth() {
  clearStoredUserOverride();
  await requestSignOut();
  clearSessionCache();
  broadcastSessionChange("signout");
}

export function getSessionExpiryRedirecting() {
  return sessionExpiryRedirecting;
}

export function redirectExpiredSessionToHome() {
  if (!isBrowser()) {
    return Promise.resolve();
  }

  if (sessionExpiryRedirectPromise) {
    return sessionExpiryRedirectPromise;
  }

  sessionExpiryRedirecting = true;
  emitAuthChange();

  sessionExpiryRedirectPromise = clearStoredAuth().finally(() => {
    window.location.replace("/");
  });

  return sessionExpiryRedirectPromise;
}

export function setStoredUser(user: AuthUser) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(USER_OVERRIDE_KEY, JSON.stringify(user));
  clearSessionCache();
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
