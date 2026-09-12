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
    <div className="space-y-8 pb-12">
      {/* Themed Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <Link href="/dashboard" className="hover:text-blue-900 transition-colors">
            Dashboard
          </Link>
          <i className="fas fa-chevron-right text-[10px] text-gray-300" />
          <span className="text-blue-950 font-bold">Doorstep Apps</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Doorstep Apps
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900 border border-blue-200">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            Ecosystem
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Connect your DoorstepFilings account with other products to streamline your workflow.
        </p>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(["all", "connected", "ready", "upcoming"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-blue-900 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab === "all" && `All Products (${apps.length})`}
              {tab === "connected" && `Connected (${connectedCount})`}
              {tab === "ready" && `Available (${readyCount - connectedCount})`}
              {tab === "upcoming" && `Coming Soon (${apps.length - readyCount})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pl-10 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/10 shadow-2xs"
          />
          <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredApps.map((app) => {
          const connection = connections[app.id];
          const isConnected = Boolean(connection);
          const isRevoked = connection?.status === "error";

          return (
            <div
              key={app.id}
              className={`group flex flex-col justify-between rounded-3xl border bg-white p-6 transition-all duration-300 hover:shadow-xl ${
                isRevoked
                  ? "border-amber-300 ring-2 ring-amber-500/15"
                  : isConnected
                  ? "border-emerald-200 ring-2 ring-emerald-500/10 shadow-sm"
                  : "border-gray-200/80 hover:border-gray-300 shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${app.color} text-white shadow-md transition-transform duration-300 group-hover:scale-105`}
                  >
                    <i className={`fas ${app.icon} text-xl`} />
                  </div>
                  
                  {app.isReady ? (
                    isRevoked ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300 shadow-2xs">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        Action Needed
                      </span>
                    ) : isConnected ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/80 shadow-2xs">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200 shadow-2xs">
                        Available
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                      <i className="fas fa-clock text-[10px]" />
                      Coming Soon
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-blue-900 transition-colors">
                    {app.name}
                  </h3>
                  <p className="text-xs font-semibold text-blue-900 mt-0.5">{app.tagline}</p>
                </div>
                
                <p className="text-xs text-gray-500 mb-6 leading-relaxed line-clamp-3">
                  {app.description}
                </p>

                {isConnected && connection && !isRevoked && (
                  <div className="mb-6 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 p-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-900 font-bold">License Key</span>
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono font-bold text-emerald-950 bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
                          {connection.maskedKey}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyKey(connection.apiKey, app.id)}
                          title="Copy Key"
                          className="h-6 w-6 flex items-center justify-center rounded text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          <i className={`fas ${copiedKeyId === app.id ? "fa-check" : "fa-copy"}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-5">
                {app.isReady ? (
                  isRevoked ? (
                    <div className="flex flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={() => openConnectModal(app)}
                        className="w-full rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 transition-colors"
                      >
                        Reconnect
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDisconnect(app.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors text-center"
                      >
                        Remove Connection
                      </button>
                    </div>
                  ) : isConnected ? (
                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          const launched = await verifyAndLaunchApp(app, connection, () => {
                            openConnectModal(app);
                            refreshData();
                          });
                          if (!launched) refreshData();
                        }}
                        className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-3 text-xs font-bold text-white shadow-md shadow-emerald-700/20 hover:from-emerald-700 hover:to-teal-800 transition-all"
                      >
                        <i className="fas fa-external-link-alt mr-2" />
                        Launch App
                      </button>
                      <div className="flex items-center justify-between px-2">
                        <button
                          type="button"
                          onClick={() => openConnectModal(app)}
                          className="text-xs font-semibold text-blue-900 hover:text-blue-700 transition-colors"
                        >
                          Configure
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDisconnect(app.id)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openConnectModal(app)}
                      className="w-full rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 px-4 py-3 text-xs font-bold text-white shadow-md shadow-blue-900/20 hover:from-blue-800 hover:to-indigo-800 transition-all"
                    >
                      Connect App
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-xs font-semibold text-gray-400 cursor-not-allowed"
                  >
                    In Development
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
