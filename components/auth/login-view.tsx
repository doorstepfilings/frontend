"use client";

import Link from "next/link";
import { isAxiosError } from "axios";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShowcasePanel } from "@/components/auth/auth-showcase-panel";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { SocialAuthOptions } from "@/components/auth/social-auth-options";
import { signInWithPassword } from "@/lib/auth/auth-client";
import { getDefaultRedirectPath } from "@/lib/auth/storage";
import { useStoredUser } from "@/lib/auth/hooks";

function getAuthErrorMessage(errorCode: string | null) {
  if (!errorCode) {
    return "";
  }

  if (errorCode === "social_email_missing") {
    return "Your social account did not provide an email address. Please use another login method.";
  }

  return decodeURIComponent(errorCode);
}

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = useMemo(() => {
    const redirect = searchParams.get("redirect");
    if (!redirect || !redirect.startsWith("/")) {
      return null;
    }
    return redirect;
  }, [searchParams]);
  const queryError = useMemo(
    () => getAuthErrorMessage(searchParams.get("error")),
    [searchParams],
  );

  // Email/Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const user = useStoredUser();

  useEffect(() => {
    if (user) {
      router.replace(getDefaultRedirectPath(user));
    }
  }, [router, user]);

  const handleEmailLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signInWithPassword({
        email,
        password,
        redirectTo: redirectTarget,
      });
      router.replace(redirectTarget ?? getDefaultRedirectPath(result.user));
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : isAxiosError(requestError)
            ? (requestError.response?.data?.message ?? requestError.message)
            : "Invalid credentials. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <AuthShowcasePanel
        imageSrc="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop"
        imageAlt="Business Office"
        title="Welcome Back!"
        description="Sign in to access your account and explore our comprehensive financial and business advisory services."
      >
        <div>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex -space-x-3">
              <img src="/assets/images/testimonials/Milap_Peripheral.png" alt="Client" className="h-10 w-10 rounded-full border-2 border-blue-900 object-cover" />
              <img src="/assets/images/testimonials/Hardik_Kanhai.png" alt="Client" className="h-10 w-10 rounded-full border-2 border-blue-900 object-cover" />
              <img src="/assets/images/testimonials/Vishal_Yug_Alloys.png" alt="Client" className="h-10 w-10 rounded-full border-2 border-blue-900 object-cover" />
            </div>
            <span className="text-sm text-blue-200">Join 500+ satisfied clients</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <i className="fas fa-check-circle text-amber-400" />
              <span>Expert Financial Advisory</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <i className="fas fa-check-circle text-amber-400" />
              <span>GST & Tax Compliance</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <i className="fas fa-check-circle text-amber-400" />
              <span>Project Finance & Loans</span>
            </div>
          </div>
        </div>
      </AuthShowcasePanel>

      <div className="p-8 md:w-1/2 md:p-12">
        <div className="mx-auto max-w-sm">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl font-bold text-slate-900">Login</h2>
              <p className="text-slate-500">Enter your credentials to access your account</p>
            </div>

            {(error || queryError) && (
              <div className="mb-6 flex items-center gap-2 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">
                <i className="fas fa-exclamation-circle" />
                {error || queryError}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-900"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-slate-900 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-900"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900" />
                  <span className="text-slate-600">Remember me</span>
                </label>
                <Link href="/forgot-password" className="font-semibold text-blue-900 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:from-blue-800 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Sign In
                    <i className="fas fa-arrow-right" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6">
              <SocialAuthOptions redirectTo={redirectTarget} />
            </div>

            <div className="mt-8 text-center">
              <p className="text-slate-600">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-bold text-blue-900 hover:underline">
                  Create Account
                </Link>
              </p>
            </div>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
