"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hooks";
import { logout } from "@/lib/features/auth/auth-slice";
import { useStoredUser } from "@/lib/auth/hooks";
import {
  ConnectedAppConfig,
  AppConnectionData,
  getEcosystemApps,
  getStoredConnectedApps,
  verifyAndLaunchApp,
  launchAppViaServerProxy,
} from "@/lib/auth/connected-apps";

import { ConnectBooksModal } from "@/components/dashboard/connect-books-modal";

type DashboardSidebarProps = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
};

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "fa-th-large" },
  { path: "/dashboard/services", label: "My Services", icon: "fa-clipboard-list" },
  { path: "/dashboard/orders", label: "My Orders", icon: "fa-shopping-bag" },
  { path: "/dashboard/transactions", label: "Transaction History", icon: "fa-history" },
  { path: "/dashboard/documents", label: "Documents", icon: "fa-folder-open" },
  { path: "/dashboard/certificates", label: "Certificates", icon: "fa-award" },
  { path: "/dashboard/reports", label: "Reports", icon: "fa-file-alt" },
  { path: "/dashboard/connected-apps", label: "Connected Apps", icon: "fa-cubes" },
];

export default function DashboardSidebar({
  isOpen,
  setIsOpen,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useStoredUser();

  const [apps, setApps] = useState<ConnectedAppConfig[]>(() => getEcosystemApps());
  const [connections, setConnections] = useState<Record<string, AppConnectionData>>(() =>
    getStoredConnectedApps()
  );
  const [launchingAppId, setLaunchingAppId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ConnectedAppConfig | null>(null);
  const [revokedMessage, setRevokedMessage] = useState<string | null>(null);

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

  const handleLogout = async () => {
    await dispatch(logout()).unwrap();
    router.push("/login");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const handleLaunchApp = async (app: ConnectedAppConfig) => {
    const connection = connections[app.id];

    // No connection at all — open app directly via server-resolved URL (no SSO)
    if (!connection) {
      await launchAppViaServerProxy(app, null);
      return;
    }

    if (connection.status === "error") {
      setSelectedApp(app);
      setRevokedMessage("Your API key was revoked or deleted. Please reconnect with a fresh key.");
      setIsModalOpen(true);
      return;
    }

    setLaunchingAppId(app.id);
    try {
      // First verify the key is still valid, then launch via server proxy
      const launched = await verifyAndLaunchApp(app, connection, (errMsg) => {
        setRevokedMessage(errMsg);
        setSelectedApp(app);
        setIsModalOpen(true);
        refreshData();
      });

      if (launched) {
        setIsOpen(false);
      }
    } finally {
      setLaunchingAppId(null);
    }
  };

  const connectedAppsList = apps.filter((app) => Boolean(connections[app.id]));

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed h-full w-64 transform overflow-y-hidden border-r border-gray-100 bg-white transition-all duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } z-50 flex flex-col`}
      >
        {/* Scrollable Container */}
        <div className="flex flex-1 flex-col overflow-y-auto min-h-0">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/assets/images/logo.png"
                alt="Doorstep Filings"
                width={160}
                height={80}
                className="h-20 w-auto object-contain"
                style={{ width: "auto" }}
              />
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 lg:hidden"
              type="button"
            >
              <i className="fas fa-times text-xl" />
            </button>
          </div>

          <div className="p-4 flex-1">
            <div className="mb-6 rounded-2xl bg-blue-900 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-blue-200">Client Account</p>
                </div>
              </div>
            </div>

            {/* Quick Action: Explore All Services */}
            <div className="mb-4">
              <Link
                href="/services"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:from-blue-800 hover:to-blue-700 hover:shadow-md"
              >
                <i className="fas fa-plus-circle text-sm" />
                <span>Explore All Services</span>
              </Link>
            </div>

            {/* Core Navigation Items */}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    isActive(item.path)
                      ? "bg-blue-50 font-semibold text-blue-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-blue-900"
                  }`}
                >
                  <i className={`fas ${item.icon} w-5 text-center`} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Dynamic Connected Apps Section */}
            {connectedAppsList.length > 0 && (
              <div className="mt-6 pt-5 border-t border-gray-100">
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                    Connected Suite
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Direct SSO
                  </span>
                </div>

                <div className="space-y-1">
                  {connectedAppsList.map((app) => {
                    const connection = connections[app.id];
                    const isError = connection?.status === "error";
                    const isLaunching = launchingAppId === app.id;

                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => void handleLaunchApp(app)}
                        disabled={isLaunching}
                        className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-left transition-all group cursor-pointer ${
                          isError
                            ? "bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100"
                            : "bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-950 border border-emerald-100"
                        }`}
                        title={
                          isError
                            ? "API key revoked. Click to reconnect."
                            : `Launch ${app.name} directly via SSO`
                        }
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${app.color} text-white shadow-xs text-xs`}
                          >
                            {isLaunching ? (
                              <i className="fas fa-circle-notch fa-spin text-xs" />
                            ) : (
                              <i className={`fas ${app.icon} text-xs`} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block truncate text-xs font-bold leading-tight">
                              {app.name}
                            </span>
                            <span
                              className={`block truncate text-[10px] ${
                                isError ? "text-amber-700 font-semibold" : "text-emerald-700"
                              }`}
                            >
                              {isError ? "⚠ Re-connect" : "Launch App"}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center">
                          {isError ? (
                            <span className="flex h-5 items-center justify-center rounded bg-amber-200/80 px-1.5 text-[9px] font-bold text-amber-900">
                              Re-link
                            </span>
                          ) : (
                            <i className="fas fa-external-link-alt text-[10px] text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-gray-100 pt-5">
              <Link
                href="/account"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-gray-600 transition-colors hover:bg-gray-50"
              >
                <i className="fas fa-user-circle w-5 text-center" />
                <span className="text-sm">My Profile</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Container */}
        <div className="shrink-0 p-4 border-t border-gray-100 bg-white space-y-3">
          <button
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
            type="button"
          >
            <i className="fas fa-sign-out-alt w-5 text-center" />
            <span className="text-sm font-medium">Logout</span>
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-3 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100"
          >
            <i className="fas fa-home text-xs" /> Back to Website
          </Link>
        </div>
      </aside>

      {/* Reconnect Modal for Revoked Keys */}
      <ConnectBooksModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setRevokedMessage(null);
        }}
        existingConnection={selectedApp ? connections[selectedApp.id] : undefined}
        appConfigData={selectedApp || apps.find((a) => a.id === "doorstep-books")}
        initialError={revokedMessage}
        onSuccess={() => {
          refreshData();
          setIsModalOpen(false);
          setRevokedMessage(null);
        }}
      />
    </>
  );
}

