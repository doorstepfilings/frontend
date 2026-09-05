"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { AuthShowcasePanel } from "@/components/auth/auth-showcase-panel";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { SocialAuthOptions } from "@/components/auth/social-auth-options";
import {
  signInWithMobileOtp,
  signInWithPassword,
} from "@/lib/auth/auth-client";
import { getDefaultRedirectPath } from "@/lib/auth/storage";
import { useStoredUser } from "@/lib/auth/hooks";
import {
  AUTH_ERROR_MESSAGES,
  getFriendlyAuthErrorMessage,
  logAuthError,
} from "@/lib/auth/error-helper";

// Common countries with dial codes for the dropdown
const COUNTRIES = [
  { iso: "in", name: "India", dialCode: "91", flag: "https://flagcdn.com/24x18/in.png" },
  { iso: "us", name: "United States", dialCode: "1", flag: "https://flagcdn.com/24x18/us.png" },
  { iso: "gb", name: "United Kingdom", dialCode: "44", flag: "https://flagcdn.com/24x18/gb.png" },
  { iso: "ae", name: "UAE", dialCode: "971", flag: "https://flagcdn.com/24x18/ae.png" },
  { iso: "sa", name: "Saudi Arabia", dialCode: "966", flag: "https://flagcdn.com/24x18/sa.png" },
  { iso: "kw", name: "Kuwait", dialCode: "965", flag: "https://flagcdn.com/24x18/kw.png" },
  { iso: "qa", name: "Qatar", dialCode: "974", flag: "https://flagcdn.com/24x18/qa.png" },
];

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
  const queryError = useMemo(() => {
    return searchParams.get("error") || searchParams.get("code") || "";
  }, [searchParams]);

  // Tab state: 'email' or 'mobile'
  const [loginMethod, setLoginMethod] = useState<"email" | "mobile">("email");

  // Email/Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Mobile/OTP state
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("91");
  const [countryIso, setCountryIso] = useState("in");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState("");
  const user = useStoredUser();

  useEffect(() => {
    if (user) {
      router.replace(getDefaultRedirectPath(user));
    }
  }, [router, user]);

  useEffect(() => {
    if (queryError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(getFriendlyAuthErrorMessage(queryError, AUTH_ERROR_MESSAGES.LOGIN_FAILED));
    }
  }, [queryError]);

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setDialCode(country.dialCode);
    setCountryIso(country.iso);
    setShowCountryDropdown(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localNumber = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(localNumber);
  };

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
      setError(getFriendlyAuthErrorMessage(requestError, AUTH_ERROR_MESSAGES.LOGIN_FAILED));
    } finally {
      setLoading(false);
    }
  };

  const handleSendLoginOtp = async (event: FormEvent) => {
    event.preventDefault();
    setOtpLoading(true);
    setError("");

    if (!phone || phone.length < 5) {
      setError("Please enter a valid mobile number");
      setOtpLoading(false);
      return;
    }

    try {
      const fullMobile = `+${dialCode}${phone}`;
      const response = await apiClient.post<{ data?: { otp?: string } }>("/user/send-login-otp", {
        mobile_number: fullMobile,
      });

      setOtpSent(true);
    } catch (requestError) {
      logAuthError("Login OTP request failed", requestError);
      setError(getFriendlyAuthErrorMessage(requestError, AUTH_ERROR_MESSAGES.LOGIN_FAILED));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleMobileLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const fullMobile = `+${dialCode}${phone}`;
      const result = await signInWithMobileOtp({
        mobile_number: fullMobile,
        otp,
        redirectTo: redirectTarget,
      });
      router.replace(redirectTarget ?? getDefaultRedirectPath(result.user));
    } catch (requestError) {
      setError(getFriendlyAuthErrorMessage(requestError, AUTH_ERROR_MESSAGES.LOGIN_FAILED));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = loginMethod === "mobile" ? (otpSent ? handleMobileLogin : handleSendLoginOtp) : handleEmailLogin;

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

      {/* Right Side - Form */}
      <div className="w-full p-6 sm:p-8 md:w-1/2 md:p-12">
        <div className="mx-auto max-w-sm">
          {/* Mobile-only logo */}
          <div className="mb-6 flex justify-center md:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <img
                src="/assets/images/logo.png"
                alt="DoorstepFilings"
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">Login</h2>
            <p className="text-sm text-slate-500 sm:text-base">Enter your credentials to access your account</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">
              <i className="fas fa-exclamation-circle" />
              {error}
            </div>
          )}

          {/* Login Method Tabs */}
          {/* <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => { setLoginMethod("email"); setError(""); setOtpSent(false); }}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  loginMethod === "email"
                    ? "bg-white text-blue-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <i className="fas fa-envelope mr-2" />Email
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod("mobile"); setError(""); setOtpSent(false); }}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  loginMethod === "mobile"
                    ? "bg-white text-blue-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <i className="fas fa-mobile-alt mr-2" />Mobile OTP
              </button>
            </div> */}

          <form onSubmit={handleSubmit} className="space-y-5">
            {loginMethod === "email" ? (
              <>
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
              </>
            ) : (
              <>
                {!otpSent ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        {/* Country Dropdown Toggle */}
                        <div
                          className="absolute bottom-0 left-0 top-0 flex w-16 cursor-pointer items-center justify-center rounded-l-xl border-r border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        >
                          <img
                            src={`https://flagcdn.com/24x18/${countryIso.toLowerCase()}.png`}
                            alt={`${countryIso} flag`}
                            className="h-4 w-6 object-contain"
                          />
                          <i className="fas fa-chevron-down ml-1 text-xs text-slate-400" />
                        </div>

                        {/* Country Dropdown Menu */}
                        {showCountryDropdown && (
                          <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                            {COUNTRIES.map((country) => (
                              <div
                                key={country.iso}
                                className="flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-slate-100"
                                onClick={() => handleCountrySelect(country)}
                              >
                                <img
                                  src={country.flag}
                                  alt={country.name}
                                  className="h-3 w-5 object-contain"
                                />
                                <span className="flex-1 text-sm font-medium text-slate-700">{country.name}</span>
                                <span className="text-xs text-slate-500">+{country.dialCode}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Mobile Number Input */}
                        <input
                          type="tel"
                          value={phone}
                          onChange={handlePhoneChange}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-20 pr-4 text-slate-900 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-900"
                          placeholder="Enter mobile number"
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      OTP will be sent to your registered mobile number
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 text-center">
                      <p className="text-sm text-slate-600">
                        OTP sent to <span className="font-semibold text-blue-900">+{dialCode} {phone}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="mt-1 text-xs text-blue-600 hover:underline"
                      >
                        Change number
                      </button>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Enter OTP
                      </label>
                      <div className="relative">
                        <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-center text-lg tracking-widest text-slate-900 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-900"
                          placeholder="123456"
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>
                    <p className="text-center text-xs text-slate-500">
                      OTP will be sent to your mobile via SMS
                    </p>
                  </>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading || (loginMethod === "mobile" && otpLoading)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:from-blue-800 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading || otpLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  {otpSent ? "Verifying..." : "Submitting..."}
                </>
              ) : (
                <>
                  {loginMethod === "mobile" ? (otpSent ? "Login with OTP" : "Send OTP") : "Sign In"}
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
