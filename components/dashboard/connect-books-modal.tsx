"use client";

import { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState<"browser" | "manual">("browser");
  const [apiKey, setApiKey] = useState(existingConnection?.apiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [browserSyncLoading, setBrowserSyncLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const targetAppId = appConfigData?.id || "doorstep-books";
  const targetAppName = appConfigData?.name || "Doorstep Books";
  const targetAppUrl = appConfigData?.url || appConfig.booksAppUrl;

  // Listen for 1-Click Browser Sync message from popup
  useEffect(() => {
    if (!isOpen) return;

    const handleBrowserMessage = (event: MessageEvent) => {
      if (event.data?.type === "DOORSTEP_ECOSYSTEM_CONNECT_SUCCESS") {
        const receivedKey = event.data.apiKey;
        const userEmail = event.data.userEmail;

        if (receivedKey) {
          const connectionData: AppConnectionData = {
            appId: targetAppId,
            apiKey: receivedKey,
            maskedKey: maskApiKey(receivedKey),
            connectedAt: new Date().toISOString(),
            lastSyncedAt: new Date().toISOString(),
            status: "connected",
            accountEmail: userEmail,
          };

          saveAppConnection(connectionData);
          setSuccessMsg(`${targetAppName} synced & connected via Browser successfully!`);
          setBrowserSyncLoading(false);

          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1200);
        }
      }
    };

    window.addEventListener("message", handleBrowserMessage);
    return () => {
      window.removeEventListener("message", handleBrowserMessage);
    };
  }, [isOpen, targetAppId, targetAppName, onSuccess, onClose]);

  if (!isOpen) return null;

  const handleLaunchBrowserSync = () => {
    setError(null);
    setBrowserSyncLoading(true);

    const connectUrl = `${targetAppUrl}/connect?source=DoorstepFilings&origin=${encodeURIComponent(
      window.location.origin
    )}`;

    const width = 520;
    const height = 640;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      connectUrl,
      "DoorstepConnectPopup",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
    );

    if (!popup) {
      setError("Pop-up blocked! Please allow pop-ups for this site to use 1-Click Browser Sync.");
      setBrowserSyncLoading(false);
    }
  };

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
      const verification = await verifyBooksApiKey(trimmed);
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
      setSuccessMsg(`${targetAppName} connected & synced successfully!`);

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
                Instant 1-Click Sync &amp; Zero-Password Launch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            type="button"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("browser")}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "browser"
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="fas fa-bolt text-amber-500 text-xs" />
            <span>1-Click Browser Sync</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "manual"
                ? "bg-white text-blue-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="fas fa-key text-xs" />
            <span>Manual API Key</span>
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

        {/* Tab 1: 1-Click Browser Sync */}
        {activeTab === "browser" ? (
          <div className="space-y-4 py-1">
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 p-5 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 text-xl shadow-xs">
                <i className="fas fa-network-wired" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">
                  Automatic Browser Handshake
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Click below to open a secure authorization window with **{targetAppName}**. We will link your workspace automatically without any manual copy-pasting.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLaunchBrowserSync}
                  disabled={browserSyncLoading}
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-700/25 hover:from-emerald-700 hover:to-teal-800 transition-all cursor-pointer"
                >
                  {browserSyncLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin text-sm" />
                      <span>Waiting for Authorization in Browser...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-bolt text-amber-300" />
                      <span>Connect with {targetAppName} in 1-Click</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-center text-gray-400">
              🔒 Protected by End-to-End Cryptographic Handshake
            </p>
          </div>
        ) : (
          /* Tab 2: Manual API Key Form */
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
                &rarr; Go to <strong>Settings &gt; API Keys</strong> &rarr; Copy key.
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors p-1"
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
                className="rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-700/20 hover:from-emerald-700 hover:to-teal-800 transition-all disabled:opacity-50"
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
        )}
      </div>
    </div>
  );
}
