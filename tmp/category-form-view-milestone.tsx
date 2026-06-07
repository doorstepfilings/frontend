"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft,
  FaCircleNotch,
  FaFloppyDisk,
  FaHashtag,
  FaLink,
  FaClock,
} from "react-icons/fa6";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { FormField } from "@/components/ui/core/form-field";
import { CategoryIcon } from "@/components/ui/category-icon";
import { IconPicker } from "./icon-picker";
import { PageLogoLoader } from "@/components/ui/logo-loader";
import {
  DEFAULT_CATEGORY_ICON,
  getStoredCategoryIconLabel,
} from "@/lib/icons/category-icons";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import { formatDateWithPattern } from "@/lib/utils/formatters";

const PANEL_CLASS = "panel-card";
const INPUT_CLASS =
  "panel-input h-12 rounded-[1.15rem] px-4 text-sm font-semibold text-slate-900";
const TEXTAREA_CLASS =
  "panel-textarea min-h-[14rem] rounded-[1.15rem] px-4 py-3 text-sm font-medium leading-7 text-slate-700 resize-y";

type CategoryMeta = {
  created_at?: string | null;
  description?: string | null;
  icon?: string | null;
  id?: number | string;
  name?: string | null;
  services?: any[];
  services_count?: number | null;
  updated_at?: string | null;
};

export function CategoryFormView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    icon: DEFAULT_CATEGORY_ICON,
    description: "",
  });
  const [categoryMeta, setCategoryMeta] = useState<CategoryMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const categoriesResponse = await apiClient.get("/admin/categories");
        const items =
          categoriesResponse.data?.data || categoriesResponse.data || [];

        if (isEditMode) {
          const matchedCategory = items.find(
            (item: any) => String(item.id) === String(id),
          );

          if (!matchedCategory) {
            toast.error("Category record not found in catalog");
            router.push("/admin/categories");
            return;
          }

          setForm({
            name: matchedCategory.name || "",
            icon: matchedCategory.icon || DEFAULT_CATEGORY_ICON,
            description: matchedCategory.description || "",
          });
          setCategoryMeta(matchedCategory);
        } else {
          setCategoryMeta(null);
        }
      } catch (error: any) {
        console.error("Category Fetch Error:", error);
        toast.error("Unable to load category configuration");
        router.push("/admin/categories");
      } finally {
        setLoading(false);
      }
    };

    void fetchInitialData();
  }, [id, isEditMode, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) {
      return toast.error("Category identity is required");
    }

    if (!form.description.trim()) {
      return toast.error("A strategic description is required");
    }

    setSaving(true);
    try {
      if (isEditMode) {
        await apiClient.patch(`/admin/categories/update/${id}`, form);
      } else {
        await apiClient.post("/admin/categories/store", form);
      }

      toast.success(
        `Category ${isEditMode ? "updated" : "created"} successfully`,
      );
      router.push("/admin/categories");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to finalize category");
    } finally {
      setSaving(false);
    }
  };

  const linkedServiceCount = Number(
    categoryMeta?.services_count ?? categoryMeta?.services?.length ?? 0,
  );
  const recentChangeLabel = formatDateWithPattern(
    categoryMeta?.updated_at || categoryMeta?.created_at,
    "d MMM yyyy",
    "Not available",
  );
  const selectedIconLabel = getStoredCategoryIconLabel(form.icon);

  if (loading) {
    return (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AdminLayout>
          <PageLogoLoader
            className="min-h-[22rem] py-12"
            label="Synchronizing category details..."
            size={64}
          />
        </AdminLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="panel-page">
          <section className="panel-hero relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute -left-16 top-0 h-36 w-36 rounded-full bg-blue-100/70 blur-3xl" />
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-100/80 blur-3xl" />
              <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-white/90 blur-2xl" />
            </div>
            <div className="relative flex flex-col gap-6 px-5 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-5">
                  <Link
                    href="/admin/categories"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
                  >
                    <FaArrowLeft size={12} />
                    Back to Categories
                  </Link>

                  <div className="space-y-3">
                    <span className="panel-chip panel-chip-active">
                      Category Workspace
                    </span>
                    <div className="space-y-2">
                      <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                        {isEditMode ? "Edit Category" : "Create Category"}
                      </h1>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <HeroStat
                      label="Reference"
                      value={isEditMode ? `#${id}` : "New draft"}
                      iconNode={<FaHashtag size={14} />}
                    />
                    <HeroStat
                      label="Icon Family"
                      value={selectedIconLabel}
                      iconNode={<CategoryIcon icon={form.icon} className="h-4 w-4" />}
                    />
                    <HeroStat
                      label="Linked Services"
                      value={String(linkedServiceCount)}
                      iconNode={<FaLink size={14} />}
                    />
                    <HeroStat
                      label="Last Changed"
                      value={recentChangeLabel}
                      iconNode={<FaClock size={14} />}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row xl:pt-3">
                  <Link
                    href="/admin/categories"
                    className="admin-btn-muted h-12 min-w-[9rem] rounded-2xl px-6 text-xs"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    form="category-editor-form"
                    disabled={saving}
                    className="admin-btn h-12 min-w-[11rem] rounded-2xl px-6 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <FaCircleNotch size={14} className="animate-spin" />
                    ) : (
                      <FaFloppyDisk size={14} />
                    )}
                    {isEditMode ? "Save Changes" : "Create Category"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <form
            id="category-editor-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <section className={`${PANEL_CLASS} overflow-hidden`}>
              <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.98))] px-5 py-5 sm:px-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] bg-blue-50 text-blue-700 shadow-sm">
                    <CategoryIcon icon={form.icon} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Category Content
                    </p>
                    <h2 className="text-xl font-bold tracking-tight text-slate-950">
                      Edit Details
                    </h2>
                  </div>
                </div>
              </div>

              <div className="space-y-6 px-5 py-6 sm:px-6 sm:py-7">
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Visual Identity
                      </p>
                      <h2 className="text-lg font-bold tracking-tight text-slate-950">
                        Search Category Icon
                      </h2>
                    </div>
                    <span className="panel-chip panel-chip-active">
                      {selectedIconLabel}
                    </span>
                  </div>
                  <IconPicker
                    value={form.icon}
                    onChange={(icon) => setForm({ ...form, icon })}
                  />
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                <FormField
                  label="Category Name"
                  required
                  hint="Short, recognizable label shown in the admin catalog and service cards."
                >
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="e.g. Compliance & Audits"
                    className={INPUT_CLASS}
                  />
                </FormField>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                <FormField
                  label="Description"
                  required
                  hint="Explain what kind of services belong in this category."
                >
                  <textarea
                    required
                    rows={8}
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    placeholder="Describe the scope of services covered under this category..."
                    className={TEXTAREA_CLASS}
                  />
                </FormField>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-2 xl:hidden sm:flex-row">
                  <Link
                    href="/admin/categories"
                    className="admin-btn-muted h-12 flex-1 rounded-2xl px-6 text-xs"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="admin-btn h-12 flex-1 rounded-2xl px-6 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <FaCircleNotch size={14} className="animate-spin" />
                    ) : (
                      <FaFloppyDisk size={14} />
                    )}
                    {isEditMode ? "Save Changes" : "Create Category"}
                  </button>
                </div>
              </div>
            </section>
          </form>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

function HeroStat({
  label,
  value,
  iconNode,
}: {
  label: string;
  value: string;
  iconNode: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/85 px-4 py-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.45)] backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          {iconNode}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
