"use client";

import { isAxiosError } from "axios";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { apiClient } from "@/lib/api/client";

export function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiClient.post<{ message?: string }>("/user/forgot-password", {
        email,
      });

      setMessage(response.data?.message || "If your email is registered, a reset link has been sent.");
    } catch (requestError) {
      const errorMessage = isAxiosError(requestError)
        ? (requestError.response?.data?.message ?? requestError.message)
        : requestError instanceof Error
          ? requestError.message
          : "Unable to process request right now.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Enter your registered email to receive a reset link."
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

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:from-blue-800 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin" />
              Sending...
            </>
          ) : (
            <>
              Send Reset Link
              <i className="fas fa-arrow-right" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-500">
          If your email is registered, you will receive a reset link shortly.
        </p>
      </form>
    </AuthShell>
  );
}
