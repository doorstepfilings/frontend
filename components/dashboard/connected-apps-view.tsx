"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ConnectedAppConfig,
  getEcosystemApps,
  getStoredConnectedApps,
  removeAppConnection,
  verifyAndLaunchApp,
  AppConnectionData,
} from "@/lib/auth/connected-apps";
import { ConnectBooksModal } from "@/components/dashboard/connect-books-modal";

type FilterTab = "all" | "connected" | "ready" | "upcoming";

export function ConnectedAppsView() {
  const [apps, setApps] = useState<ConnectedAppConfig[]>(() => getEcosystemApps());
  const [connections, setConnections] = useState<Record<string, AppConnectionData>>(() =>
    getStoredConnectedApps()
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ConnectedAppConfig | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const refreshData = () => {
    setApps(getEcosystemApps());
    setConnections(getStoredConnectedApps());
  };

  useEffect(() => {
    const handleUpdate = () => refreshData();
    window.addEventListener("doorstep-connected-apps-change", handleUpdate);
    window.addEventListener("doorstep-ecosystem-registry-change", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("doorstep-connected-apps-change", handleUpdate);
      window.removeEventListener("doorstep-ecosystem-registry-change", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const handleDisconnect = (appId: string) => {
    if (confirm("Are you sure you want to disconnect this application?")) {
      removeAppConnection(appId);
      refreshData();
    }
  };

  const openConnectModal = (app: ConnectedAppConfig) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const connectedCount = Object.keys(connections).length;
  const readyCount = apps.filter((a) => a.isReady).length;

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const isConnected = Boolean(connections[app.id]);
      const matchesSearch =
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === "connected") return isConnected;
      if (activeTab === "ready") return app.isReady && !isConnected;
      if (activeTab === "upcoming") return !app.isReady;
      return true;
    });
  }, [apps, connections, searchQuery, activeTab]);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-blue-900 transition-colors">
              Dashboard
            </Link>
            <i className="fas fa-chevron-right text-[10px] text-gray-300" />
            <span className="text-blue-950 font-bold">Connected Apps</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Connected Apps &amp; Suite
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900 border border-blue-200">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              Ecosystem Hub
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Connect your DoorstepFilings account with Doorstep Books, HRMS, and ERP for 1-click seamless access.
          </p>
        </div>
      </div>

      {/* Quick Ecosystem Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Connected &amp; Synced</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-600">{connectedCount}</span>
                <span className="text-xs font-semibold text-gray-400">/ {apps.length} Products</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-xs">
              <i className="fas fa-link text-base" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Available Products</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-blue-900">{readyCount}</span>
                <span className="text-xs font-semibold text-gray-400">Ready for Launch</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-900 shadow-xs">
              <i className="fas fa-cubes text-base" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">SSO Auth Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-sm font-bold text-gray-900">1-Click Token Handshake</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 shadow-xs">
              <i className="fas fa-shield-alt text-base" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner with Ecosystem Visual Graphic */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl shadow-blue-950/10">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-blue-200 backdrop-blur-md border border-white/10">
              <i className="fas fa-bolt text-amber-300" />
              <span>1-Click Browser Sync Enabled</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              One Doorstep Account. Total Business Operations.
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Connect **Doorstep Books** directly in your browser with 1-click authorization. Jump seamlessly between legal filings, GST invoicing, client ledgers, and cash flow without typing passwords.
            </p>
          </div>

          {/* Interactive Ecosystem Visual Pipeline */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 bg-white/10 p-3 sm:p-4 rounded-2xl border border-white/10 backdrop-blur-md shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-blue-800 text-white text-base shadow-sm border border-blue-600">
                <i className="fas fa-landmark" />
              </div>
              <span className="text-[10px] font-bold text-blue-200">Filings</span>
            </div>

            <div className="h-0.5 w-6 sm:w-8 bg-gradient-to-r from-blue-500 to-emerald-400 relative">
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white text-base shadow-sm border border-emerald-400">
                <i className="fas fa-calculator" />
              </div>
              <span className="text-[10px] font-bold text-emerald-300">Books</span>
            </div>

            <div className="h-0.5 w-6 sm:w-8 bg-gradient-to-r from-emerald-400 to-indigo-400" />

            <div className="flex flex-col items-center gap-1 opacity-70">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-indigo-900 text-indigo-300 text-base border border-indigo-700">
                <i className="fas fa-users-cog" />
              </div>
              <span className="text-[10px] font-medium text-indigo-200">HRMS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-blue-900 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All Products ({apps.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("connected")}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === "connected"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Connected ({connectedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ready")}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === "ready"
                ? "bg-blue-900 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Available ({readyCount - connectedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === "upcoming"
                ? "bg-blue-900 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Coming Soon ({apps.length - readyCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search products & features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 pl-9 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/10 shadow-2xs"
          />
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {filteredApps.map((app) => {
          const connection = connections[app.id];
          const isConnected = Boolean(connection);
          const isRevoked = connection?.status === "error";

          return (
            <div
              key={app.id}
              className={`group flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-xl ${
                isRevoked
                  ? "border-amber-300 ring-2 ring-amber-500/15"
                  : isConnected
                  ? "border-emerald-200 ring-2 ring-emerald-500/10"
                  : "border-gray-200/80 hover:border-gray-300"
              }`}
            >
              <div>
                {/* Top Bar: Icon, Category & Status Pill */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div
                    className={`flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br ${app.color} text-white shadow-md transition-transform duration-300 group-hover:scale-105`}
                  >
                    <i className={`fas ${app.icon} text-xl`} />
                  </div>

                  {app.isReady ? (
                    isRevoked ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300 shadow-2xs">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        Key Revoked / Action Needed
                      </span>
                    ) : isConnected ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/80 shadow-2xs">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Connected &amp; Synced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-2xs">
                        <i className="fas fa-bolt text-amber-500 text-[10px]" />
                        1-Click Ready
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                      <i className="fas fa-clock text-[10px]" />
                      Coming Soon
                    </span>
                  )}
                </div>

                {/* App Name, Tagline & Direct Link */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-900 transition-colors">
                    {app.name}
                  </h3>
                  <p className="text-xs font-semibold text-blue-900 mt-0.5">{app.tagline}</p>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{app.description}</p>
                </div>

                {/* Revocation Warning Alert */}
                {isRevoked && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900 space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <i className="fas fa-exclamation-triangle text-amber-600" />
                      <span>API Key Revoked or Deleted</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Your connection credentials were removed or expired in {app.name}. Click &quot;Re-connect Now&quot; below to restore 1-click access.
                    </p>
                  </div>
                )}

                {/* Capabilities List */}
                <div className="space-y-1.5 border-t border-gray-100 pt-3.5 mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Included Capabilities
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {app.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[9px]">
                          <i className="fas fa-check" />
                        </div>
                        <span className="truncate">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Connection Meta Box */}
                {isConnected && connection && !isRevoked && (
                  <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 p-3.5 text-xs space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Auth Key:</span>
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono font-bold text-emerald-950 bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
                          {connection.maskedKey}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyKey(connection.apiKey, app.id)}
                          title="Copy Auth Key"
                          className="h-6 w-6 flex items-center justify-center rounded text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          <i
                            className={`fas ${
                              copiedKeyId === app.id ? "fa-check text-emerald-600" : "fa-copy"
                            } text-xs`}
                          />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-emerald-200/50">
                      <span>Sync Engine:</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Zero-Password Active
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-100 pt-4 mt-2">
                {app.isReady ? (
                  isRevoked ? (
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => openConnectModal(app)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-3 text-xs font-bold text-white shadow-md shadow-amber-700/20 transition-all hover:from-amber-700 hover:to-amber-800 cursor-pointer"
                      >
                        <i className="fas fa-sync-alt text-xs" />
                        <span>Re-connect with 1-Click Sync</span>
                      </button>
                      <div className="flex items-center justify-end px-1">
                        <button
                          type="button"
                          onClick={() => handleDisconnect(app.id)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                        >
                          <i className="fas fa-trash-alt text-[10px] mr-1" />
                          Remove Connection
                        </button>
                      </div>
                    </div>
                  ) : isConnected ? (
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={async () => {
                          const launched = await verifyAndLaunchApp(app, connection, () => {
                            openConnectModal(app);
                            refreshData();
                          });
                          if (!launched) refreshData();
                        }}
                        className="group/btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-3 text-xs font-bold text-white shadow-md shadow-emerald-700/20 transition-all hover:from-emerald-700 hover:to-teal-800 hover:shadow-lg hover:shadow-emerald-700/30 cursor-pointer"
                      >
                        <i className="fas fa-external-link-alt text-xs transition-transform group-hover/btn:translate-x-0.5" />
                        <span>Launch {app.name}</span>
                      </button>
                      <div className="flex items-center justify-between px-1">
                        <button
                          type="button"
                          onClick={() => openConnectModal(app)}
                          className="text-xs font-semibold text-blue-900 hover:text-blue-700 transition-colors cursor-pointer"
                        >
                          <i className="fas fa-sync-alt text-[10px] mr-1" />
                          Re-Sync Settings
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDisconnect(app.id)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                        >
                          <i className="fas fa-unlink text-[10px] mr-1" />
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openConnectModal(app)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-blue-900 px-4 py-3 text-xs font-bold text-white shadow-md shadow-teal-900/15 transition-all hover:opacity-95 hover:shadow-lg cursor-pointer"
                    >
                      <i className="fas fa-bolt text-amber-300 text-xs" />
                      <span>Connect with 1-Click Sync</span>
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-xs font-semibold text-gray-400 cursor-not-allowed"
                  >
                    <i className="fas fa-lock text-xs" />
                    <span>Beta In Development</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>


      {/* Integration Guide Section */}
      <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
            <i className="fas fa-shield-alt text-sm" />
          </div>
          <span>How 1-Click Ecosystem Sync Works</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-gray-600">
          <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-2">
            <p className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-900 text-white text-[11px]">1</span>
              1-Click Browser Auth
            </p>
            <p className="leading-relaxed text-gray-500">
              Click &quot;Connect with 1-Click Sync&quot; to authorize the connection directly in your browser. No manual key copying required.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-2">
            <p className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white text-[11px]">2</span>
              Hidden POST Launch
            </p>
            <p className="leading-relaxed text-gray-500">
              Launching Books passes credentials privately inside a background POST request. Zero secrets are exposed in the URL bar or history.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-2">
            <p className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white text-[11px]">3</span>
              Independent Access
            </p>
            <p className="leading-relaxed text-gray-500">
              You can still open Books directly with your email/password credentials or manage separate subscription tiers.
            </p>
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      <ConnectBooksModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        existingConnection={selectedApp ? connections[selectedApp.id] : connections["doorstep-books"]}
        appConfigData={selectedApp || apps.find((a) => a.id === "doorstep-books")}
        onSuccess={() => refreshData()}
      />
    </div>
  );
}
