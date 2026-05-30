"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { crmApi } from "@/lib/api/crm-api";
import {
  CRM_INITIAL_FORM_STATE,
  CRM_PROFILE_FIELDS,
  getCrmCustomerTypeLabel,
  type CrmCustomerType,
  type CrmInquiryDocumentInput,
  type CrmInquiryFormState,
} from "@/lib/constants/crm";
import { parseApiError } from "@/lib/utils/error-parser";
import { BasicInfoStep } from "./steps/basic-info-step";
import { CustomerTypeStep } from "./steps/customer-type-step";
import { DocumentsStep } from "./steps/documents-step";
import { DynamicProfileStep } from "./steps/dynamic-profile-step";
import { ReviewStep } from "./steps/review-step";

const STEP_ITEMS = [
  {
    label: "Basic Info",
    icon: "fa-user",
    helper: "Contact and location basics",
  },
  {
    label: "Classification",
    icon: "fa-layer-group",
    helper: "Choose the customer type",
  },
  {
    label: "Profile",
    icon: "fa-id-card-clip",
    helper: "Capture type-specific details",
  },
  {
    label: "Documents",
    icon: "fa-folder-open",
    helper: "Attach available documents",
  },
  {
    label: "Review",
    icon: "fa-check-double",
    helper: "Confirm and submit inquiry",
  },
] as const;

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function createDocumentRow(): CrmInquiryDocumentInput {
  return { type: "", file: null, notes: "" };
}

