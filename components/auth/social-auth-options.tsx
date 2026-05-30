"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";

type SocialAuthOptionsProps = {
  redirectTo?: string | null;
};

type SocialProvider = {
  id: string;
  name: string;
  type: string;
};

function isSocialProvider(provider: SocialProvider) {
  return provider.type === "oauth" || provider.type === "oidc";
}

function getProviderIcon(providerId: string) {
  switch (providerId) {
    case "google":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
      );
    case "github":
      return <i className="fab fa-github text-lg" />;
    case "facebook":
      return <i className="fab fa-facebook-f text-lg text-blue-600" />;
    default:
      return <i className="fas fa-user-lock text-lg" />;
  }
}

export function SocialAuthOptions({ redirectTo }: SocialAuthOptionsProps) {
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProviders() {
      const loadedProviders = await getProviders();
      if (!isMounted) {
        return;
      }

      setProviders(
        loadedProviders ? Object.values(loadedProviders).filter(isSocialProvider) : [],
      );
      setLoaded(true);
    }

    void loadProviders();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!loaded) {
    return null;
  }

  if (providers.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Social login
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Social login is not configured yet. Add `AUTH_GOOGLE_ID` /
            `AUTH_GOOGLE_SECRET` or `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` in
            `doorstepfilings-frontend/.env.local`, then restart the frontend.
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="space-y-3">
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
            onClick={() =>
              void signIn(provider.id, {
                redirectTo: redirectTo ?? undefined,
              })
            }
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
          >
            {getProviderIcon(provider.id)}
            Continue with {provider.name}
          </button>
        ))}
      </div>
    </div>
  );
}
