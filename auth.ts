import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { appConfig } from "@/lib/config";
import type { AuthUser, BackendAuthResponse } from "@/lib/auth/types";
import {
  AUTH_ERROR_CODES,
  getAuthErrorCode,
  logAuthError,
} from "@/lib/auth/error-helper";

class CustomAuthError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

const authSecret =
  process.env.AUTH_SECRET?.trim() ||
  (process.env.NODE_ENV !== "production"
    ? "doorstepfilings-local-dev-auth-secret-change-me"
    : undefined);

async function authenticateWithBackend(
  pathname: string,
  body: Record<string, unknown>,
  customHeaders?: Record<string, string>
) {
  try {
    const response = await fetch(`${appConfig.backendUrl}/api${pathname}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...customHeaders,
      },
      body: JSON.stringify(body),
    });

    return readBackendResponse(response);
  } catch (error) {
    logAuthError("Backend sign-in request failed", error);
    return {
      error: AUTH_ERROR_CODES.NETWORK_ERROR,
      data: null,
    };
  }
}

function buildSessionUser(user: AuthUser) {
  return { ...user };
}

type AuthorizedUser = AuthUser & {
  id?: string;
  accessToken: string;
};

type BackendAuthResult =
  | {
      error: string;
      data: null;
    }
  | {
      error: null;
      data: {
        token: string;
        user: AuthUser;
      };
    };

async function readBackendResponse(response: Response): Promise<BackendAuthResult> {
  const payload = (await response.json().catch(() => null)) as BackendAuthResponse | null;

  if (!response.ok) {
    return {
      error: getAuthErrorCode(
        { response: { status: response.status, data: payload } },
        response.status >= 500 ? AUTH_ERROR_CODES.GENERIC : AUTH_ERROR_CODES.LOGIN_FAILED,
      ),
      data: null,
    };
  }

  const data = payload?.data;
  if (!data?.token || !data.user) {
    return {
      error: AUTH_ERROR_CODES.LOGIN_FAILED,
      data: null,
    };
  }

  return {
    error: null,
    data: {
      token: data.token,
      user: data.user,
    },
  };
}

function getFutureSocialProviders() {
  const providers = [];

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      })
    );
  }

  return providers;
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  secret: authSecret,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AuthorizedUser | null> {
        const email = String(credentials.email ?? "").trim().toLowerCase();
        const password = String(credentials.password ?? "");

        if (!email || !password) {
          return null;
        }

        const result = await authenticateWithBackend("/user/login", {
          email,
          password,
        });

        const authPayload = result.data;
        if (!authPayload) {
          throw new CustomAuthError(result.error || AUTH_ERROR_CODES.INVALID_CREDENTIALS);
        }

        return {
          ...buildSessionUser(authPayload.user),
          id: String(authPayload.user.id ?? authPayload.user.user_id ?? ""),
          accessToken: authPayload.token,
        };
      },
    }),
    Credentials({
      id: "mobile-otp",
      name: "Mobile OTP",
      credentials: {
        mobile_number: { label: "Mobile Number", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials): Promise<AuthorizedUser | null> {
        const mobile_number = String(credentials.mobile_number ?? "").trim();
        const otp = String(credentials.otp ?? "").trim();

        if (!mobile_number || !otp) {
          return null;
        }

        const result = await authenticateWithBackend("/user/login-with-mobile", {
          mobile_number,
          otp,
        });

        const authPayload = result.data;
        if (!authPayload) {
          throw new CustomAuthError(result.error || AUTH_ERROR_CODES.LOGIN_FAILED);
        }

        return {
          ...buildSessionUser(authPayload.user),
          id: String(authPayload.user.id ?? authPayload.user.user_id ?? ""),
          accessToken: authPayload.token,
        };
      },
    }),
    ...getFutureSocialProviders(),
  ],
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth?.accessToken && auth.user);
    },
    async signIn({ user, account }) {
      if (account && account.provider !== "credentials" && account.provider !== "mobile-otp") {
        const socialAuthSecret = process.env.SOCIAL_AUTH_SHARED_SECRET?.trim();
        const email = user.email?.trim().toLowerCase();
        const providerAccountId = account.providerAccountId?.trim();

        if (!socialAuthSecret || !email || !providerAccountId) {
          logAuthError("Social sign-in configuration or profile is incomplete", {
            hasSecret: Boolean(socialAuthSecret),
            hasEmail: Boolean(email),
            hasProviderAccountId: Boolean(providerAccountId),
            provider: account.provider,
          });
          return `/login?error=${AUTH_ERROR_CODES.LOGIN_FAILED}`;
        }

        const result = await authenticateWithBackend(
          "/user/oauth-login",
          {
            provider: account.provider,
            email,
            name: user.name ?? undefined,
            provider_account_id: providerAccountId,
            image: user.image ?? undefined,
          },
          {
            "x-social-auth-secret": socialAuthSecret,
          }
        );

        const authPayload = result.data;
        if (!authPayload) {
          logAuthError("Social sign-in request failed", result.error);
          return `/login?error=${AUTH_ERROR_CODES.LOGIN_FAILED}`;
        }

        (user as any).accessToken = authPayload.token;
        (user as any).backendUser = authPayload.user;
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as any;
        token.accessToken = u.accessToken;
        token.user = buildSessionUser(u.backendUser ?? u);
      }

      if (trigger === "update" && session?.user) {
        token.user = {
          ...(token.user ?? {}),
          ...(session.user as AuthUser),
        };
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = typeof token.accessToken === "string" ? token.accessToken : null;
      session.user = (token.user ?? session.user) as typeof session.user;

      return session;
    },
  },
  trustHost: true,
});
