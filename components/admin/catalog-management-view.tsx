"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useConfirm } from "@/hooks/use-confirm";
import { apiClient } from "@/lib/api/client";
import { SearchSelect } from "@/components/ui/core/search-select";
import {
  fetchAdminCategories,
  fetchAdminServices,
} from "@/lib/features/admin/admin-slice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { formatDateWithPattern } from "@/lib/utils/formatters";
import { PanelLogoLoader } from "@/components/ui/logo-loader";

type CatalogType = "categories" | "services";

export function CatalogManagementView({
  initialType = "categories",
}: {
  initialType?: CatalogType;
}) {
  const dispatch = useAppDispatch();
  const { categories, services, catalogLoading } = useAppSelector(
    (state) => state.admin,
  );
  const { confirm, ConfirmDialog } = useConfirm();
  const [activeTab, setActiveTab] = useState<CatalogType>(initialType);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    dispatch(fetchAdminCategories());
    dispatch(fetchAdminServices());
  }, [dispatch]);

  const handleDeleteCategory = async (id: number | string, name: string) => {
    const ok = await confirm({
      title: "Delete Category",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (!ok) return;

    try {
      await apiClient.delete(`/admin/categories/${id}`);
      toast.success("Category deleted successfully");
      dispatch(fetchAdminCategories());
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete category");
    }
  };

  const currentData = useMemo(() => {
    const base = activeTab === "categories" ? categories : services;

    return base
      .filter((item: any) => {
        const query = searchQuery.toLowerCase();
        return (
          item.name?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.short_description?.toLowerCase().includes(query)
        );
      })
      .sort((a: any, b: any) => {
        if (sortBy === "name") {
          return sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }

        if (sortBy === "price" && activeTab === "services") {
          return sortOrder === "asc"
            ? (a.price || 0) - (b.price || 0)
            : (b.price || 0) - (a.price || 0);
        }

        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
      });
  }, [activeTab, categories, services, searchQuery, sortBy, sortOrder]);

  const averageServicePrice = Math.round(
    services.reduce(
      (acc: number, service: any) => acc + (parseFloat(service.price) || 0),
      0,
    ) / (services.length || 1),
  );

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="space-y-10">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-black capitalize tracking-tight text-slate-900">
                {activeTab}
              </h1>
              <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-500 opacity-60">
                Global Service Catalog
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/admin/${activeTab}/create`}
                className="flex h-14 items-center gap-3 rounded-2xl bg-blue-600 px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-700"
              >
                <i className="fas fa-plus"></i>
                Create {activeTab === "categories" ? "Category" : "Service"}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <QuickStat
              label={`Total ${activeTab}`}
              value={currentData.length}
              icon={activeTab === "categories" ? "fa-layer-group" : "fa-briefcase"}
              color="blue"
            />
            <QuickStat
              label={activeTab === "categories" ? "Total Services" : "Avg Price"}
              value={
                activeTab === "categories"
                  ? services.length
                  : `INR ${averageServicePrice}`
              }
              icon={activeTab === "categories" ? "fa-link" : "fa-tag"}
              color="emerald"
            />
            <QuickStat
              label="Latest Update"
              value={formatDateWithPattern(
                currentData[0]?.created_at,
                "MMM d",
                "N/A",
              )}
              icon="fa-clock"
              color="amber"
            />
          </div>

          <div className="w-fit rounded-2xl bg-slate-100 p-1.5">
            {[
              { id: "categories", label: "Categories", icon: "fa-layer-group" },
              { id: "services", label: "Services", icon: "fa-briefcase" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CatalogType)}
                className={`rounded-xl px-6 py-3 text-[11px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <i className={`fas ${tab.icon} text-xs`}></i>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          <div className="min-h-[500px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 p-6 md:flex-row">
              <div className="group relative flex-1">
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-xs text-slate-400 transition-colors group-focus-within:text-blue-500"></i>
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium text-slate-900 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <div className="flex gap-3">
                <SearchSelect
                  options={[
                    { value: "created_at", label: "Date Created" },
                    { value: "name", label: "Alpha Name" },
                    ...(activeTab === "services"
                      ? [{ value: "price", label: "Price Point" }]
                      : []),
                  ]}
                  value={sortBy}
                  onChange={setSortBy}
                  triggerClassName="h-12 rounded-xl px-4 py-3"
                  valueLabelClassName="text-[10px] font-bold uppercase tracking-wider text-slate-600"
                  handleClassName="h-7 w-7 rounded-md border-0 bg-transparent text-slate-400"
                />
                <button
                  onClick={() =>
                    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:text-blue-600"
                >
                  <i
                    className={`fas fa-sort-amount-${
                      sortOrder === "asc" ? "down" : "up"
                    }`}
                  ></i>
                </button>
              </div>
            </div>

            <div className="p-8">
              {catalogLoading ? (
                <PanelLogoLoader
                  className="min-h-[18rem] px-0 py-0"
                  label="Loading catalog data..."
                  size={56}
                />
              ) : currentData.length === 0 ? (
                <div className="mx-auto max-w-xs py-32 text-center opacity-40">
                  <i className="fas fa-box-open mb-6 text-5xl text-slate-200"></i>
                  <p className="text-sm font-bold uppercase tracking-widest italic text-slate-500">
                    Catalog Empty
                  </p>
                </div>
              ) : activeTab === "categories" ? (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                  {currentData.map((category: any) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onDelete={() =>
                        handleDeleteCategory(category.id, category.name)
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                  {currentData.map((service: any) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <ConfirmDialog />
      </AdminLayout>
    </AuthGuard>
  );
}

function CategoryCard({
  category,
  onDelete,
}: {
  category: any;
  onDelete: () => void;
}) {
  return (
    <div className="group rounded-2xl border border-slate-100 bg-white p-6 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 text-xl text-slate-600 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
          <i className={`fas ${category.icon || "fa-folder-open"}`}></i>
        </div>
        <div className="text-right">
          <span className="block text-xl font-bold tracking-tight text-slate-900">
            {category.services_count || 0}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Services
          </span>
        </div>
      </div>
      <h3 className="mb-2 text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">
        {category.name}
      </h3>
      <p className="mb-6 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500">
        {category.description || "No description available."}
      </p>

      <div className="mb-6 space-y-2 border-t border-slate-50 pt-4">
        <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Created</span>
          <span className="text-slate-600">
            {formatDateWithPattern(
              category.created_at,
              "dd MMM yyyy",
              "-",
            )}
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Modified</span>
          <span className="text-slate-600">
            {formatDateWithPattern(
              category.updated_at,
              "dd MMM yyyy",
              "-",
            )}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/admin/categories/edit/${category.id}`}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-all hover:bg-slate-900 hover:text-white"
        >
          <i className="fas fa-edit text-[9px]"></i>
          Modify
        </Link>
        <button
          onClick={onDelete}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition-all hover:bg-rose-600 hover:text-white"
        >
          <i className="fas fa-trash-alt text-xs"></i>
        </button>
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: any }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-100 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50">
      <div className="flex flex-col items-start gap-6 p-6 md:flex-row">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600 shadow-sm transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
          <i className={`fas ${service.category?.icon || "fa-briefcase"}`}></i>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-600">
              {service.category?.name || "General"}
            </span>
            <div className="text-right">
              <span className="block text-xl font-bold tracking-tight text-slate-900">
                INR {Math.round(service.price).toLocaleString("en-IN")}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Starting Price
              </span>
            </div>
          </div>
          <h3 className="mb-2 text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">
            {service.name}
          </h3>
          <p className="mb-4 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500">
            {service.short_description}
          </p>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <ServiceMeta
              icon="fa-tags"
              value={service.pricing_plans?.length || 0}
              label="Plans"
            />
            <ServiceMeta
              icon="fa-file-alt"
              value={service.required_documents_list?.length || 0}
              label="Docs"
            />
            <ServiceMeta
              icon="fa-question-circle"
              value={service.faqs?.length || 0}
              label="FAQs"
            />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 border-y border-slate-50 py-4">
            <div>
              <span className="mb-1 block text-[8px] font-bold uppercase tracking-widest text-slate-400">
                Created
              </span>
              <span className="text-[10px] font-semibold text-slate-600">
                {formatDateWithPattern(
                  service.created_at,
                  "dd MMM yyyy",
                  "-",
                )}
              </span>
            </div>
            <div>
              <span className="mb-1 block text-[8px] font-bold uppercase tracking-widest text-slate-400">
                Modified
              </span>
              <span className="text-[10px] font-semibold text-slate-600">
                {formatDateWithPattern(
                  service.updated_at,
                  "dd MMM yyyy",
                  "-",
                )}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/admin/services/edit/${service.id}`}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:bg-slate-900"
            >
              <i className="fas fa-edit text-[9px]"></i>
              Edit Details
            </Link>
            <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition-all hover:bg-rose-600 hover:text-white">
              <i className="fas fa-trash-alt text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceMeta({ icon, value, label }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-[10px] text-slate-400">
        <i className={`fas ${icon}`}></i>
      </div>
      <div>
        <span className="block text-xs font-black leading-none text-slate-900">
          {value}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">
          {label}
        </span>
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg shadow-sm ${colors[color]}`}
      >
        <i className={`fas ${icon}`}></i>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}
