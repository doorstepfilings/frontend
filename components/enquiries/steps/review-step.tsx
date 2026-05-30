"use client";

import {
  CRM_PROFILE_FIELDS,
  getCrmCustomerTypeLabel,
  getCrmDocumentTypeLabel,
  type CrmInquiryFormState,
} from "@/lib/constants/crm";
import { ReviewRow, SectionHeader } from "./shared";

type ReviewStepProps = {
  form: CrmInquiryFormState;
};

export function ReviewStep({ form }: ReviewStepProps) {
  const profileFields = form.customerType
    ? CRM_PROFILE_FIELDS[form.customerType]
    : [];
  const uploadedDocuments = form.documents.filter(
    (document) => document.file && document.type,
  );

  return (
    <div>
      <SectionHeader
        eyebrow="Step 5"
        title="Review before submitting"
        description="This final review helps your team receive a complete, consultation-ready inquiry. The customer is sharing information only. Your CA team will identify the actual services after review."
      />

      <div className="space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-50/70 p-6">
          <h3 className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
            Customer Snapshot
          </h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ReviewRow label="Full Name" value={form.fullName} />
            <ReviewRow label="Mobile Number" value={form.mobileNumber} />
            <ReviewRow label="Email Address" value={form.email} />
            <ReviewRow label="City" value={form.city} />
            <ReviewRow label="State" value={form.state} />
            <ReviewRow
              label="Customer Type"
              value={getCrmCustomerTypeLabel(form.customerType)}
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <h3 className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
            Profile Details
          </h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {profileFields.map((field) => (
              <ReviewRow
                key={field.key}
                label={field.label}
                value={String(form.profileData[field.key] ?? "")}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <h3 className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
            Uploaded Documents
          </h3>
          {uploadedDocuments.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm font-medium text-slate-500">
              No documents attached yet. The inquiry can still be submitted.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {uploadedDocuments.map((document, index) => (
                <div
                  key={`${document.type}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {getCrmDocumentTypeLabel(document.type)}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                    {document.file?.name}
                  </p>
                  {document.notes ? (
                    <p className="mt-2 text-sm text-slate-500">
                      {document.notes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
