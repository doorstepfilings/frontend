"use client";

import { isAxiosError } from "axios";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { apiClient } from "@/lib/api/client";

interface ResetPasswordViewProps {
  token: string;
}

export function ResetPasswordView({ token }: ResetPasswordViewProps) {
  const searchParams = useSearchParams();
  const prefilledEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);

  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post<{ message?: string }>("/user/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      setMessage(response.data?.message || "Password reset successful. You can now login.");
      setPassword("");
      setPasswordConfirmation("");
    } catch (requestError) {
      const errorMessage = isAxiosError(requestError)
        ? (requestError.response?.data?.message ?? requestError.message)
        : requestError instanceof Error
          ? requestError.message
          : "Failed to reset password.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Set a new password for your account."
      footerLink={{ to: "/login", label: "Back to Login" }}
    >
      {message && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm text-emerald-800">
          <i className="fas fa-circle-check mt-0.5" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border-l-4 border-rose-500 bg-rose-50 p-4 text-sm text-rose-800">
          <i className="fas fa-exclamation-circle mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
          <div className="relative">
            <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-900"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">New Password</label>
          <div className="relative">
            <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-900"
              placeholder="Minimum 8 characters"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm Password</label>
          <div className="relative">
            <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-900"
              placeholder="Re-enter your password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:from-blue-800 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin" />
              Resetting...
            </>
          ) : (
            <>
              Reset Password
              <i className="fas fa-key" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
