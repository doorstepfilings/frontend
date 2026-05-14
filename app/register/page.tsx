"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { register, clearError } from "@/lib/features/auth/auth-slice";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { SocialAuthOptions } from "@/components/auth/social-auth-options";
import { apiClient } from "@/lib/api/client";
import { getDefaultRedirectPath } from "@/lib/auth/redirects";
import { useStoredUser } from "@/lib/auth/hooks";

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.auth.loading);
  const user = useStoredUser();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_number: "",
    dial_code: "91",
    country_iso: "in",
    password: "",
    password_confirmation: "",
    referral_code: "",
    rm_id: "",
  });

  const [verification, setVerification] = useState({
    emailSent: false,
    emailVerified: false,
    emailOtp: "",
    loading: { email: false, verify: false },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [rmDetails, setRmDetails] = useState<any>(null);
  const [isSearchingRM, setIsSearchingRM] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const COUNTRIES = [
    { iso: "in", name: "India", dialCode: "91", flag: "https://flagcdn.com/24x18/in.png" },
    { iso: "us", name: "United States", dialCode: "1", flag: "https://flagcdn.com/24x18/us.png" },
    { iso: "gb", name: "United Kingdom", dialCode: "44", flag: "https://flagcdn.com/24x18/gb.png" },
    { iso: "ae", name: "UAE", dialCode: "971", flag: "https://flagcdn.com/24x18/ae.png" },
  ];

  useEffect(() => {
    if (user) {
      router.replace(getDefaultRedirectPath(user));
    }
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleSendOtp = async () => {
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setVerification((prev) => ({ ...prev, loading: { ...prev.loading, email: true } }));
    try {
      await apiClient.post("/user/send-otp", { identifier: formData.email });
      setVerification((prev) => ({ ...prev, emailSent: true }));
      toast.success("OTP sent to your email!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setVerification((prev) => ({ ...prev, loading: { ...prev.loading, email: false } }));
    }
  };

  const handleVerifyOtp = async () => {
    if (verification.emailOtp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setVerification((prev) => ({ ...prev, loading: { ...prev.loading, verify: true } }));
    try {
      await apiClient.post("/user/verify-otp", {
        identifier: formData.email,
        otp: verification.emailOtp,
      });
      setVerification((prev) => ({ ...prev, emailVerified: true }));
      toast.success("Email verified successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setVerification((prev) => ({ ...prev, loading: { ...prev.loading, verify: false } }));
    }
  };

  const handleRMSearch = async () => {
    if (!formData.rm_id) return;
    setIsSearchingRM(true);
    try {
      const response = await apiClient.get(`/public/search-rm?rm_unique_id=${formData.rm_id}`);
      setRmDetails(response.data.data);
      toast.success("RM verified!");
    } catch {
      toast.error("Invalid RM ID");
      setRmDetails(null);
    } finally {
      setIsSearchingRM(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verification.emailVerified) {
      toast.error("Please verify your email first");
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      toast.error("Passwords do not match");
      return;
    }

    if (!agreedToTerms) {
      toast.error("You must agree to the terms");
      return;
    }

    dispatch(clearError());
    try {
      const fullMobile = `+${formData.dial_code}${formData.mobile_number}`;
      await dispatch(register({ ...formData, mobile_number: fullMobile })).unwrap();
      toast.success("Registration successful!");
    } catch (err: any) {
      toast.error(err || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute right-20 top-20 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl"></div>
        <div className="absolute bottom-20 left-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"></div>
      </div>

      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-sm md:flex-row">
        {/* Left Side - Form */}
        <div className="order-2 p-8 md:order-1 md:w-1/2 md:p-12">
          <div className="mx-auto max-w-sm">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
              <p className="mt-2 text-sm text-gray-500">Join DoorstepFilings today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Full Name</label>
                <div className="relative">
                  <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 outline-none focus:border-blue-900 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Email Address</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="email"
                      name="email"
                      required
                      disabled={verification.emailVerified}
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-10 outline-none focus:border-blue-900 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                      placeholder="name@example.com"
                    />
                    {verification.emailVerified && <i className="fas fa-check-circle absolute right-3 top-1/2 -translate-y-1/2 text-green-500"></i>}
                  </div>
                  {!verification.emailVerified && (
                    <Button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={verification.loading.email}
                      className="bg-blue-900"
                    >
                      {verification.emailSent ? "Resend" : "Verify"}
                    </Button>
                  )}
                </div>
                {verification.emailSent && !verification.emailVerified && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={verification.emailOtp}
                      onChange={(e) => setVerification({ ...verification, emailOtp: e.target.value.replace(/\D/g, "") })}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-900"
                    />
                    <Button type="button" onClick={handleVerifyOtp} disabled={verification.loading.verify} className="bg-green-600 hover:bg-green-700">
                      Verify
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Mobile Number</label>
                <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-900/10">
                  <button
                    type="button"
                    className="flex min-w-[70px] items-center justify-center gap-1 border-r px-3 hover:bg-gray-100"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  >
                    <img src={`https://flagcdn.com/24x18/${formData.country_iso}.png`} alt="flag" className="h-3 w-4" />
                    <i className="fas fa-chevron-down text-[8px] text-gray-400"></i>
                  </button>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">+{formData.dial_code}</span>
                    <input
                      type="text"
                      required
                      value={formData.mobile_number}
                      onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, "") })}
                      className="w-full border-none bg-transparent py-3 pl-12 pr-4 outline-none"
                      placeholder="Mobile number"
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
                          setFormData({ ...formData, dial_code: c.dialCode, country_iso: c.iso });
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

              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-10 outline-none focus:border-blue-900 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Confirm</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="password_confirmation"
                      required
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-10 outline-none focus:border-blue-900 focus:bg-white focus:ring-2 focus:ring-blue-900/10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">RM ID (Optional)</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      name="rm_id"
                      value={formData.rm_id}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-xs outline-none focus:border-blue-900"
                      placeholder="RM123"
                    />
                    <Button type="button" size="sm" onClick={handleRMSearch} disabled={!formData.rm_id || isSearchingRM} className="bg-blue-900">
                      {isSearchingRM ? <i className="fas fa-spinner fa-spin"></i> : "V"}
                    </Button>
                  </div>
                  {rmDetails && <p className="text-[10px] font-bold text-green-600">RM: {rmDetails.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Referral</label>
                  <input
                    type="text"
                    name="referral_code"
                    value={formData.referral_code}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-xs outline-none focus:border-blue-900"
                    placeholder="CODE"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-blue-900"
                />
                <label htmlFor="terms" className="text-xs text-gray-500 leading-tight">
                  By clicking, you agree to our <Link href="/terms" className="font-bold text-blue-900 hover:underline">Terms</Link> and <Link href="/privacy" className="font-bold text-blue-900 hover:underline">Privacy Policy</Link>.
                </label>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-blue-900 py-6 text-base font-bold shadow-xl shadow-blue-900/20 hover:bg-blue-800">
                {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                Create Account
              </Button>
            </form>

            <div className="mt-6">
              <SocialAuthOptions />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-blue-900 hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Info */}
        <div className="relative order-1 overflow-hidden p-12 text-white md:order-2 md:w-1/2">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&auto=format&fit=crop"
              alt="Team"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/85 to-indigo-900/90"></div>
          </div>
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <h2 className="text-4xl font-bold">Start Your Journey!</h2>
              <p className="mt-4 text-lg text-blue-100">
                Unlock professional financial services and manage your compliance with ease.
              </p>
            </div>
            <div className="mt-8 space-y-6">
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md">
                <p className="italic text-blue-100">&quot;The fastest and most reliable filing service I&apos;ve ever used. Their CA experts are top-notch!&quot;</p>
                <div className="mt-4 flex items-center gap-3">
                  <img src="https://i.pravatar.cc/100?u=rahul" className="h-10 w-10 rounded-full border-2 border-amber-500" alt="Rahul" />
                  <div>
                    <p className="font-bold">Rahul Sharma</p>
                    <p className="text-xs text-blue-300">SME Owner</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <i className="fas fa-check-circle text-amber-400"></i>
                  <span>Zero Hidden Charges</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <i className="fas fa-check-circle text-amber-400"></i>
                  <span>24/7 Expert Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
