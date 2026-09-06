"use client";

import { useState, useEffect, useRef } from "react";
import {
  maskApiKey,
  saveAppConnection,
  verifyBooksApiKey,
  resolveAppLaunchUrl,
  getServerAuthoritativeConnectUrl,
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

type Tab = "browser" | "manual";

export function ConnectBooksModal({
  isOpen,
  onClose,
  existingConnection,
  appConfigData,
  initialError,
  onSuccess,
}: ConnectBooksModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("browser");
  const [apiKey, setApiKey] = useState(existingConnection?.apiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupLoading, setPopupLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const listenerRef = useRef<((e: MessageEvent) => void) | null>(null);

  const targetAppId = appConfigData?.id || "doorstep-books";
  const targetAppName = appConfigData?.name || "Doorstep Books";
  const targetAppUrl = appConfigData
    ? resolveAppLaunchUrl(appConfigData)
    : appConfig.booksAppUrl || "https://books.doorstepfilings.com";

  // If there's an error (e.g. revoked key) start on the manual tab for clarity
  useEffect(() => {
    if (initialError) {
      setError(initialError);
      setActiveTab("manual");
    }
  }, [initialError]);

  // Clean up popup listener on unmount or close
  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        window.removeEventListener("message", listenerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleBrowserSync = async () => {
    setPopupLoading(true);
    setError(null);

    // Get server-authoritative connect URL (never trusts stale client cache)
    const connectUrl = await getServerAuthoritativeConnectUrl(targetAppId);
    if (!connectUrl || connectUrl === "#") {
      setError("Unable to resolve the connection URL. Please try the manual key method.");
      setPopupLoading(false);
      return;
    }

    const origin = window.location.origin;
    const popupUrl = `${connectUrl}?source=DoorstepFilings&origin=${encodeURIComponent(origin)}`;

    // Open popup
    const popup = window.open(
      popupUrl,
      "doorstep-books-connect",
      "width=520,height=620,left=200,top=100,resizable=yes,scrollbars=yes"
    );

    if (!popup) {
      setError("Popup was blocked. Please allow popups for this site and try again.");
      setPopupLoading(false);
      return;
    }

    popupRef.current = popup;

    // Listen for the postMessage from Books /connect page
    const handleMessage = (event: MessageEvent) => {
      // Accept messages only from the Books app URL (security check)
      const allowedOrigin = new URL(connectUrl).origin;
      if (event.origin !== allowedOrigin) return;

      if (event.data?.type === "DOORSTEP_ECOSYSTEM_CONNECT_SUCCESS") {
        const { apiKey: receivedKey, userEmail } = event.data;

        if (!receivedKey) {
          setError("No API key received. Please try the manual method.");
          setPopupLoading(false);
          return;
        }

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
        setSuccessMsg(`${targetAppName} connected successfully! Closing...`);
        setPopupLoading(false);

        // Clean up
        window.removeEventListener("message", handleMessage);
        listenerRef.current = null;
        try { popup.close(); } catch { /* ignore */ }

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    };

    listenerRef.current = handleMessage;
    window.addEventListener("message", handleMessage);

    // Poll for popup closure (user closed without authorizing)
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer);
        if (listenerRef.current) {
          window.removeEventListener("message", listenerRef.current);
          listenerRef.current = null;
        }
        setPopupLoading(false);
      }
    }, 800);
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
                Choose how to authorize your connection
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

        {/* Method Tabs */}
        <div className="flex gap-1 rounded-2xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => { setActiveTab("browser"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              activeTab === "browser"
                ? "bg-white text-emerald-800 shadow-sm border border-emerald-100"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className="fas fa-bolt text-amber-500 text-[10px]" />
            1-Click Browser Sync
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("manual"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              activeTab === "manual"
                ? "bg-white text-blue-900 shadow-sm border border-blue-100"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className="fas fa-key text-[10px]" />
            Manual API Key
          </button>
        </div>

        {/* Tab: 1-Click Browser Sync */}
        {activeTab === "browser" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <i className="fas fa-shield-alt text-sm" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-900">Zero-Password Handshake</p>
                  <p className="text-[11px] text-emerald-700">Authorize directly in your Books session — no copy-paste required</p>
                </div>
              </div>
              <div className="space-y-1.5 pl-10 text-[11px] text-emerald-800">
                <p className="flex items-center gap-1.5"><i className="fas fa-check text-emerald-600" /> Opens Books in a secure popup</p>
                <p className="flex items-center gap-1.5"><i className="fas fa-check text-emerald-600" /> You click &quot;Authorize &amp; Connect&quot; inside Books</p>
                <p className="flex items-center gap-1.5"><i className="fas fa-check text-emerald-600" /> Popup auto-closes, connection saved instantly</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBrowserSync}
              disabled={popupLoading}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-blue-900 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-teal-900/15 transition-all hover:opacity-95 hover:shadow-lg disabled:opacity-60 cursor-pointer"
            >
              {popupLoading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin text-sm" />
                  <span>Waiting for authorization in Books...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-bolt text-amber-300 text-sm" />
                  <span>Open {targetAppName} &amp; Authorize</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-gray-400">
              Not logged into {targetAppName}?{" "}
              <button
                type="button"
                className="text-blue-600 font-semibold hover:underline"
                onClick={() => setActiveTab("manual")}
              >
                Use manual API key instead
              </button>
            </p>
          </div>
        )}

        {/* Tab: Manual API Key */}
        {activeTab === "manual" && (
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
        )}
      </div>
    </div>
  );
}
