"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { AuthShowcasePanel } from "@/components/auth/auth-showcase-panel";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { SocialAuthOptions } from "@/components/auth/social-auth-options";
import { registerAndSignIn } from "@/lib/auth/auth-client";
import { getDefaultRedirectPath } from "@/lib/auth/storage";
import { useStoredUser } from "@/lib/auth/hooks";
import {
  AUTH_ERROR_MESSAGES,
  getFriendlyAuthErrorMessage,
  logAuthError,
} from "@/lib/auth/error-helper";

type OtpResponse = {
  data?: {
    otp?: string;
  };
  message?: string;
  success?: boolean;
};

type RegionalManagerResult = {
  id?: number;
  name?: string;
  email?: string;
  rm_unique_id?: string;
};

type RegionalManagerResponse = {
  data?: RegionalManagerResult;
  message?: string;
};

// Common countries with dial codes for the dropdown
const COUNTRIES = [
  { iso: "in", name: "India", dialCode: "91", flag: "https://flagcdn.com/24x18/in.png" },
  { iso: "us", name: "United States", dialCode: "1", flag: "https://flagcdn.com/24x18/us.png" },
  { iso: "gb", name: "United Kingdom", dialCode: "44", flag: "https://flagcdn.com/24x18/gb.png" },
  { iso: "au", name: "Australia", dialCode: "61", flag: "https://flagcdn.com/24x18/au.png" },
  { iso: "ca", name: "Canada", dialCode: "1", flag: "https://flagcdn.com/24x18/ca.png" },
  { iso: "de", name: "Germany", dialCode: "49", flag: "https://flagcdn.com/24x18/de.png" },
  { iso: "fr", name: "France", dialCode: "33", flag: "https://flagcdn.com/24x18/fr.png" },
  { iso: "jp", name: "Japan", dialCode: "81", flag: "https://flagcdn.com/24x18/jp.png" },
  { iso: "sg", name: "Singapore", dialCode: "65", flag: "https://flagcdn.com/24x18/sg.png" },
  { iso: "ae", name: "United Arab Emirates", dialCode: "971", flag: "https://flagcdn.com/24x18/ae.png" },
];

