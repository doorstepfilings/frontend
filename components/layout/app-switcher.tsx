"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ConnectedAppConfig,
  getEcosystemApps,
  getStoredConnectedApps,
  launchAppViaServerProxy,
  AppConnectionData,
} from "@/lib/auth/connected-apps";



export function AppSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [apps, setApps] = useState<ConnectedAppConfig[]>(() => getEcosystemApps());
  const [connections, setConnections] = useState<Record<string, AppConnectionData>>(() =>
    getStoredConnectedApps()
  );
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setApps(getEcosystemApps());
      setConnections(getStoredConnectedApps());
    };
    window.addEventListener("doorstep-connected-apps-change", handleUpdate);
    window.addEventListener("doorstep-ecosystem-registry-change", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("doorstep-connected-apps-change", handleUpdate);
      window.removeEventListener("doorstep-ecosystem-registry-change", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const syncedCount = Object.keys(connections).length;

  return (
    <div className="relative" ref={menuRef}>
      {/* 9-Dots Google/Zoho Style App Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        title="Doorstep Ecosystem Suite"
        aria-label="Doorstep Suite Apps"
        className={`group relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border transition-all duration-200 ${
          isOpen
            ? "border-blue-200 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20 shadow-sm"
            : "border-gray-200/80 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-blue-900 shadow-xs"
        }`}
      >
        {/* Crisp 9-Dots SVG Icon */}
        <svg
          className={`h-4.5 w-4.5 sm:h-5 sm:w-5 transition-transform duration-200 ${
            isOpen ? "scale-105 text-blue-900" : "text-gray-600 group-hover:text-blue-900"
          }`}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="5" cy="5" r="2.2" />
          <circle cx="12" cy="5" r="2.2" />
          <circle cx="19" cy="5" r="2.2" />
          <circle cx="5" cy="12" r="2.2" />
          <circle cx="12" cy="12" r="2.2" />
          <circle cx="19" cy="12" r="2.2" />
          <circle cx="5" cy="19" r="2.2" />
          <circle cx="12" cy="19" r="2.2" />
          <circle cx="19" cy="19" r="2.2" />
        </svg>

        {syncedCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white text-[9px] font-bold text-white">
            {syncedCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-900 text-white text-xs">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="5" r="2.2" />
                  <circle cx="12" cy="5" r="2.2" />
                  <circle cx="19" cy="5" r="2.2" />
                  <circle cx="5" cy="12" r="2.2" />
                  <circle cx="12" cy="12" r="2.2" />
                  <circle cx="19" cy="12" r="2.2" />
                  <circle cx="5" cy="19" r="2.2" />
                  <circle cx="12" cy="19" r="2.2" />
                  <circle cx="19" cy="19" r="2.2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Doorstep Suite</h3>
                <p className="text-[11px] text-gray-500">Unified Business Platform</p>
              </div>
            </div>
            <Link
              href="/dashboard/connected-apps"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
            >
              <span>Manage</span>
              <i className="fas fa-chevron-right text-[9px]" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto p-0.5">
            {/* Main Portal */}
            <div className="flex flex-col p-3 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-white text-xs shadow-xs">
                  <i className="fas fa-landmark" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded-full">
                  Current
                </span>
              </div>
              <p className="text-xs font-bold text-gray-900">Doorstep Filings</p>
              <p className="text-[11px] text-gray-500 truncate">Legal, Tax &amp; Filings</p>
            </div>

            {/* Dynamic Ecosystem Apps */}
            {apps.map((app) => {
              const connection = connections[app.id];
              const isConnected = Boolean(connection);

              if (app.isReady) {
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      void launchAppViaServerProxy(app, connection);
                    }}
                    className="group flex flex-col p-3 rounded-xl border border-gray-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/30 transition-all shadow-xs hover:shadow-sm text-left w-full"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${app.color} text-white text-xs shadow-xs`}
                      >
                        <i className={`fas ${app.icon}`} />
                      </div>
                      {isConnected ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Synced
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          Connect
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-800 truncate">
                        {app.name}
                      </p>
                      <i className="fas fa-external-link-alt text-[9px] text-gray-400 group-hover:text-emerald-600 shrink-0 ml-1" />
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{app.tagline}</p>
                  </button>
                );
              }

              return (
                <div
                  key={app.id}
                  className="flex flex-col p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/70 opacity-80"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${app.color} text-white text-xs`}
                    >
                      <i className={`fas ${app.icon}`} />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded-full">
                      Soon
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-700 truncate">{app.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{app.tagline}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Doorstep Ecosystem</span>
            </span>
            <Link
              href="/dashboard/connected-apps"
              onClick={() => setIsOpen(false)}
              className="text-blue-600 hover:underline font-semibold"
            >
              All Integrations &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
