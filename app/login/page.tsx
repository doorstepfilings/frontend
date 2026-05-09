"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { login, loginWithMobile, clearError } from "@/lib/features/auth/auth-slice";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { SocialAuthOptions } from "@/components/auth/social-auth-options";
import { getAuthorizedRedirectPath } from "@/lib/auth/redirects";
import { useStoredUser } from "@/lib/auth/hooks";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.auth.loading);
  const user = useStoredUser();

  const [loginMethod, setLoginMethod] = useState<"email" | "mobile">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Mobile/OTP state
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("91");
  const [countryIso, setCountryIso] = useState("in");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const redirectParam = searchParams.get("redirect");
  const redirectPath = redirectParam?.startsWith("/") ? redirectParam : null;

  const COUNTRIES = [
    { iso: "in", name: "India", dialCode: "91", flag: "https://flagcdn.com/24x18/in.png" },
    { iso: "us", name: "United States", dialCode: "1", flag: "https://flagcdn.com/24x18/us.png" },
    { iso: "gb", name: "United Kingdom", dialCode: "44", flag: "https://flagcdn.com/24x18/gb.png" },
    { iso: "ae", name: "UAE", dialCode: "971", flag: "https://flagcdn.com/24x18/ae.png" },
    { iso: "sa", name: "Saudi Arabia", dialCode: "966", flag: "https://flagcdn.com/24x18/sa.png" },
    { iso: "kw", name: "Kuwait", dialCode: "965", flag: "https://flagcdn.com/24x18/kw.png" },
    { iso: "qa", name: "Qatar", dialCode: "974", flag: "https://flagcdn.com/24x18/qa.png" },
  ];

  useEffect(() => {
    if (user) {
      router.replace(getAuthorizedRedirectPath(user, redirectPath));
    }
  }, [user, router, redirectPath]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    try {
      await dispatch(login({ email, password })).unwrap();
      toast.success("Login successful!");
    } catch (err: any) {
      toast.error(err || "Login failed");
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 5) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    setOtpLoading(true);
    try {
      const fullMobile = `+${dialCode}${phone}`;
      await apiClient.post("/user/send-login-otp", { mobile_number: fullMobile });
      setOtpSent(true);
      toast.success("OTP sent successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    dispatch(clearError());
    try {
      const fullMobile = `+${dialCode}${phone}`;
      await dispatch(loginWithMobile({ mobile_number: fullMobile, otp })).unwrap();
      toast.success("Login successful!");
    } catch (err: any) {
      toast.error(err || "Invalid OTP");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"></div>
      </div>

      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-sm md:flex-row">
        {/* Left Side */}
        <div className="relative overflow-hidden md:w-1/2">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop"
              alt="Office"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/85 to-indigo-900/90"></div>
          </div>
          <div className="relative z-10 flex h-full min-h-[400px] flex-col justify-between p-12 text-white md:min-h-[600px]">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <i className="fas fa-chart-line text-2xl"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold uppercase tracking-widest">DoorstepFilings</h1>
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Financial & Advisory</p>
                </div>
              </div>
              <h2 className="mb-4 text-4xl font-bold">Welcome Back!</h2>
              <p className="text-lg leading-relaxed text-blue-100">
                Sign in to access your account and manage your filings seamlessly.
              </p>
            </div>
            <div>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex -space-x-3">
                  <img src="https://i.pravatar.cc/100?u=1" className="h-10 w-10 rounded-full border-2 border-blue-900 object-cover" alt="user" />
                  <img src="https://i.pravatar.cc/100?u=2" className="h-10 w-10 rounded-full border-2 border-blue-900 object-cover" alt="user" />
                  <img src="https://i.pravatar.cc/100?u=3" className="h-10 w-10 rounded-full border-2 border-blue-900 object-cover" alt="user" />
                </div>
                <span className="text-sm text-blue-200">Join 1000+ satisfied clients</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <i className="fas fa-check-circle text-amber-400"></i>
                  <span>Real-time tracking</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <i className="fas fa-check-circle text-amber-400"></i>
                  <span>Expert Consultation</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="p-8 md:w-1/2 md:p-12">
          <div className="mx-auto max-w-sm">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
              <p className="mt-2 text-sm text-gray-500">Access your account dashboard</p>
            </div>

            {/* Login Tabs */}
            {/* <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => { setLoginMethod("email"); setOtpSent(false); }}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${loginMethod === "email" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Email
              </button>
              <button
                onClick={() => { setLoginMethod("mobile"); setOtpSent(false); }}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${loginMethod === "mobile" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                OTP
              </button>
            </div> */}

            {loginMethod === "email" ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Email Address</label>
                  <div className="relative">
                    <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 outline-none transition-all focus:border-blue-900 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Password</label>
                  <div className="relative">
                    <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-12 outline-none transition-all focus:border-blue-900 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-900" />
                    Remember me
                  </label>
                  <Link href="/forgot-password" className="text-sm font-bold text-blue-900 hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-blue-900 py-6 text-base font-bold shadow-xl shadow-blue-900/20 hover:bg-blue-800">
                  {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                  Sign In
                </Button>
              </form>
            ) : (
              <form onSubmit={otpSent ? handleOtpLogin : handleSendOtp} className="space-y-4">
                {!otpSent ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Mobile Number</label>
                      <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-900/10">
                        <button
                          type="button"
                          className="flex min-w-[70px] items-center justify-center gap-1 border-r px-3 hover:bg-gray-100"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        >
                          <img src={`https://flagcdn.com/24x18/${countryIso}.png`} alt="flag" className="h-3 w-4" />
                          <i className="fas fa-chevron-down text-[8px] text-gray-400"></i>
                        </button>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">+{dialCode}</span>
                          <input
                            type="text"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                            className="w-full border-none bg-transparent py-3.5 pl-12 pr-4 outline-none"
                            placeholder="Enter mobile number"
                          />
                        </div>
                      </div>
                      {showCountryDropdown && (
                        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border bg-white py-2 shadow-2xl">
                          {COUNTRIES.map((c) => (
                            <button
                              key={c.iso}
                              type="button"
                              className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-gray-50"
                              onClick={() => {
                                setDialCode(c.dialCode);
                                setCountryIso(c.iso);
                                setShowCountryDropdown(false);
                              }}
                            >
                              <img src={c.flag} className="h-3 w-4" alt={c.name} />
                              <span className="flex-1 text-sm">{c.name}</span>
                              <span className="text-xs text-gray-400">+{c.dialCode}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button type="submit" disabled={otpLoading} className="w-full bg-blue-900 py-6 text-base font-bold shadow-xl shadow-blue-900/20 hover:bg-blue-800">
                      {otpLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                      Send OTP
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">OTP sent to <span className="font-bold text-blue-900">+{dialCode} {phone}</span></p>
                      <button onClick={() => setOtpSent(false)} className="mt-1 text-xs font-bold text-blue-600 hover:underline">Change Number</button>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Enter OTP</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-4 text-center text-2xl font-black tracking-[1em] outline-none transition-all focus:border-blue-900 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                        placeholder="000000"
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-blue-900 py-6 text-base font-bold shadow-xl shadow-blue-900/20 hover:bg-blue-800">
                      {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                      Verify & Login
                    </Button>
                  </div>
                )}
              </form>
            )}

            <div className="mt-6">
              <SocialAuthOptions redirectTo={redirectPath} />
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-blue-900"><div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
