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
        <div className="panel-page">
          <section className="panel-card p-5 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="panel-chip panel-chip-active">
                    <LayoutList className="h-3.5 w-3.5" aria-hidden="true" />
                    List View
                  </span>
                  <span className="panel-chip">
                    <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden="true" />
                    {stats.total} Services
                  </span>
                  <span className="panel-chip">
                    <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
                    {stats.categories} Categories
                  </span>
                  <span className="panel-chip">
                    <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                    Avg {formatServicePrice(stats.avgPrice) ?? "-"}
                  </span>
                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-[2.15rem]">
                  Services
                </h1>
              </div>

              <Link
                href="/admin/services/create"
                className="admin-btn h-12 rounded-2xl px-6 text-xs"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Service
              </Link>
            </div>
          </section>

          <section className="panel-card p-5 sm:p-6">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_240px_190px_auto] xl:items-end">
              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Search
                </span>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    placeholder="Search services"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="panel-input h-12 !pl-11 pr-4 text-sm font-medium"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Category
                </span>
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
                  triggerClassName="h-12 rounded-2xl px-4 py-3"
                  valueLabelClassName="text-sm font-semibold text-slate-700"
                  handleClassName="h-8 w-8 rounded-lg border-0 bg-transparent text-slate-400"
                  renderValueStart={() => (
                    <SlidersHorizontal
                      className="h-4 w-4 shrink-0 text-slate-400"
                      aria-hidden="true"
                    />
                  )}
                />
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Sort
                </span>
                <SearchSelect
                  options={[
                    { value: "created_at", label: "Recent" },
                    { value: "name", label: "Name" },
                    { value: "price", label: "Price" },
                  ]}
                  value={sortBy}
                  onChange={setSortBy}
                  triggerClassName="h-12 min-w-[180px] rounded-2xl px-4 py-3"
                  valueLabelClassName="text-sm font-semibold text-slate-700"
                  handleClassName="h-8 w-8 rounded-lg border-0 bg-transparent text-slate-400"
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSortOrder((current) =>
                      current === "asc" ? "desc" : "asc",
                    )
                  }
                  className="admin-icon-btn-muted h-12 w-12 rounded-2xl"
                  title={`Switch to ${sortOrder === "asc" ? "descending" : "ascending"} order`}
                  aria-label={`Switch to ${sortOrder === "asc" ? "descending" : "ascending"} order`}
                >
                  <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
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
                    className="admin-btn-muted h-12 rounded-2xl px-5 text-xs"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          {filteredAndSorted.length === 0 ? (
            <div className="panel-empty-state px-6 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                <Search className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900">
                No services found
              </h2>
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {filteredAndSorted.map((service: any) => (
                  <ServiceMobileRow
                    key={service.id}
                    categoryLookup={categoryLookup}
                    service={service}
                    onDelete={() => handleDelete(service.id, service.name)}
                  />
                ))}
              </div>

              <section className="panel-table-shell hidden lg:block">
                <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4">
                  <p className="text-sm font-bold text-slate-950">
                    {filteredAndSorted.length} Services
                  </p>
                  <span className="panel-chip">
                    {activeFilterCount > 0 ? "Filtered" : "Full Catalog"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="panel-table-head border-b border-slate-200/70">
                      <tr>
                        <th className="w-[50%] px-6 py-4">Service</th>
                        <th className="w-[18%] px-6 py-4">Category</th>
                        <th className="w-[14%] px-6 py-4">Price</th>
                        <th className="w-[18%] px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
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
              </section>
            </>
          )}
        </div>

        <ConfirmDialog />
      </AdminLayout>
    </AuthGuard>
  );
}

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

  return (
    <tr className="transition-colors hover:bg-slate-50/80">
      <td className="px-6 py-5 align-top">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
            <CategoryIcon
              icon={categoryRecord?.icon}
              className="text-lg leading-none"
              fallback="fa-briefcase"
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-slate-950">{serviceName}</p>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                #{service?.id}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-5 align-top">
        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
          {categoryName}
        </span>
      </td>
      <td className="whitespace-nowrap px-6 py-5 align-top">
        <p className="text-sm font-bold text-slate-950">{priceLabel}</p>
      </td>
      <td className="px-6 py-5 align-top">
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

  return (
    <div className="panel-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
            <CategoryIcon
              icon={categoryRecord?.icon}
              className="text-lg leading-none"
              fallback="fa-briefcase"
            />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-bold text-slate-950">{serviceName}</p>
            <p className="text-xs font-medium text-slate-400">
              {categoryName} | #{service?.id}
            </p>
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
