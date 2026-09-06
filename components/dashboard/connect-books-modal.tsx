"use client";

import { useState } from "react";
import {
  maskApiKey,
  saveAppConnection,
  verifyBooksApiKey,
  AppConnectionData,
  ConnectedAppConfig,
} from "@/lib/auth/connected-apps";
import { appConfig } from "@/lib/config";

interface ConnectBooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingConnection?: AppConnectionData | null;
  appConfigData?: ConnectedAppConfig | null;
  initialError?: string | null;
  onSuccess: () => void;
}

export function ConnectBooksModal({
  isOpen,
  onClose,
  existingConnection,
  appConfigData,
  initialError,
  onSuccess,
}: ConnectBooksModalProps) {
  const [apiKey, setApiKey] = useState(existingConnection?.apiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const targetAppId = appConfigData?.id || "doorstep-books";
  const targetAppName = appConfigData?.name || "Doorstep Books";
  const targetAppUrl = appConfigData?.url || appConfig.booksAppUrl;

  if (!isOpen) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError("Please provide an API Key.");
      return;
    }

    if (!trimmed.startsWith("ds_") && trimmed.length < 8) {
      setError("Invalid API Key format. Valid keys start with 'ds_'.");
      return;
    }

    setLoading(true);

    try {
      const verification = await verifyBooksApiKey(trimmed, appConfigData?.apiUrl);
      if (!verification.success) {
        setError(verification.message || `Failed to verify API Key with ${targetAppName}.`);
        setLoading(false);
        return;
      }

      const connectionData: AppConnectionData = {
        appId: targetAppId,
        apiKey: trimmed,
        maskedKey: maskApiKey(trimmed),
        connectedAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
        status: "connected",
      };

      saveAppConnection(connectionData);
      setSuccessMsg(`${targetAppName} connected successfully!`);

      setTimeout(() => {
        setLoading(false);
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl transition-all border border-gray-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md">
              <i className={`fas ${appConfigData?.icon || "fa-calculator"} text-lg`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {existingConnection ? `Manage ${targetAppName}` : `Connect ${targetAppName}`}
              </h2>
              <p className="text-xs text-gray-500">
                Authenticate with your secure API Key
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
            type="button"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            <i className="fas fa-exclamation-circle text-sm shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
            <i className="fas fa-check-circle text-sm shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* API Key Form */}
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-blue-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-blue-950">
              <i className="fas fa-info-circle text-blue-600" />
              Where to find your API Key:
            </p>
            <p className="text-blue-900/90 text-[11px] leading-relaxed">
              Log in to{" "}
              <a
                href={targetAppUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold underline hover:text-blue-700"
              >
                {targetAppName}
              </a>{" "}
              &rarr; Go to <strong>Settings &gt; API Keys</strong> &rarr; Copy your key.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              {targetAppName} API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                placeholder="ds_xxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={loading}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 pr-20 font-mono text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-50 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors p-1 cursor-pointer"
              >
                <i className={`fas ${showKey ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-700/20 hover:from-emerald-700 hover:to-teal-800 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin text-xs" />
                  <span>Verifying Key...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-link text-xs" />
                  <span>{existingConnection ? "Update Connection" : "Verify & Connect"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
