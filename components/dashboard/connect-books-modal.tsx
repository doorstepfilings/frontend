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
  const [activeTab, setActiveTab] = useState<Tab>(() => (initialError ? "manual" : "manual"));
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
      setError("Please provide a License Key.");
      return;
    }

    if (!trimmed.toUpperCase().startsWith("DSLIC-") && !trimmed.toUpperCase().startsWith("DSBOK-") && !trimmed.startsWith("ds_") && trimmed.length < 8) {
      setError("Invalid License Key format. Valid keys start with 'DSBOK-', 'DSLIC-', or 'ds_'.");
      return;
    }

    setLoading(true);

    try {
      const verification = await verifyBooksApiKey(trimmed, appConfigData?.apiUrl);
      if (!verification.success) {
        setError(verification.message || `Failed to verify License Key with ${targetAppName}.`);
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

        {/* Method Tabs removed since we only support manual license key now */}

        {/* Tab: Manual License Key */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-16 bg-gray-200 rounded-2xl w-full mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-12 bg-gray-200 rounded-2xl w-full"></div>
            </div>
            <div className="flex justify-end gap-3 pt-3 mt-4 border-t border-gray-100">
              <div className="h-10 bg-gray-200 rounded-2xl w-24"></div>
              <div className="h-10 bg-emerald-200 rounded-2xl w-32"></div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-blue-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-blue-950">
                <i className="fas fa-info-circle text-blue-600" />
                Where to find your License Key:
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
                &rarr; Go to <strong>Settings &gt; License Keys</strong> &rarr; Copy your key.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                {targetAppName} License Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  placeholder={targetAppId.includes("book") ? "DSBOK-XXXX-XXXX-XXXX-XXXX" : "DSLIC-XXXX-XXXX-XXXX-XXXX"}
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
                <>
                  <i className="fas fa-link text-xs" />
                  <span>{existingConnection ? "Update Connection" : "Verify & Connect"}</span>
                </>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
