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

export function CategoryManagementView() {
  const dispatch = useAppDispatch();
  const { categories, services, catalogLoading: loading } = useAppSelector(
    (state) => state.admin,
  );
  const { confirm, ConfirmDialog } = useConfirm();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    dispatch(fetchAdminCategories());
    dispatch(fetchAdminServices());
  }, [dispatch]);

  const handleDelete = async (id: string | number, name: string) => {
    const ok = await confirm({
      title: "Delete Category",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (!ok) {
      return;
    }

    try {
      await apiClient.delete(`/admin/categories/${id}`);
      toast.success("Category deleted successfully");
      dispatch(fetchAdminCategories());
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete category",
      );
    }
  };

  const filteredAndSorted = useMemo(() => {
    const result = categories.filter((category: any) => {
      const searchValue = search.trim().toLowerCase();
      return (
        !searchValue ||
        category.name?.toLowerCase().includes(searchValue) ||
        category.description?.toLowerCase().includes(searchValue)
      );
    });

    return [...result].sort((left: any, right: any) => {
      if (sortBy === "name") {
        const leftName = String(left?.name ?? "");
        const rightName = String(right?.name ?? "");

        return sortOrder === "asc"
          ? leftName.localeCompare(rightName)
          : rightName.localeCompare(leftName);
      }

      if (sortBy === "services_count") {
        const leftCount = Number(left?.services_count ?? 0);
        const rightCount = Number(right?.services_count ?? 0);

        return sortOrder === "asc"
          ? leftCount - rightCount
          : rightCount - leftCount;
      }

      const leftDate = new Date(
        left?.updated_at ?? left?.created_at ?? 0,
      ).getTime();
      const rightDate = new Date(
        right?.updated_at ?? right?.created_at ?? 0,
      ).getTime();

      return sortOrder === "asc" ? leftDate - rightDate : rightDate - leftDate;
    });
  }, [categories, search, sortBy, sortOrder]);

  const stats = useMemo(() => {
    return {
      totalCategories: categories.length,
      totalServices: services.length,
    };
  }, [categories, services]);

  const activeFilterCount =
    Number(Boolean(search.trim())) +
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
                    <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
                    {stats.totalCategories} Categories
                  </span>
                  <span className="panel-chip">
                    <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden="true" />
                    {stats.totalServices} Services
                  </span>
                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-[2.15rem]">
                  Categories
                </h1>
              </div>

              <Link
                href="/admin/categories/create"
                className="admin-btn h-12 rounded-2xl px-6 text-xs"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Category
              </Link>
            </div>
          </section>

          <section className="panel-card p-5 sm:p-6">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_240px_auto] xl:items-end">
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
                    placeholder="Search categories"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="panel-input h-12 !pl-11 pr-4 text-sm font-medium"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Sort By
                </span>
                <SearchSelect
                  options={[
                    { value: "created_at", label: "Recent" },
                    { value: "name", label: "Name" },
                    { value: "services_count", label: "Services Count" },
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
                No categories found
              </h2>
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {filteredAndSorted.map((category: any) => (
                  <CategoryMobileRow
                    key={category.id}
                    category={category}
                    onDelete={() => handleDelete(category.id, category.name)}
                  />
                ))}
              </div>

              <section className="panel-table-shell hidden lg:block">
                <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4">
                  <p className="text-sm font-bold text-slate-950">
                    {filteredAndSorted.length} Categories
                  </p>
                  <span className="panel-chip">
                    {activeFilterCount > 0 ? "Filtered" : "Full Catalog"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="panel-table-head border-b border-slate-200/70">
                      <tr>
                        <th className="w-[60%] px-6 py-4">Category</th>
                        <th className="w-[20%] px-6 py-4">Services</th>
                        <th className="w-[20%] px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAndSorted.map((category: any) => (
                        <CategoryTableRow
                          key={category.id}
                          category={category}
                          onDelete={() => handleDelete(category.id, category.name)}
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

function CategoryTableRow({
  category,
  onDelete,
}: {
  category: any;
  onDelete: () => void;
}) {
  const categoryName = category?.name || "Untitled category";
  const servicesCount = category?.services_count || 0;

  return (
    <tr className="transition-colors hover:bg-slate-50/80">
      <td className="px-6 py-5 align-top">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
            <CategoryIcon
              icon={category?.icon}
              className="text-lg leading-none"
              fallback="fa-folder-open"
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-slate-950">{categoryName}</p>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                #{category?.id}
              </span>
            </div>
            {category?.description && (
              <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-5 align-top">
        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
          {servicesCount} Services
        </span>
      </td>
      <td className="px-6 py-5 align-top">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/categories/edit/${category.id}`}
            className="admin-icon-btn-muted rounded-xl"
            title="Edit category"
            aria-label={`Edit ${categoryName}`}
          >
            <PencilLine className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={onDelete}
            title="Delete category"
            aria-label={`Delete ${categoryName}`}
            className="flex h-[2.35rem] w-[2.35rem] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-600 hover:text-white"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function CategoryMobileRow({
  category,
  onDelete,
}: {
  category: any;
  onDelete: () => void;
}) {
  const categoryName = category?.name || "Untitled category";
  const servicesCount = category?.services_count || 0;

  return (
    <div className="panel-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
            <CategoryIcon
              icon={category?.icon}
              className="text-lg leading-none"
              fallback="fa-folder-open"
            />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-bold text-slate-950">{categoryName}</p>
            <p className="text-xs font-medium text-slate-400">
              {servicesCount} Services | #{category?.id}
            </p>
          </div>
        </div>
      </div>

      {category?.description && (
        <p className="mt-3 text-xs text-slate-500 line-clamp-2">
          {category.description}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <Link
          href={`/admin/categories/edit/${category.id}`}
          className="admin-btn-muted h-11 flex-1 rounded-2xl px-4 text-xs"
        >
          <PencilLine className="h-4 w-4" aria-hidden="true" />
          Edit
        </Link>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-600 hover:text-white"
          aria-label={`Delete ${categoryName}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
