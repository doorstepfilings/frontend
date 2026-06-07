"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  BriefcaseBusiness,
  LayoutList,
  Layers3,
  PencilLine,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Wallet,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  fetchAdminCategories,
  fetchAdminServices,
} from "@/lib/features/admin/admin-slice";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { toast } from "react-hot-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { apiClient } from "@/lib/api/client";
import { TableViewSkeleton } from "@/components/ui/skeletons/table-view-skeleton";
import { CategoryIcon } from "@/components/ui/category-icon";
import { SearchSelect } from "@/components/ui/core/search-select";

function parseServicePrice(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatServicePrice(value: unknown): string | null {
  const price = parseServicePrice(value);

  if (price === null) {
    return null;
  }

  return `\u20B9${Math.round(price).toLocaleString("en-IN")}`;
}

function getServiceCategoryId(service: any) {
  return (
    service?.service_category_id ??
    service?.serviceCategoryId ??
    service?.category?.id ??
    service?.categoryId ??
    null
  );
}

function getServiceCategoryRecord(
  service: any,
  categoryLookup: Map<string, any>,
) {
  const serviceCategoryId = getServiceCategoryId(service);

  const matchedCategory =
    serviceCategoryId === null || serviceCategoryId === undefined
      ? null
      : categoryLookup.get(String(serviceCategoryId));

  if (service?.category && typeof service.category === "object") {
    return {
      ...matchedCategory,
      ...service.category,
      id: service.category.id ?? matchedCategory?.id ?? serviceCategoryId ?? null,
    };
  }

  return matchedCategory;
}

export function ServiceManagementView() {
  const dispatch = useAppDispatch();
  const { services, categories, catalogLoading: loading } = useAppSelector(
    (state) => state.admin,
  );
  const { confirm, ConfirmDialog } = useConfirm();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    dispatch(fetchAdminCategories());
    dispatch(fetchAdminServices());
  }, [dispatch]);

  const handleDelete = async (id: string | number, name: string) => {
    const ok = await confirm({
      title: "Delete Service",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (!ok) {
      return;
    }

    try {
      await apiClient.delete(`/admin/services/${id}`);
      toast.success("Service deleted successfully");
      dispatch(fetchAdminServices());
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete service",
      );
    }
  };

  const filteredAndSorted = useMemo(() => {
    const result = services.filter((service: any) => {
      const searchValue = search.trim().toLowerCase();
      const matchesSearch =
        !searchValue ||
        service.name?.toLowerCase().includes(searchValue) ||
        service.short_description?.toLowerCase().includes(searchValue);
      const matchesCategory = filterCategory
        ? String(getServiceCategoryId(service)) === String(filterCategory)
        : true;

      return matchesSearch && matchesCategory;
    });

    return [...result].sort((left: any, right: any) => {
      if (sortBy === "name") {
        const leftName = String(left?.name ?? "");
        const rightName = String(right?.name ?? "");

        return sortOrder === "asc"
          ? leftName.localeCompare(rightName)
          : rightName.localeCompare(leftName);
      }

      if (sortBy === "price") {
        const leftPrice = parseServicePrice(left?.price);
        const rightPrice = parseServicePrice(right?.price);

        if (leftPrice === null && rightPrice === null) {
          return 0;
        }

        if (leftPrice === null) {
          return 1;
        }

        if (rightPrice === null) {
          return -1;
        }

        return sortOrder === "asc"
          ? leftPrice - rightPrice
          : rightPrice - leftPrice;
      }

      const leftDate = new Date(
        left?.updated_at ?? left?.created_at ?? 0,
      ).getTime();
      const rightDate = new Date(
        right?.updated_at ?? right?.created_at ?? 0,
      ).getTime();

      return sortOrder === "asc" ? leftDate - rightDate : rightDate - leftDate;
    });
  }, [filterCategory, search, services, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const pricedServices = services
      .map((service: any) => parseServicePrice(service?.price))
      .filter((price): price is number => price !== null);
    const totalValue = pricedServices.reduce((sum, price) => sum + price, 0);
    const avgPrice =
      pricedServices.length > 0 ? totalValue / pricedServices.length : null;

    return {
      total: services.length,
      categories: categories.length,
      avgPrice: avgPrice === null ? null : Math.round(avgPrice),
      pricedCount: pricedServices.length,
    };
  }, [categories.length, services]);

  const categoryLookup = useMemo(
    () =>
      new Map(
        categories.map((category: any) => [String(category.id), category]),
      ),
    [categories],
  );

  const activeFilterCount =
    Number(Boolean(search.trim())) +
    Number(Boolean(filterCategory)) +
    Number(sortBy !== "created_at" || sortOrder !== "desc");

  if (loading) {
    return (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AdminLayout>
          <TableViewSkeleton />
        </AdminLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="max-w-7xl mx-auto space-y-5 py-6 px-4 sm:px-6 lg:px-8">
          {/* Header + Stats Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                Services
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Manage catalog services, pricing, and documentation requirements.
              </p>
            </div>
            <Link
              href="/admin/services/create"
              className="admin-btn h-9 rounded-xl px-4 text-xs flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add Service
            </Link>
          </div>

          {/* Compact Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <BriefcaseBusiness className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
                <p className="text-xl font-black text-slate-950 dark:text-slate-50 leading-tight">{stats.total}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Layers3 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Categories</p>
                <p className="text-xl font-black text-slate-950 dark:text-slate-50 leading-tight">{stats.categories}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg. Price</p>
                <p className="text-xl font-black text-slate-950 dark:text-slate-50 leading-tight">{formatServicePrice(stats.avgPrice) ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Search & Filters Panel */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                  Filters & Search
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_220px_180px_auto] items-end">
                {/* Search */}
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    placeholder="Search by name or description..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Category Dropdown */}
                <SearchSelect
                  options={[
                    { value: "", label: "All Categories" },
                    ...categories.map((category: any) => ({
                      value: String(category.id),
                      label: String(category.name ?? ""),
                    })),
                  ]}
                  value={filterCategory}
                  onChange={setFilterCategory}
                  searchable={categories.length > 6}
                  triggerClassName="w-full"
                />

                {/* Sort By */}
                <SearchSelect
                  options={[
                    { value: "created_at", label: "Date Created" },
                    { value: "name", label: "Service Name" },
                    { value: "price", label: "Pricing" },
                  ]}
                  value={sortBy}
                  onChange={setSortBy}
                  triggerClassName="w-full"
                />

                {/* Filter Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSortOrder((current) =>
                        current === "asc" ? "desc" : "asc",
                      )
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50/50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    title={`Switch to ${sortOrder === "asc" ? "descending" : "ascending"} order`}
                    aria-label={`Switch to ${sortOrder === "asc" ? "descending" : "ascending"} order`}
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>

                  {activeFilterCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setFilterCategory("");
                        setSortBy("created_at");
                        setSortOrder("desc");
                      }}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* Services Table List */}
          {filteredAndSorted.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                <Search className="h-6 w-6 text-slate-400" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900 dark:text-slate-100">
                No services match your criteria
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Try modifying your search queries or category filters.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 lg:hidden">
                {filteredAndSorted.map((service: any) => (
                  <ServiceMobileRow
                    key={service.id}
                    categoryLookup={categoryLookup}
                    service={service}
                    onDelete={() => handleDelete(service.id, service.name)}
                  />
                ))}
              </div>

              <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex items-center justify-between border-b border-slate-200 px-8 py-5 dark:border-slate-850">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Catalog Services ({filteredAndSorted.length})
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-400">
                    {activeFilterCount > 0 ? "Filtered Catalog" : "Full Access"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:border-slate-850 dark:text-slate-500">
                        <th className="px-8 py-4 font-black">Service Name</th>
                        <th className="px-6 py-4 font-black">Category Label</th>
                        <th className="px-6 py-4 font-black">Standard Price</th>
                        <th className="px-8 py-4 font-black text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                      {filteredAndSorted.map((service: any) => (
                        <ServiceTableRow
                          key={service.id}
                          categoryLookup={categoryLookup}
                          service={service}
                          onDelete={() => handleDelete(service.id, service.name)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <ConfirmDialog />
      </AdminLayout>
    </AuthGuard>
  );
}

const getCategoryColor = (categoryId: string | number) => {
  const colors = [
    { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-100 dark:border-blue-900/50" },
    { bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-100 dark:border-indigo-900/50" },
    { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400", border: "border-purple-100 dark:border-purple-900/50" },
    { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-900/50" },
    { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400", border: "border-amber-100 dark:border-amber-900/50" },
    { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400", border: "border-rose-100 dark:border-rose-900/50" },
    { bg: "bg-cyan-50 dark:bg-cyan-950/30", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-100 dark:border-cyan-900/50" },
  ];
  const index = Math.abs(Number(categoryId) || 0) % colors.length;
  return colors[index];
};

function ServiceTableRow({
  service,
  categoryLookup,
  onDelete,
}: {
  service: any;
  categoryLookup: Map<string, any>;
  onDelete: () => void;
}) {
  const categoryRecord = getServiceCategoryRecord(service, categoryLookup);
  const serviceName = service?.name || "Untitled service";
  const categoryName = categoryRecord?.name || "General";
  const priceLabel = formatServicePrice(service?.price) ?? "-";
  const catColor = getCategoryColor(categoryRecord?.id ?? 0);

  return (
    <tr className="transition-colors hover:bg-slate-50/80">
      <td className="px-8 py-4 align-middle">
        <p className="text-sm font-bold text-slate-950">{serviceName}</p>
      </td>
      <td className="px-6 py-4 align-middle">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${catColor.bg} ${catColor.border} ${catColor.text}`}>
          <span className="h-1 w-1 rounded-full bg-current" />
          {categoryName}
        </span>
      </td>
      <td className="whitespace-nowrap px-6 py-4 align-middle">
        <p className="text-sm font-bold text-slate-950">{priceLabel}</p>
      </td>
      <td className="px-8 py-4 align-middle">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/services/edit/${service.id}`}
            className="admin-icon-btn-muted rounded-xl"
            title="Edit service"
            aria-label={`Edit ${serviceName}`}
          >
            <PencilLine className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={onDelete}
            title="Delete service"
            aria-label={`Delete ${serviceName}`}
            className="flex h-[2.35rem] w-[2.35rem] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-600 hover:text-white"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function ServiceMobileRow({
  service,
  categoryLookup,
  onDelete,
}: {
  service: any;
  categoryLookup: Map<string, any>;
  onDelete: () => void;
}) {
  const categoryRecord = getServiceCategoryRecord(service, categoryLookup);
  const serviceName = service?.name || "Untitled service";
  const categoryName = categoryRecord?.name || "General";
  const priceLabel = formatServicePrice(service?.price) ?? "-";
  const catColor = getCategoryColor(categoryRecord?.id ?? 0);

  return (
    <div className="panel-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-bold text-slate-950">{serviceName}</p>
          <div>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${catColor.bg} ${catColor.border} ${catColor.text}`}>
              <span className="h-1 w-1 rounded-full bg-current" />
              {categoryName}
            </span>
          </div>
        </div>

        <p className="shrink-0 text-sm font-bold text-slate-950">{priceLabel}</p>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Link
          href={`/admin/services/edit/${service.id}`}
          className="admin-btn-muted h-11 flex-1 rounded-2xl px-4 text-xs"
        >
          <PencilLine className="h-4 w-4" aria-hidden="true" />
          Edit
        </Link>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-600 hover:text-white"
          aria-label={`Delete ${serviceName}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
