"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import dynamic from "next/dynamic";
import { ToggleCard } from "@/components/ui/core/toggle-card";
import { FormField } from "@/components/ui/core/form-field";
import { DynamicList } from "@/components/ui/core/dynamic-list";
import { useFormHandler } from "@/hooks/use-form-handler";
import { ServiceWorkflowBuilder } from "@/components/admin/service-workflow-builder";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

const PANEL_CLASS = "rounded-3xl border border-slate-200 bg-white shadow-sm";
const INPUT_CLASS =
  "w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const TEXTAREA_CLASS =
  "w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none";
const KICKER_CLASS = "text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400";
const TITLE_CLASS = "text-2xl font-bold tracking-tight text-slate-900";

const INITIAL_STATE = {
  service_category_id: "",
  name: "",
  short_description: "",
  long_description: "",
  price: "",
  pricing_plans: [] as any[],
  required_documents_list: [
    { name: "", description: "", is_required: true },
  ] as any[],
  extra_documents: [] as any[],
  faqs: [] as any[],
  admin_notes: "",
};

export function ServiceFormView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const isEditMode = Boolean(id);

  const [categories, setCategories] = useState<any[]>([]);
  const [showPlans, setShowPlans] = useState(false);
  const [showExtraDocs, setShowExtraDocs] = useState(false);

  const {
    form,
    setForm,
    loading,
    setLoading,
    saving,
    handleChange,
    handleListUpdate,
    handleListAdd,
    handleListRemove,
    handleSubmit,
  } = useFormHandler({
    initialValues: INITIAL_STATE,
    onSubmit: async (values) => {
      const payload = {
        ...values,
        price: values.price === "" ? null : values.price,
        pricing_plans: showPlans ? values.pricing_plans : [],
        extra_documents: showExtraDocs ? values.extra_documents : [],
      };

      if (isEditMode) {
        await apiClient.patch(`/admin/services/update/${id}`, payload);
        router.push("/admin/services");
      } else {
        const response = await apiClient.post("/admin/services/store", payload);
        const createdService = response.data?.data || response.data;
        if (createdService?.id) {
          router.push(`/admin/services/edit/${createdService.id}`);
          return;
        }
        router.push("/admin/services");
      }
    },
    validate: (v) => {
      if (!v.service_category_id) return "Please select a parent category";
      if (!v.name) return "Service identity is required";
      if (v.price !== "" && Number(v.price) < 0) {
        return "Base price cannot be below 0";
      }

      const hasNegativePlanPrice = Array.isArray(v.pricing_plans) && v.pricing_plans.some(
        (plan: any) => plan?.price !== "" && Number(plan?.price) < 0,
      );

      if (hasNegativePlanPrice) {
        return "Plan price cannot be below 0";
      }

      return null;
    },
    successMessage: `Service ${isEditMode ? "calibrated" : "commissioned"} successfully`,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const catRes = await apiClient.get("/admin/categories");
        setCategories(catRes.data?.data || catRes.data || []);

        if (isEditMode) {
          const svcRes = await apiClient.get(`/admin/services/${id}`);
          const data = svcRes.data?.data || svcRes.data;
          if (!data) throw new Error("Service not found");

          setShowPlans(data.pricing_plans?.length > 0);
          setShowExtraDocs(data.extra_documents?.length > 0);
          setForm({ ...INITIAL_STATE, ...data });
        }
      } catch (error: any) {
        toast.error("Failed to synchronize catalog data");
        if (isEditMode) router.push("/admin/services");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditMode]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-xl"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="mx-auto max-w-6xl space-y-8 pb-24">
          <div className={PANEL_CLASS}>
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <Link
                href="/admin/services"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
              >
                <i className="fas fa-arrow-left text-xs"></i>
                Back to Services
              </Link>
            </div>
            <div className="flex flex-col gap-6 px-6 py-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <p className={KICKER_CLASS}>Service Management</p>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {isEditMode ? "Edit Service" : "Create Service"}
                </h1>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className={`${PANEL_CLASS} p-6 sm:p-8`}>
              <div className="mb-8 space-y-2">
                <p className={KICKER_CLASS}>Basics</p>
                <h2 className={TITLE_CLASS}>Core Service Details</h2>
                <p className="text-sm leading-7 text-slate-600">
                  Define the category, service name, listing summary, and base
                  price shown in the catalog.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <FormField label="Parent Category" required>
                  <select
                    value={form.service_category_id}
                    onChange={(e) =>
                      handleChange("service_category_id", e.target.value)
                    }
                    className={`${INPUT_CLASS} appearance-none pr-12`}
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"></i>
                </FormField>

                <FormField label="Service Identity" required>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. Private Limited Incorporation"
                    className={INPUT_CLASS}
                  />
                </FormField>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <FormField label="Listing Summary" required>
                    <input
                      type="text"
                      value={form.short_description}
                      onChange={(e) =>
                        handleChange("short_description", e.target.value)
                      }
                      placeholder="Brief summary for catalog view..."
                      className={INPUT_CLASS}
                    />
                  </FormField>
                </div>

                <FormField label="Base Price (₹)">
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(e) => handleChange("price", e.target.value)}
                      placeholder="Optional"
                      className={`${INPUT_CLASS} pl-10`}
                    />
                  </div>
                </FormField>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <ToggleCard
                label="Pricing Tiers"
                description="Enable multiple service packages"
                checked={showPlans}
                onChange={(val) => {
                  setShowPlans(val);
                  if (val && form.pricing_plans.length === 0) {
                    handleListAdd("pricing_plans", {
                      name: "Standard",
                      price: "",
                      features: [""],
                    });
                  }
                }}
              />
              <ToggleCard
                label="Optional Assets"
                description="Allow supplementary document uploads"
                checked={showExtraDocs}
                onChange={(val) => {
                  setShowExtraDocs(val);
                  if (val && form.extra_documents.length === 0) {
                    handleListAdd("extra_documents", {
                      name: "",
                      description: "",
                    });
                  }
                }}
              />
            </div>

            {showPlans && (
              <DynamicList
                title="Service Tiers"
                addLabel="Add Package"
                items={form.pricing_plans}
                onAdd={() =>
                  handleListAdd("pricing_plans", {
                    name: "",
                    price: "",
                    features: [""],
                  })
                }
                onRemove={(idx) => handleListRemove("pricing_plans", idx)}
                renderItem={(plan, idx) => (
                  <div className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField label="Plan Name">
                        <input
                          value={plan.name}
                          onChange={(e) =>
                            handleListUpdate(
                              "pricing_plans",
                              idx,
                              "name",
                              e.target.value,
                            )
                          }
                          className={INPUT_CLASS}
                        />
                      </FormField>
                      <FormField label="Price Label">
                        <input
                          type="number"
                          min="0"
                          value={plan.price}
                          onChange={(e) =>
                            handleListUpdate(
                              "pricing_plans",
                              idx,
                              "price",
                              e.target.value,
                            )
                          }
                          className={INPUT_CLASS}
                        />
                      </FormField>
                    </div>

                    <div className="space-y-3">
                      <label className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Included Features
                      </label>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {plan.features.map((feat: string, fidx: number) => (
                          <div key={fidx} className="flex gap-2">
                            <input
                              value={feat}
                              onChange={(e) => {
                                const newFeats = [...plan.features];
                                newFeats[fidx] = e.target.value;
                                handleListUpdate(
                                  "pricing_plans",
                                  idx,
                                  "features",
                                  newFeats,
                                );
                              }}
                              className={INPUT_CLASS}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newFeats = plan.features.filter(
                                  (_: any, i: number) => i !== fidx,
                                );
                                handleListUpdate(
                                  "pricing_plans",
                                  idx,
                                  "features",
                                  newFeats,
                                );
                              }}
                              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:text-rose-500"
                            >
                              <i className="fas fa-times text-xs"></i>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            handleListUpdate("pricing_plans", idx, "features", [
                              ...plan.features,
                              "",
                            ])
                          }
                          className="h-12 rounded-2xl border border-dashed border-blue-200 bg-white px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 transition hover:bg-blue-50"
                        >
                          Add Feature
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              />
            )}

            <div className={`${PANEL_CLASS} p-6 sm:p-8`}>
              <div className="mb-6 space-y-2">
                <p className={KICKER_CLASS}>Description</p>
                <h2 className={TITLE_CLASS}>Detailed Content</h2>
                <p className="text-sm leading-7 text-slate-600">
                  Write the long-form public content shown on the service
                  details page.
                </p>
              </div>
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <ReactQuill
                  theme="snow"
                  value={form.long_description}
                  onChange={(val) => handleChange("long_description", val)}
                  className="min-h-[400px]"
                />
              </div>
            </div>

            <DynamicList
              title="Mandatory Requirements"
              items={form.required_documents_list}
              onAdd={() =>
                handleListAdd("required_documents_list", {
                  name: "",
                  description: "",
                  is_required: true,
                })
              }
              onRemove={(idx) => handleListRemove("required_documents_list", idx)}
              renderItem={(doc, idx) => (
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <input
                    value={doc.name}
                    onChange={(e) =>
                      handleListUpdate(
                        "required_documents_list",
                        idx,
                        "name",
                        e.target.value,
                      )
                    }
                    placeholder="Document label"
                    className={INPUT_CLASS}
                  />
                  <textarea
                    value={doc.description}
                    onChange={(e) =>
                      handleListUpdate(
                        "required_documents_list",
                        idx,
                        "description",
                        e.target.value,
                      )
                    }
                    placeholder="Short guidance for the user..."
                    rows={3}
                    className={TEXTAREA_CLASS}
                  />
                  <label className="flex items-center gap-3 px-1 text-sm font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={doc.is_required}
                      onChange={(e) =>
                        handleListUpdate(
                          "required_documents_list",
                          idx,
                          "is_required",
                          e.target.checked,
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                    Mark as mandatory
                  </label>
                </div>
              )}
            />

            <DynamicList
              title="Knowledge Base (FAQs)"
              items={form.faqs}
              onAdd={() => handleListAdd("faqs", { question: "", answer: "" })}
              onRemove={(idx) => handleListRemove("faqs", idx)}
              renderItem={(faq, idx) => (
                <div className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <FormField label="Question">
                    <input
                      value={faq.question}
                      onChange={(e) =>
                        handleListUpdate("faqs", idx, "question", e.target.value)
                      }
                      className={INPUT_CLASS}
                    />
                  </FormField>
                  <FormField label="Response">
                    <textarea
                      value={faq.answer}
                      onChange={(e) =>
                        handleListUpdate("faqs", idx, "answer", e.target.value)
                      }
                      rows={4}
                      className={TEXTAREA_CLASS}
                    />
                  </FormField>
                </div>
              )}
            />

            <div className={`${PANEL_CLASS} p-6 sm:p-8`}>
              <div className="mb-6 space-y-2">
                <p className={KICKER_CLASS}>Internal Notes</p>
                <h2 className={TITLE_CLASS}>Operations Guidance</h2>
                <p className="text-sm leading-7 text-slate-600">
                  Add internal notes for admins and operators. These remain
                  private to the admin side.
                </p>
              </div>
              <textarea
                value={form.admin_notes}
                onChange={(e) => handleChange("admin_notes", e.target.value)}
                rows={5}
                placeholder="Internal processing notes..."
                className={TEXTAREA_CLASS}
              />
            </div>

            <ServiceWorkflowBuilder
              serviceId={isEditMode ? Number(id) : null}
            />

            <div className="flex items-center justify-end gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex h-14 flex-1 items-center justify-center gap-3 rounded-2xl bg-slate-900 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition hover:bg-blue-600 disabled:opacity-50 md:h-16 md:text-[11px]"
              >
                {saving ? (
                  <i className="fas fa-circle-notch animate-spin text-lg"></i>
                ) : (
                  <i className="fas fa-save text-lg"></i>
                )}
                {isEditMode ? "Update Service" : "Add"}
              </button>
              <Link
                href="/admin/services"
                className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-red-500 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-red-600 md:h-16 md:text-[11px]"
              >
                Back
              </Link>
            </div>
          </form>
        </div>
      </AdminLayout>
      <style jsx global>{`
        .ql-toolbar.ql-snow {
          border: none !important;
          background: #f8fafc;
          padding: 1rem 1.25rem !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .ql-container.ql-snow {
          border: none !important;
        }
        .ql-editor {
          padding: 1.5rem !important;
          font-family: inherit;
          font-size: 0.95rem;
          line-height: 1.9;
          color: #334155;
          min-height: 400px;
        }
      `}</style>
    </AuthGuard>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}
