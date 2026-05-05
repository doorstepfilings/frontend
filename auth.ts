import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { appConfig } from "@/lib/config";
import type { AuthUser, BackendAuthResponse } from "@/lib/auth/types";

const authSecret =
  process.env.AUTH_SECRET?.trim() ||
  (process.env.NODE_ENV !== "production"
    ? "doorstepfilings-local-dev-auth-secret-change-me"
    : undefined);

function formatMessage(message: BackendAuthResponse["message"]) {
  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message ?? "Authentication failed.";
}

async function authenticateWithBackend(pathname: string, body: Record<string, unknown>) {
  try {
    const response = await fetch(`${appConfig.backendUrl}/api${pathname}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return readBackendResponse(response);
  } catch {
    return {
      error: "Unable to reach the authentication service right now.",
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
      error: formatMessage(payload?.message),
      data: null,
    };
  }

  const data = payload?.data;
  if (!data?.token || !data.user) {
    return {
      error: "Authentication response was incomplete.",
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
  // Add Google/GitHub here once the backend can exchange OAuth identities
  // for a Doorstep API token. The login UI already reads providers dynamically.
  return [];
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
          return null;
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
          return null;
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const { accessToken, ...sessionUser } = user as AuthUser & { accessToken?: string };
        token.accessToken = accessToken;
        token.user = buildSessionUser(sessionUser);
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
