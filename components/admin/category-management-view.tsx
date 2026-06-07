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

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="max-w-7xl mx-auto space-y-5 py-6 px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                Categories
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Manage catalog categories and check associated service distribution.
              </p>
            </div>
            <Link
              href="/admin/categories/create"
              className="admin-btn h-9 rounded-xl px-4 text-xs flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add Category
            </Link>
          </div>

          {/* Compact Stats Bar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Layers3 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Categories</p>
                <p className="text-xl font-black text-slate-950 dark:text-slate-50 leading-tight">{stats.totalCategories}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <BriefcaseBusiness className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Linked Services</p>
                <p className="text-xl font-black text-slate-950 dark:text-slate-50 leading-tight">{stats.totalServices}</p>
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

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px_auto] items-center">
                {/* Search */}
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Sort By */}
                <SearchSelect
                  options={[
                    { value: "created_at", label: "Date Created" },
                    { value: "name", label: "Category Name" },
                    { value: "services_count", label: "Services Count" },
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

          {filteredAndSorted.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                <Search className="h-6 w-6 text-slate-400" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900 dark:text-slate-100">
                No categories match your criteria
              </h2>
            </div>
          ) : (
            <>
              <div className="space-y-4 lg:hidden">
                {filteredAndSorted.map((category: any) => (
                  <CategoryMobileRow
                    key={category.id}
                    category={category}
                    onDelete={() => handleDelete(category.id, category.name)}
                  />
                ))}
              </div>

              <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex items-center justify-between border-b border-slate-200 px-8 py-5 dark:border-slate-850">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Catalog Categories ({filteredAndSorted.length})
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
                        <th className="px-8 py-4 font-black">Category Name</th>
                        <th className="px-6 py-4 font-black">Services Count</th>
                        <th className="px-8 py-4 font-black text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
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
              </div>
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
      <td className="px-8 py-4 align-middle">
        <p className="text-sm font-bold text-slate-950 dark:text-slate-100">{categoryName}</p>
      </td>
      <td className="px-6 py-4 align-middle">
        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400">
          {servicesCount} Services
        </span>
      </td>
      <td className="px-8 py-4 align-middle">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-bold text-slate-950 dark:text-slate-100">{categoryName}</p>
          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400">
            {servicesCount} Services
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Link
          href={`/admin/categories/edit/${category.id}`}
          className="admin-btn-muted h-11 flex-1 rounded-2xl px-4 text-xs flex items-center justify-center gap-2"
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
