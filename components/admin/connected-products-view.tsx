"use client";

import { useEffect, useState } from "react";
import {
  ConnectedAppConfig,
  getEcosystemApps,
  saveEcosystemApp,
  deleteEcosystemApp,
  resetEcosystemAppsToDefault,
} from "@/lib/auth/connected-apps";

const AVAILABLE_ICONS = [
  { label: "Calculator (Accounting)", value: "fa-calculator" },
  { label: "Users / Staff (HRMS)", value: "fa-users-cog" },
  { label: "Boxes / Inventory (ERP)", value: "fa-boxes-stacked" },
  { label: "Chart / Analytics (CRM)", value: "fa-chart-line" },
  { label: "Briefcase (Business)", value: "fa-briefcase" },
  { label: "Shield / Legal (Compliance)", value: "fa-shield-alt" },
  { label: "File Invoice (Billing)", value: "fa-file-invoice-dollar" },
  { label: "Network / Integration", value: "fa-network-wired" },
];

const AVAILABLE_GRADIENTS = [
  { label: "Emerald Teal (Books)", value: "from-emerald-500 to-teal-700" },
  { label: "Blue Indigo (HRMS)", value: "from-blue-600 to-indigo-800" },
  { label: "Purple Violet (ERP)", value: "from-purple-600 to-violet-900" },
  { label: "Amber Orange (CRM)", value: "from-amber-500 to-orange-700" },
  { label: "Rose Pink (Marketing)", value: "from-rose-500 to-pink-700" },
  { label: "Slate Gray (Custom)", value: "from-slate-600 to-slate-900" },
];