export function CrmInquiryForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<CrmInquiryFormState>(CRM_INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileErrors, setFileErrors] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReference, setSubmittedReference] = useState<string | null>(
    null,
  );

  const progress = ((currentStep + 1) / STEP_ITEMS.length) * 100;
  const currentStepConfig = STEP_ITEMS[currentStep];

  const uploadedDocumentsCount = useMemo(
    () => form.documents.filter((row) => row.file && row.type).length,
    [form.documents],
  );

  const handleFieldChange = (name: keyof CrmInquiryFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const handleCustomerTypeSelect = (value: CrmCustomerType) => {
    setForm((current) => ({
      ...current,
      customerType: value,
      profileData: {},
    }));
    setErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors.customerType;
      return nextErrors;
    });
  };

  const handleProfileChange = (name: string, value: string) => {
    setForm((current) => ({
      ...current,
      profileData: {
        ...current.profileData,
        [name]: value,
      },
    }));
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const handleFileChange = (index: number, file: File | null) => {
    setForm((current) => {
      const documents = [...current.documents];
      documents[index] = {
        ...documents[index],
        file,
      };

      return {
        ...current,
        documents,
      };
    });

    setFileErrors((current) => {
      const nextErrors = { ...current };

      if (!file) {
        delete nextErrors[index];
        return nextErrors;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        nextErrors[index] = "Each document must be 5 MB or smaller.";
        return nextErrors;
      }

      delete nextErrors[index];
      return nextErrors;
    });
  };

  const handleDocumentTypeChange = (index: number, value: string) => {
    setForm((current) => {
      const documents = [...current.documents];
      documents[index] = {
        ...documents[index],
        type: value as CrmInquiryDocumentInput["type"],
      };

      return {
        ...current,
        documents,
      };
    });
  };

  const handleDocumentNotesChange = (index: number, value: string) => {
    setForm((current) => {
      const documents = [...current.documents];
      documents[index] = {
        ...documents[index],
        notes: value,
      };

      return {
        ...current,
        documents,
      };
    });
  };

  const handleAddDocumentRow = () => {
    setForm((current) => ({
      ...current,
      documents: [...current.documents, createDocumentRow()],
    }));
  };

  const handleRemoveDocumentRow = (index: number) => {
    setForm((current) => {
      const documents = current.documents.filter((_, rowIndex) => rowIndex !== index);

      return {
        ...current,
        documents: documents.length > 0 ? documents : [createDocumentRow()],
      };
    });
    setFileErrors((current) => {
      const nextErrors: Record<number, string> = {};

      Object.entries(current).forEach(([key, value]) => {
        const rowIndex = Number(key);
        if (rowIndex < index) {
          nextErrors[rowIndex] = value;
        } else if (rowIndex > index) {
          nextErrors[rowIndex - 1] = value;
        }
      });

      return nextErrors;
    });
  };

  const validateCurrentStep = () => {
    const nextErrors: Record<string, string> = {};
    const nextFileErrors: Record<number, string> = {};

    if (currentStep === 0) {
      if (!form.fullName.trim()) {
        nextErrors.fullName = "Full name is required.";
      }

      if (!form.mobileNumber.trim()) {
        nextErrors.mobileNumber = "Mobile number is required.";
      } else if (form.mobileNumber.trim().length < 10) {
        nextErrors.mobileNumber = "Enter a valid 10-digit mobile number.";
      }

      if (form.email.trim() && !EMAIL_REGEX.test(form.email.trim())) {
        nextErrors.email = "Enter a valid email address.";
      }

      if (!form.city.trim()) {
        nextErrors.city = "City is required.";
      }

      if (!form.state.trim()) {
        nextErrors.state = "State is required.";
      }
    }

    if (currentStep === 1 && !form.customerType) {
      nextErrors.customerType = "Please classify the customer before continuing.";
    }

    if (currentStep === 2) {
      if (!form.customerType) {
        nextErrors.customerType = "Choose a customer type first.";
      } else {
        const requiredFields = getRequiredProfileKeys(form.customerType);

        requiredFields.forEach((field) => {
          const value = String(form.profileData[field] ?? "").trim();
          if (!value) {
            nextErrors[field] = "This field is required.";
          }
        });

        const panNumber = String(form.profileData.panNumber ?? "").trim();
        if (panNumber && !PAN_REGEX.test(panNumber)) {
          nextErrors.panNumber = "PAN format should look like ABCDE1234F.";
        }

        const gstNumber = String(form.profileData.gstNumber ?? "").trim();
        if (gstNumber && !GST_REGEX.test(gstNumber)) {
          nextErrors.gstNumber =
            "GST format should look like 22AAAAA0000A1Z5.";
        }
      }
    }

    if (currentStep === 3) {
      form.documents.forEach((document, index) => {
        if (!document.file && !document.type && !document.notes.trim()) {
          return;
        }

        if (document.file && !document.type) {
          nextFileErrors[index] = "Choose a document type for this upload.";
          return;
        }

        if (!document.file && document.type) {
          nextFileErrors[index] = "Attach the file for this document type.";
          return;
        }

        if (document.file && document.file.size > MAX_FILE_SIZE_BYTES) {
          nextFileErrors[index] = "Each document must be 5 MB or smaller.";
        }
      });
    }

    setErrors(nextErrors);
    setFileErrors(nextFileErrors);

    return Object.keys(nextErrors).length === 0 &&
      Object.keys(nextFileErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, STEP_ITEMS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("full_name", form.fullName.trim());
      payload.append("mobile_number", form.mobileNumber.trim());
      payload.append("email", form.email.trim());
      payload.append("city", form.city.trim());
      payload.append("state", form.state.trim());
      payload.append("customer_type", form.customerType);
      payload.append("profile_data", JSON.stringify(form.profileData));

      form.documents.forEach((document, index) => {
        if (!document.file || !document.type) {
          return;
        }

        payload.append(`documents[${index}][file]`, document.file);
        payload.append(`documents[${index}][type]`, document.type);
        payload.append(`documents[${index}][document_type]`, document.type);
        if (document.notes.trim()) {
          payload.append(`documents[${index}][notes]`, document.notes.trim());
        }
      });

      const response = await crmApi.createInquiry(payload);
      const data = response.data?.data ?? response.data;
      const reference =
        data?.inquiry_number ??
        data?.inquiryNumber ??
        data?.id ??
        "Submitted";

      setSubmittedReference(String(reference));
      toast.success("Consultation inquiry submitted successfully");
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedReference) {
    return (
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_100%)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2.5rem] border border-sky-100 bg-white/95 p-8 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <i className="fas fa-check text-xl" />
          </div>
          <div className="mx-auto mt-6 max-w-2xl text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-emerald-600">
              Inquiry Submitted
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Your CA consultation request is now in the CRM
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              Our team will review the profile, verify available documents, and
              identify the right tax, compliance, registration, or accounting
              services from the information you shared.
            </p>
          </div>

          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-5 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              Inquiry Reference
            </p>
            <p className="mt-2 text-2xl font-black tracking-[0.08em] text-slate-900">
              {submittedReference}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              onClick={() => {
                setSubmittedReference(null);
                setCurrentStep(0);
                setForm(CRM_INITIAL_FORM_STATE);
                setErrors({});
                setFileErrors({});
              }}
              className="h-12 rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white hover:bg-sky-700"
            >
              Submit Another Inquiry
            </Button>
            <Link
              href="/services"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition-all hover:border-sky-200 hover:text-sky-700"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_100%)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[2.5rem] border border-white/60 bg-white/95 p-6 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 border-b border-slate-100 pb-8">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.35em] text-sky-700/70">
                    CA CRM Inquiry Flow
                  </p>
                  <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    Professional consultation intake for tax and compliance
                  </h1>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Progress
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    Step {currentStep + 1} of {STEP_ITEMS.length}
                  </p>
                </div>
              </div>

              <div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-slate-900 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-5">
                  {STEP_ITEMS.map((step, index) => {
                    const isActive = index === currentStep;
                    const isComplete = index < currentStep;

                    return (
                      <div
                        key={step.label}
                        className={`rounded-2xl border px-3 py-3 transition-all ${
                          isActive
                            ? "border-sky-300 bg-sky-50"
                            : isComplete
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                              isActive
                                ? "bg-sky-600 text-white"
                                : isComplete
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <i
                              className={`fas ${
                                isComplete ? "fa-check" : step.icon
                              }`}
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-900">
                              {step.label}
                            </p>
                            <p className="truncate text-[10px] text-slate-500">
                              {step.helper}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-8">
              {currentStep === 0 ? (
                <BasicInfoStep
                  form={form}
                  errors={errors}
                  onFieldChange={handleFieldChange}
                />
              ) : null}
              {currentStep === 1 ? (
                <CustomerTypeStep
                  value={form.customerType}
                  error={errors.customerType}
                  onSelect={handleCustomerTypeSelect}
                />
              ) : null}
              {currentStep === 2 ? (
                <DynamicProfileStep
                  customerType={form.customerType}
                  profileData={form.profileData}
                  errors={errors}
                  onProfileChange={handleProfileChange}
                />
              ) : null}
              {currentStep === 3 ? (
                <DocumentsStep
                  documents={form.documents}
                  fileErrors={fileErrors}
                  onFileChange={handleFileChange}
                  onAddRow={handleAddDocumentRow}
                  onRemoveRow={handleRemoveDocumentRow}
                  onTypeChange={handleDocumentTypeChange}
                  onNotesChange={handleDocumentNotesChange}
                />
              ) : null}
              {currentStep === 4 ? <ReviewStep form={form} /> : null}
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Current Section
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {currentStepConfig.label}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0 || isSubmitting}
                  className="h-12 rounded-2xl border-slate-200 px-6 text-sm font-bold text-slate-700"
                >
                  Back
                </Button>
                {currentStep === STEP_ITEMS.length - 1 ? (
                  <Button
                    type="button"
                    loading={isSubmitting}
                    onClick={handleSubmit}
                    className="h-12 rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white hover:bg-sky-700"
                  >
                    Submit Inquiry
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="h-12 rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white hover:bg-sky-700"
                  >
                    Continue
                  </Button>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2.25rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_25px_100px_-50px_rgba(15,23,42,0.8)]">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-200">
                Internal Workflow
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight">
                Customers share information. Your team chooses the services.
              </h2>
              <div className="mt-6 space-y-3">
                {[
                  "Profile Verification",
                  "Document Verification",
                  "Assigned to Accountant",
                  "Service Identification",
                  "Quotation Sent",
                  "Payment Received",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-sky-100">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-100">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2.25rem] border border-slate-200 bg-white p-7 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
                Intake Snapshot
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <InsightCard
                  icon="fa-user-shield"
                  label="Customer Type"
                  value={
                    form.customerType
                      ? CRM_PROFILE_FIELDS[form.customerType].length
                        ? getCrmCustomerTypeLabel(form.customerType)
                        : "Not selected"
                      : "Not selected"
                  }
                  helper="Classification drives the dynamic profile form."
                />
                <InsightCard
                  icon="fa-file-arrow-up"
                  label="Documents Added"
                  value={String(uploadedDocumentsCount)}
                  helper="Supporting files can be uploaded now or later."
                />
                <InsightCard
                  icon="fa-user-gear"
                  label="Consultation Model"
                  value="Team-led"
                  helper="No service booking is exposed to the customer."
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function getRequiredProfileKeys(customerType: CrmCustomerType) {
  const requiredMap: Record<CrmCustomerType, string[]> = {
    salaried: ["employerName", "annualSalary"],
    business_owner: [
      "businessName",
      "businessType",
      "annualTurnover",
      "businessAddress",
    ],
    professional: ["professionType", "annualIncome"],
    freelancer: ["workCategory", "annualIncome", "clientCoverage"],
    company_llp: ["companyName", "cinOrLlpin", "annualTurnover", "authorizedPerson"],
  };

  return requiredMap[customerType];
}

function InsightCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: string;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <i className={`fas ${icon}`} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-base font-bold capitalize text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
        </div>
      </div>
    </div>
  );
}
