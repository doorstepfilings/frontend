"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  Edit2,
  Globe,
  Layers3,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useConfirm } from "@/hooks/use-confirm";
import {
  ConnectedAppConfig,
  getEcosystemApps,
  saveEcosystemApp,
  deleteEcosystemApp,
  resetEcosystemAppsToDefault,
  syncEcosystemAppsFromServer,
} from "@/lib/auth/connected-apps";

export function ConnectedProductsView() {
  const { confirm, ConfirmDialog } = useConfirm();

  const [apps, setApps] = useState<ConnectedAppConfig[]>(() => getEcosystemApps());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ConnectedAppConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "planned">("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Direct Form States (ONLY Product Name & Website URL per user requirement)
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const refreshList = () => {
    setApps(getEcosystemApps());
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const fresh = await syncEcosystemAppsFromServer();
      setApps(fresh);
      setLastSyncTime(new Date());
      toast.success("Ecosystem registry synced with server");
    } catch {
      toast.error("Failed to sync with server");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    void syncEcosystemAppsFromServer().then(() => setLastSyncTime(new Date()));
    const handleUpdate = () => refreshList();
    window.addEventListener("doorstep-ecosystem-registry-change", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("doorstep-ecosystem-registry-change", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    if (!text || text === "#") return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openAddModal = () => {
    setEditingApp(null);
    setName("");
    setUrl("https://");
    setIsModalOpen(true);
  };

  const openEditModal = (app: ConnectedAppConfig) => {
    setEditingApp(app);
    setName(app.name);
    setUrl(app.url);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (app: ConnectedAppConfig) => {
    const updated: ConnectedAppConfig = {
      ...app,
      isReady: !app.isReady,
      updatedAt: new Date().toISOString(),
    };
    await saveEcosystemApp(updated);
    refreshList();
    toast.success(`${app.name} status updated to ${updated.isReady ? "Active" : "Coming Soon"}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    let cleanUrl = url.trim();

    if (!cleanName) {
      toast.error("Please enter a product name");
      return;
    }

    if (!cleanUrl || cleanUrl === "https://" || cleanUrl === "http://") {
      toast.error("Please enter a valid website URL");
      return;
    }

    // Auto prepend https if missing
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    setIsSaving(true);

    try {
      const generatedId =
        editingApp?.id ||
        cleanName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const now = new Date().toISOString();

      const appToSave: ConnectedAppConfig = {
        id: generatedId,
        name: cleanName,
        tagline: editingApp?.tagline || `${cleanName} - Connected Business Suite`,
        category: editingApp?.category || "accounting",
        description:
          editingApp?.description || `Integrated Doorstep ecosystem solution for ${cleanName}.`,
        icon: editingApp?.icon || "fa-calculator",
        color: editingApp?.color || "from-emerald-500 to-teal-700",
        badge: editingApp?.badge || "Active Integration",
        url: cleanUrl.replace(/\/$/, ""),
        apiUrl: editingApp?.apiUrl,
        isReady: editingApp ? editingApp.isReady : true,
        features: editingApp?.features?.length
          ? editingApp.features
          : ["Single Sign-On (SSO)", "Unified Workspace", "Central Ecosystem Access"],
        updatedAt: now,
      };

      await saveEcosystemApp(appToSave);
      setIsModalOpen(false);
      refreshList();
      toast.success(
        editingApp
          ? `Updated "${appToSave.name}" URL successfully`
          : `Added "${appToSave.name}" to ecosystem`
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to save product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (app: ConnectedAppConfig) => {
    const ok = await confirm({
      title: "Remove Connected Product",
      message: `Are you sure you want to remove "${app.name}" (${app.url}) from the Doorstep ecosystem? It will be removed from all user dashboards and the app switcher.`,
      confirmLabel: "Remove Product",
      variant: "danger",
    });

    if (!ok) return;

    try {
      await deleteEcosystemApp(app.id);
      refreshList();
      toast.success(`Removed ${app.name} from ecosystem`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove product");
    }
  };

  const handleResetDefaults = async () => {
    const ok = await confirm({
      title: "Restore Default Products",
      message:
        "Are you sure you want to restore the official Doorstep Suite products (Books, HRMS, ERP)? Custom product URLs will be reset to official defaults.",
      confirmLabel: "Restore Defaults",
      variant: "warning",
    });

    if (!ok) return;

    try {
      await resetEcosystemAppsToDefault();
      refreshList();
      toast.success("Restored official default products");
    } catch (err: any) {
      toast.error(err?.message || "Failed to reset defaults");
    }
  };

  // Filtered List
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        app.name.toLowerCase().includes(q) ||
        app.id.toLowerCase().includes(q) ||
        app.url.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && app.isReady) ||
        (statusFilter === "planned" && !app.isReady);

      return matchesSearch && matchesStatus;
    });
  }, [apps, search, statusFilter]);

  const activeCount = apps.filter((a) => a.isReady).length;

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="max-w-7xl mx-auto space-y-5 py-6 px-4 sm:px-6 lg:px-8">
          {/* Header Row matching Doorstep Admin Standard */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                Connected Products
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Manage ecosystem website URLs, SSO redirection targets, and live product status.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50"
                title="Sync from central server"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-blue-600" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
                title="Restore default product URLs"
              >
                <span>Reset Defaults</span>
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="admin-btn h-9 rounded-xl px-4 text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Compact Stats Bar matching Doorstep Admin Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Layers3 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Products</p>
                <p className="text-xl font-black text-slate-950 leading-tight">{apps.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Globe className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active URLs (Live SSO)</p>
                <p className="text-xl font-black text-emerald-600 leading-tight">{activeCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last Auto-Sync</p>
                <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                  {format(lastSyncTime, "hh:mm:ss a, dd MMM yyyy")}
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <section className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-700" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  Filters
                </h2>
              </div>

              <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end sm:max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search product name or URL..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-8.5 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700/20"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      &times;
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-blue-700 focus:outline-none shrink-0"
                >
                  <option value="all">All Status ({apps.length})</option>
                  <option value="active">Active Only ({activeCount})</option>
                  <option value="planned">Coming Soon ({apps.length - activeCount})</option>
                </select>
              </div>
            </div>
          </section>

          {/* Clean Data Table + Admin Review matching Doorstep Standard */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                  <tr>
                    <th className="py-3 px-4 pl-5">Product Name</th>
                    <th className="py-3 px-4">Configured Website URL</th>
                    <th className="py-3 px-4">Auto Sync Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Layers3 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <p className="font-bold text-slate-600">No products found</p>
                        <p className="text-[11px] text-slate-400">
                          {search ? "No matches for your search filter." : "Click Add Product above to register a new website."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => {
                      const hasValidUrl = app.url && app.url !== "#";
                      const dateStr = app.updatedAt
                        ? format(new Date(app.updatedAt), "dd MMM yyyy, hh:mm a")
                        : format(lastSyncTime, "dd MMM yyyy, hh:mm a");
                      const isExpanded = expandedReviewId === app.id;

                      return (
                        <tr key={app.id} className="group hover:bg-slate-50/70 transition-colors">
                          <td colSpan={5} className="p-0">
                            <div className="flex items-center justify-between py-3.5 px-4 pl-5 text-xs">
                              {/* Name + ID */}
                              <div className="w-1/4 pr-4 min-w-[200px]">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${app.color || "from-emerald-500 to-teal-700"} text-white shadow-xs`}
                                  >
                                    <Globe className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 leading-snug truncate">{app.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                        {app.id}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setExpandedReviewId(isExpanded ? null : app.id)}
                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                                        title="View full admin review details"
                                      >
                                        <span>{isExpanded ? "Hide Details" : "Review Specs"}</span>
                                        {isExpanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Website URL */}
                              <div className="w-1/3 pr-4">
                                <div className="flex items-center gap-2 max-w-md">
                                  <span
                                    className="font-mono text-xs font-bold text-blue-900 truncate bg-blue-50/70 border border-blue-100 px-2 py-0.5 rounded-lg"
                                    title={app.url}
                                  >
                                    {app.url}
                                  </span>

                                  {hasValidUrl && (
                                    <>
                                      <a
                                        href={app.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-blue-700 transition-colors"
                                        title="Test link (open website in new tab)"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(app.url, app.id)}
                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-emerald-700 transition-colors cursor-pointer"
                                        title="Copy website URL"
                                      >
                                        {copiedKey === app.id ? (
                                          <Check className="h-3 w-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Auto Sync Date */}
                              <div className="w-1/6 font-medium text-slate-500 text-[11px] whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  <span>{dateStr}</span>
                                </div>
                              </div>

                              {/* Status */}
                              <div className="w-1/6">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(app)}
                                  title="Click to toggle Active status"
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-all cursor-pointer ${
                                    app.isReady
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                      : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      app.isReady ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                                    }`}
                                  />
                                  <span>{app.isReady ? "Active" : "Coming Soon"}</span>
                                </button>
                              </div>

                              {/* Actions */}
                              <div className="w-1/12 pr-1 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(app)}
                                    className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-colors shadow-2xs cursor-pointer"
                                  >
                                    <Edit2 className="h-3 w-3 text-blue-600" />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDelete(app)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Remove product"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Extra Data for Admin Review (Collapsible Panel) */}
                            {isExpanded && (
                              <div className="bg-slate-50/90 border-t border-slate-100 px-6 py-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                      Admin Review & System Registry Specs
                                    </h4>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400">
                                    Auto-managed by Central Registry
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                                  <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Unique Slug (ID)</p>
                                    <p className="font-mono font-bold text-slate-800 mt-0.5">{app.id}</p>
                                  </div>

                                  <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">SSO Launch Action</p>
                                    <p className="font-semibold text-slate-700 mt-0.5">POST form submission to /api/sso</p>
                                  </div>

                                  <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Category</p>
                                    <p className="font-semibold text-slate-700 capitalize mt-0.5">{app.category || "General"}</p>
                                  </div>

                                  <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Last Synced Timestamp</p>
                                    <p className="font-semibold text-slate-700 mt-0.5">{dateStr}</p>
                                  </div>
                                </div>

                                {app.features?.length > 0 && (
                                  <div className="flex items-center gap-2 pt-1">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Capabilities:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {app.features.map((feat, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                                        >
                                          {feat}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* STREAMLINED PRODUCT FORM MODAL (Direct: Name + Website URL ONLY) */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
              <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div>
                    <h2 className="text-base font-black tracking-tight text-slate-950">
                      {editingApp ? `Edit ${editingApp.name}` : "Add Connected Product"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Direct product configuration. Changes synchronize across the ecosystem.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                    type="button"
                  >
                    &times;
                  </button>
                </div>

                {/* Direct Form: ONLY Product Name and Website URL */}
                <form onSubmit={handleSave} className="space-y-4">
                  {/* Field 1: Product Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Product Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Doorstep Books"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700/20"
                    />
                  </div>

                  {/* Field 2: Website URL */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Website URL <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-700" />
                      <input
                        type="text"
                        required
                        placeholder="https://books.doorstepfilings.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-9 pr-3.5 py-2.5 font-mono text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700/20"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Users clicking the product link or SSO will be redirected directly to this URL.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSaving}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="admin-btn h-9 rounded-xl px-5 text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <span>{editingApp ? "Save Changes" : "Add Product"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Confirm Dialog */}
          <ConfirmDialog />
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