export function ConnectedProductsView() {
  const [apps, setApps] = useState<ConnectedAppConfig[]>(() => getEcosystemApps());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ConnectedAppConfig | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [tagline, setTagline] = useState("");
  const [url, setUrl] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [category, setCategory] = useState<ConnectedAppConfig["category"]>("accounting");
  const [icon, setIcon] = useState("fa-calculator");
  const [color, setColor] = useState("from-emerald-500 to-teal-700");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [isReady, setIsReady] = useState(true);
  const [badge, setBadge] = useState("");

  const refreshList = () => {
    setApps(getEcosystemApps());
  };

  useEffect(() => {
    const handleUpdate = () => refreshList();
    window.addEventListener("doorstep-ecosystem-registry-change", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("doorstep-ecosystem-registry-change", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const openAddModal = () => {
    setEditingApp(null);
    setName("");
    setId("");
    setTagline("");
    setUrl("");
    setApiUrl("");
    setCategory("accounting");
    setIcon("fa-calculator");
    setColor("from-emerald-500 to-teal-700");
    setDescription("");
    setFeatures("GST Invoicing, Real-time P&L, Ledger Management");
    setIsReady(true);
    setBadge("Active Integration");
    setIsModalOpen(true);
  };

  const openEditModal = (app: ConnectedAppConfig) => {
    setEditingApp(app);
    setName(app.name);
    setId(app.id);
    setTagline(app.tagline);
    setUrl(app.url);
    setApiUrl(app.apiUrl || "");
    setCategory(app.category);
    setIcon(app.icon);
    setColor(app.color);
    setDescription(app.description);
    setFeatures(app.features.join("\n"));
    setIsReady(app.isReady);
    setBadge(app.badge || "");
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const generatedId =
      id.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const featureList = features
      .split(/[\n,]+/)
      .map((f) => f.trim())
      .filter(Boolean);

    const appToSave: ConnectedAppConfig = {
      id: generatedId,
      name: name.trim(),
      tagline: tagline.trim() || "Business Solution",
      category,
      description: description.trim() || "Integrated Doorstep Suite application.",
      icon,
      color,
      badge: badge.trim() || (isReady ? "Active Integration" : "Coming Soon"),
      url: url.trim() || "#",
      apiUrl: apiUrl.trim() || undefined,
      isReady,
      features: featureList.length > 0 ? featureList : ["General Integration"],
    };

    saveEcosystemApp(appToSave);
    setIsModalOpen(false);
    refreshList();
  };

  const handleDelete = (appId: string) => {
    deleteEcosystemApp(appId);
    setDeleteConfirmId(null);
    refreshList();
  };

  const handleResetDefaults = () => {
    if (
      confirm(
        "Are you sure you want to restore the default Doorstep Suite products (Books, HRMS, ERP)? Custom products will be replaced."
      )
    ) {
      resetEcosystemAppsToDefault();
      refreshList();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Connected Products &amp; Suite</h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-900">
              Admin Console
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Add new products, configure direct web URLs, and manage live integrations shown to users.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <i className="fas fa-undo text-slate-400 mr-1.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-800 transition-all"
          >
            <i className="fas fa-plus-circle" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Products</p>
              <p className="text-2xl font-bold text-slate-900">{apps.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
              <i className="fas fa-cubes text-lg" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active &amp; Ready</p>
              <p className="text-2xl font-bold text-emerald-600">
                {apps.filter((a) => a.isReady).length}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <i className="fas fa-check-circle text-lg" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">In Development</p>
              <p className="text-2xl font-bold text-amber-600">
                {apps.filter((a) => !a.isReady).length}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <i className="fas fa-clock text-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Products Table / Cards */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Registered Ecosystem Products</h2>
          <span className="text-xs text-slate-500">Live synchronization with user panels</span>
        </div>

        <div className="divide-y divide-slate-100">
          {apps.map((app) => (
            <div
              key={app.id}
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 transition-colors hover:bg-slate-50/70"
            >
              {/* Product Info */}
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${app.color} text-white shadow-md`}
                >
                  <i className={`fas ${app.icon} text-lg`} />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{app.name}</h3>
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      {app.id}
                    </span>
                    {app.isReady ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-blue-900">{app.tagline}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{app.description}</p>
                  
                  {/* Direct URLs preview */}
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-600 flex-wrap">
                    <span className="flex items-center gap-1 font-mono">
                      <i className="fas fa-link text-blue-600 text-[10px]" />
                      <strong>App URL:</strong>{" "}
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {app.url}
                      </a>
                    </span>
                    {app.apiUrl && (
                      <span className="flex items-center gap-1 font-mono text-slate-500">
                        <i className="fas fa-server text-slate-400 text-[10px]" />
                        <strong>API:</strong> {app.apiUrl}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                {app.url && app.url !== "#" && (
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                    title="Open Direct URL"
                  >
                    <i className="fas fa-external-link-alt text-[10px]" />
                    <span>Open</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => openEditModal(app)}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-sm"
                >
                  <i className="fas fa-edit text-[10px]" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(app.id)}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/50 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  <i className="fas fa-trash-alt text-[10px]" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white">
                  <i className="fas fa-cubes text-base" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingApp ? "Edit Connected Product" : "Add New Ecosystem Product"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Set up direct URLs, icons, and capabilities for the suite.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                type="button"
              >
                <i className="fas fa-times" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doorstep Books"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                {/* Product ID / Slug */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Product ID / Slug
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. doorstep-books"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Smart Accounting, Invoicing & GST"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Direct Web URL */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Direct Web URL *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://books.doorstepfilings.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                {/* API URL */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    API / Verification URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="http://127.0.0.1:5000/auth/api-key/token"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="accounting">Accounting &amp; GST</option>
                    <option value="hrms">HRMS &amp; Payroll</option>
                    <option value="erp">ERP &amp; Inventory</option>
                    <option value="crm">CRM &amp; Sales</option>
                    <option value="legal">Legal &amp; Compliance</option>
                    <option value="custom">Custom / Partner Tool</option>
                  </select>
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Icon
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    {AVAILABLE_ICONS.map((i) => (
                      <option key={i.value} value={i.value}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color Theme */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Color Theme
                  </label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    {AVAILABLE_GRADIENTS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short overview of what this application does..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Capabilities */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Capabilities (Comma or Newline separated)
                </label>
                <textarea
                  rows={2}
                  placeholder="GST Invoicing, Bank Reconciliation, P&L Reports"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <p className="text-xs font-bold text-slate-900">Launch Status</p>
                  <p className="text-[11px] text-slate-500">
                    {isReady
                      ? "Active: Users can connect via API key and launch directly."
                      : "Coming Soon: Displayed with a 'Coming Soon' badge."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReady(!isReady)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isReady ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isReady ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-800 transition-all"
                >
                  <i className="fas fa-save" />
                  <span>{editingApp ? "Save Changes" : "Register Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <i className="fas fa-exclamation-triangle text-xl" />
              <h3 className="text-base font-bold text-slate-900">Remove Product from Suite</h3>
            </div>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to remove this product from the Doorstep Suite? It will immediately disappear from all user dashboards and the app switcher.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-sm"
              >
                Yes, Remove Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
