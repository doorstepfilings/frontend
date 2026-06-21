export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Please check your email and password.",
  EMAIL_NOT_FOUND: "Email not found. Please try again.",
  INCORRECT_PASSWORD: "Incorrect password. Please try again.",
  ACCOUNT_NOT_FOUND: "Account not found.",
  ACCOUNT_INACTIVE: "Your account is inactive. Please contact support.",
  ACCESS_DENIED: "You do not have permission to access this area.",
  LOGIN_FAILED: "Login failed. Please try again.",
  NETWORK_ERROR: "Unable to connect. Please check your internet connection and try again.",
  GENERIC: "Something went wrong. Please try again.",
  INVALID_VERIFICATION_CODE: "The verification code is incorrect.",
  VERIFICATION_CODE_EXPIRED: "The verification code has expired. Please request a new one.",
} as const;

export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_NOT_FOUND: "EMAIL_NOT_FOUND",
  INCORRECT_PASSWORD: "INCORRECT_PASSWORD",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  ACCOUNTANT_NOT_FOUND: "ACCOUNTANT_NOT_FOUND",
  ACCOUNT_INACTIVE: "ACCOUNT_INACTIVE",
  ACCESS_DENIED: "ACCESS_DENIED",
  LOGIN_FAILED: "LOGIN_FAILED",
  NETWORK_ERROR: "NETWORK_ERROR",
  GENERIC: "GENERIC",
  INVALID_VERIFICATION_CODE: "INVALID_VERIFICATION_CODE",
  VERIFICATION_CODE_EXPIRED: "VERIFICATION_CODE_EXPIRED",
} as const;

type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
type AuthErrorMessage = (typeof AUTH_ERROR_MESSAGES)[keyof typeof AUTH_ERROR_MESSAGES];

const APPROVED_AUTH_MESSAGES = new Set<string>(Object.values(AUTH_ERROR_MESSAGES));

