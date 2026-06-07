"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import {
  AUTH_ERROR_MESSAGES,
  getFriendlyAuthErrorMessage,
  logAuthError,
} from "@/lib/auth/error-helper";

type SocialAuthOptionsProps = {
  redirectTo?: string | null;
};

type SocialProvider = {
  id: string;
  name: string;
  type: string;
};

type ProviderResponse = Record<string, SocialProvider>;

function isSocialProvider(provider: SocialProvider) {
  return provider.type === "oauth" || provider.type === "oidc";
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
        fill="#EA4335"
      />
    </svg>
  );
}

function getProviderIcon(providerId: string) {
  switch (providerId) {
    case "github":
      return "fab fa-github";
    case "facebook":
      return "fab fa-facebook-f";
    default:
      return "fas fa-user-lock";
  }
}

function getProviderButtonClass(providerId: string) {
  if (providerId === "google") {
    return "group flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#dadce0] bg-white px-4 py-3.5 text-sm font-semibold text-[#3c4043] shadow-sm transition-all duration-200 hover:border-[#c5cad1] hover:bg-[#f8fbff] hover:shadow-md hover:shadow-slate-200/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 active:translate-y-px";
  }

  return "flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2";
}

function ProviderIcon({ providerId }: { providerId: string }) {
  if (providerId === "google") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.14)] ring-1 ring-slate-100 transition-transform duration-200 group-hover:scale-105">
        <GoogleIcon />
      </span>
    );
  }

  return <i className={getProviderIcon(providerId)} />;
}

export function SocialAuthOptions({ redirectTo }: SocialAuthOptionsProps) {
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProviders() {
      const response = await fetch("/api/auth/providers", {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return;
      }

      const loadedProviders = (await response.json()) as ProviderResponse;
      if (!isMounted) {
        return;
      }

      const socialProviders = Object.values(loadedProviders).filter(isSocialProvider);
      setProviders(socialProviders);
    }

    void loadProviders().catch(() => {
      if (isMounted) {
        setProviders([]);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (providers.length === 0) {
    return null;
  }

  const handleProviderSignIn = async (provider: SocialProvider) => {
    setError("");

    try {
      await signIn(provider.id, {
        redirectTo: redirectTo ?? undefined,
      });
    } catch (signInError) {
      logAuthError("Social sign-in failed", signInError);
      setError(getFriendlyAuthErrorMessage(signInError, AUTH_ERROR_MESSAGES.LOGIN_FAILED));
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
          <i className="fas fa-exclamation-circle mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          Or continue with
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid gap-3">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => void handleProviderSignIn(provider)}
            className={getProviderButtonClass(provider.id)}
          >
            <ProviderIcon providerId={provider.id} />
            <span className="leading-none">Continue with {provider.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
