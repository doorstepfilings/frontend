"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { adminApi } from "@/lib/api/admin-api";
import { parseApiError } from "@/lib/utils/error-parser";
import { PageLogoLoader } from "@/components/ui/logo-loader";

const PANEL_CLASS = "rounded-3xl border border-slate-200 bg-white shadow-sm";
const INPUT_CLASS =
  "w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
const KICKER_CLASS =
  "text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400";
const TITLE_CLASS = "text-2xl font-bold tracking-tight text-slate-900";

export function StageFormView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    color: "#1d4ed8",
    isActive: true,
  });
  const [isDefaultStage, setIsDefaultStage] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    let isMounted = true;

    async function loadStage() {
      try {
        const response = await adminApi.getStage(Number(id));
        const payload = response.data?.data ?? response.data;

        if (!isMounted) {
          return;
        }

        setForm({
          name: String(payload?.name ?? ""),
          color: String(payload?.color ?? "#1d4ed8"),
          isActive: Boolean(payload?.is_active ?? payload?.isActive ?? true),
        });
        setIsDefaultStage(
          Boolean(payload?.is_default ?? payload?.isDefault ?? false),
        );
      } catch (requestError) {
        toast.error(parseApiError(requestError));
        router.push("/admin/stages");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadStage();

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (isEditMode && isDefaultStage) {
      toast.error("Default milestones are read-only");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Milestone name is required");
      return;
    }

    setSaving(true);
    try {
      if (isEditMode) {
        await adminApi.updateStage(Number(id), {
          name: form.name.trim(),
          color: form.color.trim() || "#1d4ed8",
          isActive: form.isActive,
        });
        toast.success("Milestone updated");
      } else {
        await adminApi.createStage({
          name: form.name.trim(),
          color: form.color.trim() || "#1d4ed8",
          isActive: form.isActive,
        });
        toast.success("Milestone created");
      }

      router.push("/admin/stages");
    } catch (requestError) {
      toast.error(parseApiError(requestError));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <PageLogoLoader
          className="min-h-[24rem]"
          label="Loading milestone..."
          size={58}
          surfaceClassName="max-w-lg"
        />
      </AdminLayout>
    );
  }

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="mx-auto max-w-4xl space-y-8 pb-24">
          <div className={PANEL_CLASS}>
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <Link
                href="/admin/stages"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
              >
                <i className="fas fa-arrow-left text-xs" />
                Back to Milestones
              </Link>
            </div>
            <div className="px-6 py-8">
              <p className={KICKER_CLASS}>Milestone Library</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
                {isEditMode
                  ? "Edit Global Milestone"
                  : "Create Global Milestone"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Configure the reusable milestone name, color, and activation
                state. This milestone will be available in the service builder
                for any service.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={`${PANEL_CLASS} p-6 sm:p-8`}>
            <div className="mb-8 space-y-2">
              <p className={KICKER_CLASS}>Configuration</p>
              <h2 className={TITLE_CLASS}>Milestone Details</h2>
            </div>

            {isEditMode && isDefaultStage ? (
              <div className="mb-8 rounded-3xl border border-blue-200 bg-blue-50 p-5 text-sm leading-7 text-blue-900">
                This is a default milestone. It is protected and read-only, so
                admins can use it in workflows but cannot rename, deactivate, or
                delete it.
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Milestone Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  disabled={isEditMode && isDefaultStage}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Verification"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Milestone Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    disabled={isEditMode && isDefaultStage}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        color: event.target.value,
                      }))
                    }
                    className="h-12 w-16 rounded-2xl border border-slate-200 bg-white p-2"
                  />
                  <input
                    type="text"
                    value={form.color}
                    disabled={isEditMode && isDefaultStage}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        color: event.target.value,
                      }))
                    }
                    placeholder="#1d4ed8"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Active Milestone
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Active milestones appear in the service builder dropdown for
                    service-specific timelines.
                  </p>
                </div>
                <label className="inline-flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    disabled={isEditMode && isDefaultStage}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  {form.isActive ? "Enabled" : "Disabled"}
                </label>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-4">
              <button
                type="submit"
                disabled={saving || (isEditMode && isDefaultStage)}
                className="flex h-14 flex-1 items-center justify-center gap-3 rounded-2xl bg-slate-900 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition hover:bg-blue-600 disabled:opacity-50 md:h-16 md:text-[11px]"
              >
                {saving ? (
                  <i className="fas fa-circle-notch animate-spin text-lg" />
                ) : (
                  <i className="fas fa-save text-lg" />
                )}
                {isEditMode && isDefaultStage
                  ? "Read-only Milestone"
                  : isEditMode
                    ? "Update Milestone"
                    : "Create Milestone"}
              </button>

              <Link
                href="/admin/stages"
                className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-red-500 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-red-600 md:h-16 md:text-[11px]"
              >
                Back
              </Link>
            </div>
          </form>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
