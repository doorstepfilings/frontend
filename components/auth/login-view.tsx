"use client";

import Link from "next/link";
import { isAxiosError } from "axios";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import { apiClient } from "@/lib/api/client";
import { SocialAuthOptions } from "@/components/auth/social-auth-options";
import {
  signInWithMobileOtp,
  signInWithPassword,
} from "@/lib/auth/auth-client";
import {
  getDefaultRedirectPath,
  type AuthUser,
} from "@/lib/auth/storage";
import { useStoredUser } from "@/lib/auth/hooks";

type LoginResponse = {
  data?: {
    token?: string;
    user?: AuthUser;
  };
  message?: string;
};

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
  const [devOtp, setDevOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState("");
  const user = useStoredUser();

  useEffect(() => {
    if (user) {
      router.replace(getDefaultRedirectPath(user));
    }
  }, [router, user]);

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setDialCode(country.dialCode);
    setCountryIso(country.iso);
    setShowCountryDropdown(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localNumber = e.target.value.replace(/\D/g, "");
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
      setDevOtp(response.data?.data?.otp ?? "");
    } catch (requestError) {
      const message = isAxiosError(requestError)
        ? (requestError.response?.data?.message ?? requestError.message)
        : requestError instanceof Error
          ? requestError.message
          : "Failed to send OTP. Please try again.";
      setError(message);
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
      const message =
        requestError instanceof Error
          ? requestError.message
          : isAxiosError(requestError)
            ? (requestError.response?.data?.message ?? requestError.message)
            : "Invalid OTP. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = loginMethod === "mobile" ? (otpSent ? handleMobileLogin : handleSendLoginOtp) : handleEmailLogin;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-sm md:flex-row">
        {/* Left Side - Image & Info */}
        <div className="relative overflow-hidden md:w-1/2">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop"
              alt="Business Office"
              className="h-full w-full object-cover"
            />
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/85 to-indigo-900/90" />
          </div>

          {/* Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

          <div className="relative z-10 flex h-full min-h-[400px] flex-col justify-between p-12 text-white md:min-h-[600px]">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <i className="fas fa-chart-line text-2xl" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">OUR FIRM</h1>
                  <p className="text-xs text-blue-200">Financial & Advisory</p>
                </div>
              </div>

              <h2 className="mb-4 text-4xl font-bold">Welcome Back!</h2>
              <p className="text-lg leading-relaxed text-blue-100">
                Sign in to access your account and explore our comprehensive financial and business advisory services.
              </p>
            </div>

            <div>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex -space-x-3">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop" alt="Client" className="h-10 w-10 rounded-full border-2 border-blue-900 object-cover" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop" alt="Client" className="h-10 w-10 rounded-full border-2 border-blue-900 object-cover" />
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop" alt="Client" className="h-10 w-10 rounded-full border-2 border-blue-900 object-cover" />
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
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 md:w-1/2 md:p-12">
          <div className="mx-auto max-w-sm">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl font-bold text-slate-900">Login</h2>
              <p className="text-slate-500">Enter your credentials to access your account</p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">
                <i className="fas fa-exclamation-circle" />
                {error}
              </div>
            )}

            {/* Login Method Tabs */}
            <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
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
            </div>

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
                            type="text"
                            value={phone}
                            onChange={handlePhoneChange}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-20 pr-4 text-slate-900 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-900"
                            placeholder="Enter mobile number"
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
                        {devOtp && (
                          <p className="mt-2 text-center text-xs font-bold text-amber-600">
                            Dev OTP: {devOtp}
                          </p>
                        )}
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
                Don't have an account?{" "}
                <Link href="/register" className="font-bold text-blue-900 hover:underline">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