function getCodeForApprovedMessage(message: string): AuthErrorCode | null {
  switch (message) {
    case AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS:
      return AUTH_ERROR_CODES.INVALID_CREDENTIALS;
    case AUTH_ERROR_MESSAGES.EMAIL_NOT_FOUND:
      return AUTH_ERROR_CODES.EMAIL_NOT_FOUND;
    case AUTH_ERROR_MESSAGES.INCORRECT_PASSWORD:
      return AUTH_ERROR_CODES.INCORRECT_PASSWORD;
    case AUTH_ERROR_MESSAGES.ACCOUNT_NOT_FOUND:
      return AUTH_ERROR_CODES.USER_NOT_FOUND;
    case AUTH_ERROR_MESSAGES.ACCOUNT_INACTIVE:
      return AUTH_ERROR_CODES.ACCOUNT_INACTIVE;
    case AUTH_ERROR_MESSAGES.ACCESS_DENIED:
      return AUTH_ERROR_CODES.ACCESS_DENIED;
    case AUTH_ERROR_MESSAGES.LOGIN_FAILED:
      return AUTH_ERROR_CODES.LOGIN_FAILED;
    case AUTH_ERROR_MESSAGES.NETWORK_ERROR:
      return AUTH_ERROR_CODES.NETWORK_ERROR;
    case AUTH_ERROR_MESSAGES.INVALID_VERIFICATION_CODE:
      return AUTH_ERROR_CODES.INVALID_VERIFICATION_CODE;
    case AUTH_ERROR_MESSAGES.VERIFICATION_CODE_EXPIRED:
      return AUTH_ERROR_CODES.VERIFICATION_CODE_EXPIRED;
    case AUTH_ERROR_MESSAGES.GENERIC:
      return AUTH_ERROR_CODES.GENERIC;
    default:
      return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pushText(parts: string[], value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    if (text) {
      parts.push(text);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => pushText(parts, item));
  }
}

function extractPayloadParts(parts: string[], payload: unknown) {
  pushText(parts, payload);

  if (!isRecord(payload)) {
    return;
  }

  pushText(parts, payload.code);
  pushText(parts, payload.error);
  pushText(parts, payload.message);
  pushText(parts, payload.status);
  pushText(parts, payload.statusCode);

  if (isRecord(payload.errors)) {
    Object.values(payload.errors).forEach((value) => pushText(parts, value));
  }
}

function extractErrorParts(error: unknown): string[] {
  const parts: string[] = [];

  pushText(parts, error);

  if (error instanceof Error) {
    pushText(parts, error.name);
    pushText(parts, error.message);
    pushText(parts, (error as Error & { cause?: unknown }).cause);
  }

  if (!isRecord(error)) {
    return parts;
  }

  pushText(parts, error.name);
  pushText(parts, error.code);
  pushText(parts, error.error);
  pushText(parts, error.message);
  pushText(parts, error.status);

  if (isRecord(error.response)) {
    pushText(parts, error.response.status);
    extractPayloadParts(parts, error.response.data);
  }

  extractPayloadParts(parts, error);

  return parts;
}

function getHttpStatus(error: unknown): number | null {
  if (!isRecord(error)) {
    return null;
  }

  const status = isRecord(error.response) ? error.response.status : error.status;
  const numericStatus = Number(status);

  return Number.isFinite(numericStatus) ? numericStatus : null;
}

function normalize(parts: string[]) {
  return parts
    .join(" ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function getAuthErrorCode(
  error: unknown,
  fallback: AuthErrorCode = AUTH_ERROR_CODES.GENERIC,
): AuthErrorCode {
  const parts = extractErrorParts(error);
  const rawMessage = parts.join(" ").trim();

  if (rawMessage && APPROVED_AUTH_MESSAGES.has(rawMessage)) {
    return getCodeForApprovedMessage(rawMessage) ?? fallback;
  }

  const normalized = normalize(parts);
  const status = getHttpStatus(error);

  if (!normalized && !status) {
    return fallback;
  }

  if (
    normalized.includes("network error") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("fetch failed") ||
    normalized.includes("unable to connect") ||
    normalized.includes("connection refused") ||
    normalized.includes("connection reset") ||
    normalized.includes("timeout") ||
    normalized.includes("timed out") ||
    normalized.includes("econnrefused") ||
    normalized.includes("econnreset") ||
    normalized.includes("enotfound") ||
    normalized.includes("eai again") ||
    normalized.includes("err network") ||
    normalized.includes("unable to reach")
  ) {
    return AUTH_ERROR_CODES.NETWORK_ERROR;
  }

  if (
    normalized.includes("inactive") ||
    normalized.includes("disabled") ||
    normalized.includes("suspended") ||
    normalized.includes("deactivated") ||
    normalized.includes("blocked")
  ) {
    return AUTH_ERROR_CODES.ACCOUNT_INACTIVE;
  }

  if (
    normalized.includes("email not found") ||
    normalized.includes("email address not found") ||
    normalized.includes("email is not registered") ||
    normalized.includes("email not registered") ||
    normalized.includes("email does not exist") ||
    normalized.includes("email address does not exist") ||
    normalized.includes("unregistered email") ||
    normalized.includes("no account for this email") ||
    normalized.includes("no account with this email") ||
    normalized.includes("no user found with this email") ||
    normalized.includes("no user found for this email")
  ) {
    return AUTH_ERROR_CODES.EMAIL_NOT_FOUND;
  }

  if (
    normalized.includes("user not found") ||
    normalized.includes("account not found") ||
    normalized.includes("accountant not found") ||
    normalized.includes("customer not found") ||
    normalized.includes("no account found") ||
    normalized.includes("not registered") ||
    normalized.includes("register first") ||
    normalized.includes("does not exist") ||
    normalized.includes("no user")
  ) {
    return AUTH_ERROR_CODES.USER_NOT_FOUND;
  }

  if (
    normalized.includes("incorrect password") ||
    normalized.includes("wrong password") ||
    normalized.includes("password is incorrect") ||
    normalized.includes("invalid password") ||
    normalized.includes("password does not match")
  ) {
    return AUTH_ERROR_CODES.INCORRECT_PASSWORD;
  }

  if (
    normalized.includes("credentials signin") ||
    normalized.includes("credentialssignin") ||
    normalized.includes("invalid credentials") ||
    normalized.includes("invalid credential") ||
    normalized.includes("bad credentials") ||
    normalized.includes("incorrect credentials") ||
    normalized.includes("provided credentials are incorrect") ||
    normalized.includes("credentials do not match") ||
    normalized.includes("credentials don't match") ||
    normalized.includes("invalid email or password") ||
    normalized.includes("incorrect email or password") ||
    normalized.includes("email or password is incorrect") ||
    normalized.includes("email or password are incorrect") ||
    normalized.includes("invalid username or password") ||
    normalized === "credentials"
  ) {
    return AUTH_ERROR_CODES.INVALID_CREDENTIALS;
  }

  if (
    normalized.includes("otp expired") ||
    normalized.includes("verification code expired") ||
    normalized.includes("verification code has expired") ||
    normalized.includes("expired verification code")
  ) {
    return AUTH_ERROR_CODES.VERIFICATION_CODE_EXPIRED;
  }

  if (
    normalized.includes("invalid otp") ||
    normalized.includes("invalid verification code") ||
    normalized.includes("incorrect otp") ||
    normalized.includes("wrong otp") ||
    normalized.includes("verification code")
  ) {
    return AUTH_ERROR_CODES.INVALID_VERIFICATION_CODE;
  }

  if (
    normalized.includes("access denied") ||
    normalized.includes("accessdenied") ||
    normalized.includes("access denied") ||
    normalized.includes("permission") ||
    normalized.includes("forbidden") ||
    status === 403
  ) {
    return AUTH_ERROR_CODES.ACCESS_DENIED;
  }

  if (
    normalized.includes("login failed") ||
    normalized.includes("session") ||
    normalized.includes("nextauth") ||
    normalized.includes("jwt") ||
    normalized.includes("token") ||
    normalized.includes("callbackrouteerror") ||
    normalized.includes("callback route error") ||
    normalized.includes("unable to establish") ||
    normalized.includes("auth response incomplete") ||
    normalized.includes("authentication response") ||
    normalized.includes("authentication failed")
  ) {
    return AUTH_ERROR_CODES.LOGIN_FAILED;
  }

  if (status === 401) {
    return AUTH_ERROR_CODES.INVALID_CREDENTIALS;
  }

  if (status === 404) {
    return AUTH_ERROR_CODES.USER_NOT_FOUND;
  }

  if (
    normalized.includes("prisma") ||
    normalized.includes("database") ||
    normalized.includes("sql") ||
    normalized.includes("query") ||
    normalized.includes("stack") ||
    normalized.includes("exception") ||
    normalized.includes("internal") ||
    normalized.includes("server error") ||
    normalized.includes("api error")
  ) {
    return AUTH_ERROR_CODES.GENERIC;
  }

  return fallback;
}

export function getAuthErrorMessageForCode(code: AuthErrorCode): AuthErrorMessage {
  switch (code) {
    case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
      return AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS;
    case AUTH_ERROR_CODES.EMAIL_NOT_FOUND:
      return AUTH_ERROR_MESSAGES.EMAIL_NOT_FOUND;
    case AUTH_ERROR_CODES.INCORRECT_PASSWORD:
      return AUTH_ERROR_MESSAGES.INCORRECT_PASSWORD;
    case AUTH_ERROR_CODES.USER_NOT_FOUND:
    case AUTH_ERROR_CODES.ACCOUNTANT_NOT_FOUND:
      return AUTH_ERROR_MESSAGES.ACCOUNT_NOT_FOUND;
    case AUTH_ERROR_CODES.ACCOUNT_INACTIVE:
      return AUTH_ERROR_MESSAGES.ACCOUNT_INACTIVE;
    case AUTH_ERROR_CODES.ACCESS_DENIED:
      return AUTH_ERROR_MESSAGES.ACCESS_DENIED;
    case AUTH_ERROR_CODES.LOGIN_FAILED:
      return AUTH_ERROR_MESSAGES.LOGIN_FAILED;
    case AUTH_ERROR_CODES.NETWORK_ERROR:
      return AUTH_ERROR_MESSAGES.NETWORK_ERROR;
    case AUTH_ERROR_CODES.INVALID_VERIFICATION_CODE:
      return AUTH_ERROR_MESSAGES.INVALID_VERIFICATION_CODE;
    case AUTH_ERROR_CODES.VERIFICATION_CODE_EXPIRED:
      return AUTH_ERROR_MESSAGES.VERIFICATION_CODE_EXPIRED;
    case AUTH_ERROR_CODES.GENERIC:
    default:
      return AUTH_ERROR_MESSAGES.GENERIC;
  }
}

export function getFriendlyAuthErrorMessage(
  error: unknown,
  fallback: AuthErrorMessage = AUTH_ERROR_MESSAGES.GENERIC,
): string {
  if (typeof error === "string" && APPROVED_AUTH_MESSAGES.has(error)) {
    return error;
  }

  if (error instanceof Error && APPROVED_AUTH_MESSAGES.has(error.message)) {
    return error.message;
  }

  return getAuthErrorMessageForCode(
    getAuthErrorCode(error, getCodeForApprovedMessage(fallback) ?? AUTH_ERROR_CODES.GENERIC),
  );
}

export function logAuthError(context: string, error: unknown) {
  if (typeof console === "undefined") {
    return;
  }

  console.error(`[Auth] ${context}`, error);
}
