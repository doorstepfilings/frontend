"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import dynamic from "next/dynamic";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { FormField } from "@/components/ui/core/form-field";
import { DynamicList } from "@/components/ui/core/dynamic-list";
import { SearchSelect } from "@/components/ui/core/search-select";
import { useFormHandler } from "@/hooks/use-form-handler";
import { PageLogoLoader } from "@/components/ui/logo-loader";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

const INPUT_CLASS =
  "w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10";
const TEXTAREA_CLASS =
  "w-full min-h-[14rem] rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold leading-7 text-slate-700 resize-y outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10";
const SECTION_LABEL_CLASS =
  "text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400";

type ServiceFormState = {
  service_category_id: string;
  name: string;
  short_description: string;
  long_description: string;
  price: string;
  pricing_plans: Array<{
    name: string;
    price: string;
    features: string[];
  }>;
  required_documents_list: Array<{
    name: string;
    description: string;
    is_required: boolean;
  }>;
  extra_documents: Array<{
    name: string;
    description: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  admin_notes: string;
};

const INITIAL_STATE: ServiceFormState = {
  service_category_id: "",
  name: "",
  short_description: "",
  long_description: "",
  price: "",
  pricing_plans: [],
  required_documents_list: [
    { name: "", description: "", is_required: true },
  ],
  extra_documents: [],
  faqs: [],
  admin_notes: "",
};

function createPricingPlan() {
  return {
    name: "",
    price: "",
    features: [""],
  };
}

function createRequiredDocument() {
  return {
    name: "",
    description: "",
    is_required: true,
  };
}

function createExtraDocument() {
  return {
    name: "",
    description: "",
  };
}

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
  } = useFormHandler<ServiceFormState>({
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
      if (!v.service_category_id) {
        return "Please select a parent category";
      }

      if (!v.name) {
        return "Service identity is required";
      }

      if (v.price !== "" && Number(v.price) < 0) {
        return "Base price cannot be below 0";
      }

      const hasNegativePlanPrice =
        Array.isArray(v.pricing_plans) &&
        v.pricing_plans.some(
          (plan) => plan?.price !== "" && Number(plan?.price) < 0,
        );

      if (hasNegativePlanPrice) {
        return "Plan price cannot be below 0";
      }

      return null;
    },
    successMessage: `Service ${isEditMode ? "updated" : "created"} successfully`,
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

          const pricing_plans = data.pricing_plans ?? data.pricingPlans ?? [];
          const extra_documents = data.extra_documents ?? data.extraDocuments ?? [];
          setShowPlans(pricing_plans.length > 0);
          setShowExtraDocs(extra_documents.length > 0);
          setForm({
            ...INITIAL_STATE,
            service_category_id: String(data.service_category_id ?? data.serviceCategoryId ?? ""),
            name: data.name ?? "",
            short_description: data.short_description ?? data.shortDescription ?? "",
            long_description: data.long_description ?? data.longDescription ?? "",
            price: data.price != null ? String(data.price) : "",
            pricing_plans,
            required_documents_list: data.required_documents_list ?? data.requiredDocumentsList ?? INITIAL_STATE.required_documents_list,
            extra_documents,
            faqs: data.faqs ?? [],
            admin_notes: data.admin_notes ?? data.adminNotes ?? "",
          });
        }
      } catch (error: any) {
        toast.error("Failed to synchronize catalog data");
        if (isEditMode) {
          router.push("/admin/services");
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [id, isEditMode, router, setForm, setLoading]);

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category: any) =>
          String(category.id) === String(form.service_category_id),
      ) ?? null,
    [categories, form.service_category_id],
  );

  if (loading) {
    return (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AdminLayout>
          <PageLogoLoader
            className="min-h-[22rem] py-12"
            label="Synchronizing service details..."
            size={64}
          />
        </AdminLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="w-full space-y-8 py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Link
                href="/admin/services"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Services
              </Link>
              <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  {isEditMode ? "Edit Service" : "Create Service"}
                </h1>
                <p className="text-sm font-medium text-slate-500">
                  {isEditMode ? `Service #${id}` : "New draft"}
                  {selectedCategory ? ` / ${selectedCategory.name}` : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/services"
                className="admin-btn-muted h-12 min-w-[9rem] rounded-2xl px-6 text-xs flex items-center justify-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                form="service-editor-form"
                disabled={saving}
                className="admin-btn h-12 min-w-[11rem] rounded-2xl px-6 text-xs flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                {saving
                  ? "Saving..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Service"}
              </button>
            </div>
          </div>

          <form
            id="service-editor-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <section className="rounded-none border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="space-y-8 px-5 py-6 sm:px-6 sm:py-7">
                <section className="space-y-5">
                  <SectionHeader
                    kicker="Service Information"
                    title="Basic Details"
                  />

                  <div className="grid gap-5 lg:grid-cols-12">
                    <FormField
                      label="Parent Category"
                      required
                      className="lg:col-span-4"
                    >
                      <SearchSelect
                        options={[
                          { value: "", label: "Select category..." },
                          ...categories.map((category: any) => ({
                            value: String(category.id),
                            label: String(category.name ?? ""),
                          })),
                        ]}
                        value={form.service_category_id}
                        onChange={(nextValue) =>
                          handleChange("service_category_id", nextValue)
                        }
                        searchable={categories.length > 6}
                        treatEmptyValueAsPlaceholder
                        triggerClassName="w-full"
                      />
                      </FormField>

                      <FormField
                        label="Service Name"
                        required
                        className="lg:col-span-8"
                      >
                        <input
                          type="text"
                          value={form.name}
                          onChange={(event) => handleChange("name", event.target.value)}
                          placeholder="e.g. Private Limited Incorporation"
                          className={INPUT_CLASS}
                        />
                      </FormField>

                      <FormField
                        label="Listing Summary"
                        required
                        className="lg:col-span-12"
                      >
                        <input
                          type="text"
                          value={form.short_description}
                          onChange={(event) =>
                            handleChange("short_description", event.target.value)
                          }
                          placeholder="Brief summary for catalog view..."
                          className={INPUT_CLASS}
                        />
                      </FormField>
                    </div>
                  </section>

                  <SectionDivider />

                  <section className="space-y-5">
                    <SectionHeader
                      kicker="Pricing"
                      title="Pricing & Packages"
                    />

                    <div className="grid gap-4 md:grid-cols-2 md:items-end">
                      <FormField
                        label="Base Price"
                        className="min-w-0"
                      >
                        <CurrencyInput
                          value={form.price}
                          onChange={(value) => handleChange("price", value)}
                          placeholder="Optional"
                        />
                      </FormField>

                      <div className="min-w-0 md:pb-[1px]">
                        <CompactToggle
                          label="Pricing Tiers"
                          checked={showPlans}
                          onChange={(checked) => {
                            setShowPlans(checked);
                            if (checked && form.pricing_plans.length === 0) {
                              handleListAdd("pricing_plans", createPricingPlan());
                            }
                          }}
                        />
                      </div>
                    </div>

                    {showPlans ? (
                      <DynamicList
                        title="Pricing Plans"
                        addLabel="Add Plan"
                        items={form.pricing_plans}
                        onAdd={() => handleListAdd("pricing_plans", createPricingPlan())}
                        onRemove={(index) => handleListRemove("pricing_plans", index)}
                        className="rounded-none border-0 bg-transparent p-0 shadow-none sm:p-0"
                        showCount={false}
                        renderItem={(plan, index) => (
                          <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                            <div className="grid gap-4 md:grid-cols-2">
                              <FormField label="Plan Name">
                                <input
                                  value={plan.name}
                                  onChange={(event) =>
                                    handleListUpdate(
                                      "pricing_plans",
                                      index,
                                      "name",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="e.g. Standard"
                                  className={INPUT_CLASS}
                                />
                              </FormField>
                              <FormField label="Plan Price">
                                <CurrencyInput
                                  value={plan.price}
                                  onChange={(value) =>
                                    handleListUpdate(
                                      "pricing_plans",
                                      index,
                                      "price",
                                      value,
                                    )
                                  }
                                />
                              </FormField>
                            </div>

                            <div className="space-y-3">
                              <p className={SECTION_LABEL_CLASS}>Included Features</p>
                              <div className="grid gap-3">
                                {plan.features.map((feature, featureIndex) => (
                                  <div
                                    key={featureIndex}
                                    className="flex flex-col gap-2 sm:flex-row sm:items-start"
                                  >
                                    <input
                                      value={feature}
                                      onChange={(event) => {
                                        const nextFeatures = [...plan.features];
                                        nextFeatures[featureIndex] = event.target.value;
                                        handleListUpdate(
                                          "pricing_plans",
                                          index,
                                          "features",
                                          nextFeatures,
                                        );
                                      }}
                                      placeholder="Feature description"
                                      className={INPUT_CLASS}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextFeatures = plan.features.filter(
                                          (_item, itemIndex) =>
                                            itemIndex !== featureIndex,
                                        );
                                        handleListUpdate(
                                          "pricing_plans",
                                          index,
                                          "features",
                                          nextFeatures.length > 0
                                            ? nextFeatures
                                            : [""],
                                        );
                                      }}
                                      className="flex h-11 w-full shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 transition hover:border-rose-200 hover:text-rose-500 sm:w-auto"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                      Remove
                                    </button>
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleListUpdate(
                                      "pricing_plans",
                                      index,
                                      "features",
                                      [...plan.features, ""],
                                    )
                                  }
                                  className="inline-flex h-10 items-center justify-center rounded-xl border border-dashed border-blue-200 bg-white px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700 transition hover:bg-blue-50"
                                >
                                  Add Feature
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      />
                    ) : null}
                  </section>

                  <SectionDivider />

                  <section className="space-y-5">
                    <SectionHeader
                      kicker="Description"
                      title="Detailed Description"
                    />

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <ReactQuill
                        theme="snow"
                        value={form.long_description}
                        onChange={(value) => handleChange("long_description", value)}
                        className="min-h-[260px] sm:min-h-[320px]"
                      />
                    </div>
                  </section>

                  <SectionDivider />

                  <section className="space-y-6">
                    <SectionHeader
                      kicker="Documents"
                      title="Upload Requirements"
                    />

                    <DynamicList
                      title="Required Documents"
                      addLabel="Add Document"
                      items={form.required_documents_list}
                      onAdd={() =>
                        handleListAdd(
                          "required_documents_list",
                          createRequiredDocument(),
                        )
                      }
                      onRemove={(index) =>
                        handleListRemove("required_documents_list", index)
                      }
                      className="rounded-none border-0 bg-transparent p-0 shadow-none sm:p-0"
                      showCount={false}
                      renderItem={(document, index) => (
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                          <FormField label="Document Name">
                            <input
                              value={document.name}
                              onChange={(event) =>
                                handleListUpdate(
                                  "required_documents_list",
                                  index,
                                  "name",
                                  event.target.value,
                                )
                              }
                              placeholder="e.g. PAN Card"
                              className={INPUT_CLASS}
                            />
                          </FormField>
                          <FormField label="Helper Text">
                            <textarea
                              value={document.description}
                              onChange={(event) =>
                                handleListUpdate(
                                  "required_documents_list",
                                  index,
                                  "description",
                                  event.target.value,
                                )
                              }
                              placeholder="Short guidance for the user..."
                              rows={3}
                              className={TEXTAREA_CLASS}
                            />
                          </FormField>
                          <label className="flex items-center gap-3 px-1 text-sm font-medium text-slate-600">
                            <input
                              type="checkbox"
                              checked={document.is_required}
                              onChange={(event) =>
                                handleListUpdate(
                                  "required_documents_list",
                                  index,
                                  "is_required",
                                  event.target.checked,
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-blue-600"
                            />
                            Mark as mandatory
                          </label>
                        </div>
                      )}
                    />

                    <CompactToggle
                      label="Optional Documents"
                      checked={showExtraDocs}
                      onChange={(checked) => {
                        setShowExtraDocs(checked);
                        if (checked && form.extra_documents.length === 0) {
                          handleListAdd("extra_documents", createExtraDocument());
                        }
                      }}
                    />

                    {showExtraDocs ? (
                      <DynamicList
                        title="Optional Documents"
                        addLabel="Add Optional Doc"
                        items={form.extra_documents}
                        onAdd={() =>
                          handleListAdd("extra_documents", createExtraDocument())
                        }
                        onRemove={(index) =>
                          handleListRemove("extra_documents", index)
                        }
                        className="rounded-none border-0 bg-transparent p-0 shadow-none sm:p-0"
                        showCount={false}
                        renderItem={(document, index) => (
                          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                            <FormField label="Document Name">
                              <input
                                value={document.name}
                                onChange={(event) =>
                                  handleListUpdate(
                                    "extra_documents",
                                    index,
                                    "name",
                                    event.target.value,
                                  )
                                }
                                placeholder="e.g. Partnership Deed"
                                className={INPUT_CLASS}
                              />
                            </FormField>
                            <FormField label="Helper Text">
                              <textarea
                                value={document.description}
                                onChange={(event) =>
                                  handleListUpdate(
                                    "extra_documents",
                                    index,
                                    "description",
                                    event.target.value,
                                  )
                                }
                                placeholder="When should the client upload this?"
                                rows={3}
                                className={TEXTAREA_CLASS}
                              />
                            </FormField>
                          </div>
                        )}
                      />
                    ) : null}
                  </section>

                  <SectionDivider />

                  <section className="space-y-5">
                    <SectionHeader
                      kicker="FAQs"
                      title="Frequently Asked Questions"
                    />

                    <DynamicList
                      title="FAQs"
                      addLabel="Add FAQ"
                      items={form.faqs}
                      onAdd={() =>
                        handleListAdd("faqs", { question: "", answer: "" })
                      }
                      onRemove={(index) => handleListRemove("faqs", index)}
                      className="rounded-none border-0 bg-transparent p-0 shadow-none sm:p-0"
                      showCount={false}
                      renderItem={(faq, index) => (
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                          <FormField label="Question">
                            <input
                              value={faq.question}
                              onChange={(event) =>
                                handleListUpdate(
                                  "faqs",
                                  index,
                                  "question",
                                  event.target.value,
                                )
                              }
                              placeholder="What does this service cover?"
                              className={INPUT_CLASS}
                            />
                          </FormField>
                          <FormField label="Answer">
                            <textarea
                              value={faq.answer}
                              onChange={(event) =>
                                handleListUpdate(
                                  "faqs",
                                  index,
                                  "answer",
                                  event.target.value,
                                )
                              }
                              rows={4}
                              placeholder="Write a concise answer..."
                              className={TEXTAREA_CLASS}
                            />
                          </FormField>
                        </div>
                      )}
                    />
                  </section>

                  <SectionDivider />

                  <section className="space-y-5">
                    <SectionHeader
                      kicker="Internal Notes"
                      title="Operations Notes"
                    />

                    <textarea
                      value={form.admin_notes}
                      onChange={(event) =>
                        handleChange("admin_notes", event.target.value)
                      }
                      rows={10}
                      placeholder="Internal processing notes..."
                      className={TEXTAREA_CLASS}
                    />
                  </section>
                </div>
              </section>
            </form>

          </div>
        </AdminLayout>
      <style jsx global>{`
        .ql-toolbar.ql-snow {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.45rem;
          border: none !important;
          background: #f8fafc;
          padding: 0.85rem 1rem !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .ql-toolbar.ql-snow .ql-formats {
          margin-right: 0 !important;
          margin-bottom: 0 !important;
        }
        .ql-container.ql-snow {
          border: none !important;
        }
        .ql-editor {
          padding: 1rem 1.1rem !important;
          font-family: inherit;
          font-size: 0.94rem;
          line-height: 1.8;
          color: #334155;
          min-height: 320px;
        }
        @media (max-width: 640px) {
          .ql-toolbar.ql-snow {
            gap: 0.35rem;
            padding: 0.75rem !important;
          }
          .ql-editor {
            min-height: 240px;
            padding: 0.9rem 0.95rem !important;
          }
        }
      `}</style>
    </AuthGuard>
  );
}

function SectionHeader({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 space-y-1">
      <p className={SECTION_LABEL_CLASS}>{kicker}</p>
      <h2 className="text-lg font-bold tracking-tight text-slate-950">{title}</h2>
      {description ? (
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
  );
}

function CurrencyInput({
  value,
  onChange,
  placeholder = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10">
      <span className="flex h-12 w-16 shrink-0 items-center justify-center border-r border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500 sm:w-[4.5rem]">
        Rs
      </span>
      <input
        type="number"
        min="0"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full border-0 bg-transparent px-4 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

function CompactToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className="flex h-12 w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 text-left transition hover:border-blue-200 hover:bg-white sm:px-5"
    >
      <span className="min-w-0 text-sm font-semibold text-slate-900">{label}</span>
      <span
        className={`relative flex h-6 w-11 items-center rounded-full p-1 transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
