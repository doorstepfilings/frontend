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
  return provider.type === "oauth";
}

function getProviderIcon(providerId: string) {
  switch (providerId) {
    case "google":
      return "fab fa-google";
    case "github":
      return "fab fa-github";
    case "facebook":
      return "fab fa-facebook-f";
    default:
      return "fas fa-user-lock";
  }
}

export function SocialAuthOptions({ redirectTo }: SocialAuthOptionsProps) {
  const [providers, setProviders] = useState<SocialProvider[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadProviders() {
      const loadedProviders = await getProviders();
      if (!isMounted || !loadedProviders) {
        return;
      }

      setProviders(Object.values(loadedProviders).filter(isSocialProvider));
    }

    void loadProviders();

    return () => {
      isMounted = false;
    };
  }, []);

  if (providers.length === 0) {
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
            <i className={getProviderIcon(provider.id)} />
            Continue with {provider.name}
          </button>
        ))}
      </div>
    </div>
  );
}