export function RegisterView() {
  const router = useRouter();

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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [rmDetails, setRmDetails] = useState<RegionalManagerResult | null>(null);
  const [rmLoading, setRmLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const user = useStoredUser();

  useEffect(() => {
    if (user) {
      router.replace(getDefaultRedirectPath(user));
    }
  }, [router, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setFormData((prev) => ({
      ...prev,
      country_iso: country.iso,
      dial_code: country.dialCode,
    }));
    setShowCountryDropdown(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.mobile_number || formData.mobile_number.length < 5) {
      newErrors.mobile_number = "Please enter a valid mobile number";
    }

    if (!verification.emailVerified) {
      newErrors.email = "Please verify your email address";
    }

    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = "Passwords do not match";
    }

    if (!agreedToTerms) {
      newErrors.terms = "You must agree to the terms and conditions";
    }

    return newErrors;
  };

  const sendOtp = async () => {
    if (!formData.email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }

    setVerification((prev) => ({ ...prev, loading: { ...prev.loading, email: true } }));
    try {
      const response = await apiClient.post<OtpResponse>("/user/send-otp", {
        type: "email",
        value: formData.email,
      });
      setVerification((prev) => ({ ...prev, emailSent: true, emailOtp: "" }));
    } catch (err) {
      logAuthError("Registration OTP request failed", err);
      setVerification((prev) => ({ ...prev, emailSent: false, emailOtp: "" }));
      setErrors((prev) => ({
        ...prev,
        email: getFriendlyAuthErrorMessage(err, AUTH_ERROR_MESSAGES.GENERIC),
      }));
    } finally {
      setVerification((prev) => ({ ...prev, loading: { ...prev.loading, email: false } }));
    }
  };

  const verifyOtp = async () => {
    const otp = verification.emailOtp;
    if (!otp) return;

    setVerification((prev) => ({ ...prev, loading: { ...prev.loading, verify: true } }));
    try {
      const response = await apiClient.post<OtpResponse>("/user/verify-otp", {
        type: "email",
        value: formData.email,
        otp,
      });

      if (response.data?.success || response.data?.message === "OTP verified") {
        setVerification((prev) => ({ ...prev, emailVerified: true }));
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    } catch (err) {
      logAuthError("Registration OTP verification failed", err);
      setErrors((prev) => ({
        ...prev,
        email: getFriendlyAuthErrorMessage(err, AUTH_ERROR_MESSAGES.INVALID_VERIFICATION_CODE),
      }));
    } finally {
      setVerification((prev) => ({ ...prev, loading: { ...prev.loading, verify: false } }));
    }
  };

  const handleRMSearch = async () => {
    if (!formData.rm_id) return;

    setRmLoading(true);
    setRmDetails(null);
    try {
      const response = await apiClient.get<RegionalManagerResponse>("/public/search-rm", {
        params: { rm_unique_id: formData.rm_id },
      });
      setRmDetails(response.data?.data ?? null);
    } catch (err) {
      logAuthError("Relationship manager lookup failed", err);
      setErrors((prev) => ({
        ...prev,
        rm_id: getFriendlyAuthErrorMessage(err, AUTH_ERROR_MESSAGES.ACCOUNT_NOT_FOUND),
      }));
    } finally {
      setRmLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const fullMobile = `+${formData.dial_code}${formData.mobile_number}`;

    const submissionData = {
      ...formData,
      mobile_number: fullMobile,
      referral_code: formData.referral_code || undefined,
      rm_id: formData.rm_id || undefined,
    };

    try {
      const result = await registerAndSignIn(submissionData);
      router.replace(getDefaultRedirectPath(result.user));
    } catch (err) {
      const errMsg = getFriendlyAuthErrorMessage(err, AUTH_ERROR_MESSAGES.GENERIC);
      const newErrors: Record<string, string> = {};
      if (errMsg.toLowerCase().includes("mobile")) {
        newErrors.mobile_number = errMsg;
      } else if (errMsg.toLowerCase().includes("email")) {
        newErrors.email = errMsg;
      } else {
        newErrors.message = errMsg;
      }
      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout accentLayout="mirrored">
      {/* Left Side - Form */}
      <div className="order-2 w-full p-6 sm:p-8 md:order-1 md:w-1/2 md:p-12">
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
            <h2 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">Create Account</h2>
            <p className="text-sm text-slate-500 sm:text-base">Join us for expert financial services</p>
          </div>

            {errors.message && (
              <div className="mb-6 flex items-center gap-2 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">
                <i className="fas fa-exclamation-circle" />
                {errors.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full Name
                </label>
                <div className="relative">
                  <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full rounded-xl border py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-900 ${errors.name ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"
                      }`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      disabled={verification.emailVerified}
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full rounded-xl border py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-900 ${errors.email ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"
                        } ${verification.emailVerified ? "bg-green-50" : "focus:bg-white"}`}
                      placeholder="name@company.com"
                    />
                    {verification.emailVerified && (
                      <i className="fas fa-check-circle absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                  {!verification.emailVerified && (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={verification.loading.email}
                      className="min-w-20 rounded-xl bg-blue-900 px-4 py-3.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                      {verification.loading.email ? "..." : verification.emailSent ? "Resend" : "Verify"}
                    </button>
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
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-900"
                    />
                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={verification.loading.verify}
                      className="rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Verify OTP
                    </button>
                  </div>
                )}
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="relative">
                      {/* Country Dropdown */}
                      <div
                        className="absolute bottom-0 left-0 top-0 flex w-16 cursor-pointer items-center justify-center rounded-l-xl border-r border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      >
                        <img
                          src={`https://flagcdn.com/24x18/${formData.country_iso.toLowerCase()}.png`}
                          alt={`${formData.country_iso} flag`}
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
                        name="mobile_number"
                        value={formData.mobile_number}
                        onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value.replace(/[^\d]/g, "").slice(0, 10) })}
                        className={`w-full rounded-xl border py-3.5 pl-20 pr-4 text-slate-900 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-900 ${errors.mobile_number ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"
                          }`}
                        placeholder="Enter mobile number"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>
                </div>
                {errors.mobile_number && <p className="mt-1 text-xs text-red-500">{errors.mobile_number}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full rounded-xl border py-3.5 pl-12 pr-12 text-slate-900 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-900 ${errors.password ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"
                      }`}
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className={`w-full rounded-xl border py-3.5 pl-12 pr-12 text-slate-900 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-900 ${errors.password_confirmation ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"
                      }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`} />
                  </button>
                </div>
                {errors.password_confirmation && <p className="mt-1 text-xs text-red-500">{errors.password_confirmation}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Referral Code (Optional)
                  </label>
                  <div className="relative">
                    <i className="fas fa-ticket-alt absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="referral_code"
                      value={formData.referral_code}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-900"
                      placeholder="REF123"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    RM ID (Optional)
                  </label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <i className="fas fa-id-badge absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="rm_id"
                        value={formData.rm_id}
                        onChange={handleChange}
                        className={`w-full rounded-xl border py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-900 ${errors.rm_id ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"
                          }`}
                        placeholder="RMMHMUM260001"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRMSearch}
                      disabled={rmLoading || !formData.rm_id}
                      className="rounded-xl bg-blue-900 px-4 py-3.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                      {rmLoading ? <i className="fas fa-spinner fa-spin" /> : "Verify"}
                    </button>
                  </div>
                  {rmDetails && (
                    <p className="mt-1 flex items-center gap-1 font-medium text-green-600 text-xs">
                      <i className="fas fa-check-circle" />
                      Associated RM: {rmDetails.name}
                    </p>
                  )}
                  {errors.rm_id && <p className="mt-1 text-xs text-red-500">{errors.rm_id}</p>}
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                />
                <label htmlFor="terms" className="text-sm text-slate-600">
                  I agree to the{" "}
                  <Link href="/terms" className="font-semibold text-blue-900 hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="font-semibold text-blue-900 hover:underline">Privacy Policy</Link>
                </label>
              </div>
              {errors.terms && <p className="text-xs text-red-500">{errors.terms}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:from-blue-800 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <i className="fas fa-user-plus" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6">
              <SocialAuthOptions />
            </div>

            <div className="mt-8 text-center">
              <p className="text-slate-600">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-blue-900 hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>

      <AuthShowcasePanel
        className="order-1 md:order-2"
        imageSrc="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&auto=format&fit=crop"
        imageAlt="Business Office Team"
        title="Start Your Journey!"
        description="Create an account today and unlock access to our premium financial, taxation, and business advisory services."
      >
        <div className="relative z-10 mt-8">
          <div className="mb-6 rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-4">
              <img src="/assets/images/testimonials/Ravishankar_Water_Coat.png" alt="Client" className="h-12 w-12 rounded-full border-2 border-amber-500 object-cover" />
              <div>
                <p className="font-semibold">Ravishankar Shukla</p>
                <p className="text-sm text-blue-200">Business Owner</p>
              </div>
            </div>
            <p className="italic text-blue-100">
              &quot;Doorstepfilings has transformed how I manage my business finances. The expert guidance and seamless service have been invaluable. Highly recommended!&quot;
            </p>
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <i key={star} className="fas fa-star text-sm text-amber-400" />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <i className="fas fa-check-circle text-amber-400" />
              <span>Free Initial Consultation</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <i className="fas fa-check-circle text-amber-400" />
              <span>Expert CA Guidance</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <i className="fas fa-check-circle text-amber-400" />
              <span>24/7 Online Support</span>
            </div>
          </div>
        </div>
      </AuthShowcasePanel>
    </AuthSplitLayout>
  );
}
