"use client";

import {
  CRM_PROFILE_FIELDS,
  getCrmCustomerTypeLabel,
  type CrmCustomerType,
  type CrmProfileData,
} from "@/lib/constants/crm";
import {
  InquirySelectField,
  InquiryTextField,
  InquiryTextareaField,
  SectionHeader,
} from "./shared";

type DynamicProfileStepProps = {
  customerType: CrmCustomerType | "";
  profileData: CrmProfileData;
  errors: Record<string, string>;
  onProfileChange: (name: string, value: string) => void;
};

export function DynamicProfileStep({
  customerType,
  profileData,
  errors,
  onProfileChange,
}: DynamicProfileStepProps) {
  const fields = customerType ? CRM_PROFILE_FIELDS[customerType] : [];

  if (!customerType) {
    return (
      <div>
        <SectionHeader
          eyebrow="Step 3"
          title="Profile questions will adapt here"
          description="Choose the customer classification first, and we will load the exact profile questions the CA team needs for that type of inquiry."
        />

        <div className="rounded-[2rem] border border-dashed border-sky-200 bg-sky-50/70 px-6 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm">
            <i className="fas fa-layer-group" />
          </div>
          <p className="mt-4 text-base font-bold text-slate-900">
            Select a customer classification to continue
          </p>
          <p className="mt-2 text-sm text-slate-500">
            The form becomes tailored for salaried individuals, business owners,
            professionals, freelancers, or company / LLP inquiries.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Step 3"
        title={`${getCrmCustomerTypeLabel(customerType)} profile`}
        description="These details help your internal team identify the right tax, registration, accounting, compliance, or advisory services after reviewing the case."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((field) => {
          const value = String(profileData[field.key] ?? "");

          if (field.type === "textarea") {
            return (
              <div key={field.key} className="md:col-span-2">
                <InquiryTextareaField
                  label={field.label}
                  name={field.key}
                  value={value}
                  onChange={onProfileChange}
                  error={errors[field.key]}
                  placeholder={field.placeholder}
                  helpText={field.helpText}
                  required={isRequiredProfileField(customerType, field.key)}
                />
              </div>
            );
          }

          if (field.type === "select") {
            return (
              <InquirySelectField
                key={field.key}
                label={field.label}
                name={field.key}
                value={value}
                onChange={onProfileChange}
                error={errors[field.key]}
                options={field.options ?? []}
                helpText={field.helpText}
                placeholder={`Select ${field.label}`}
                required={isRequiredProfileField(customerType, field.key)}
              />
            );
          }

          return (
            <InquiryTextField
              key={field.key}
              label={field.label}
              name={field.key}
              value={value}
              onChange={onProfileChange}
              error={errors[field.key]}
              placeholder={field.placeholder}
              type={field.type === "number" ? "number" : "text"}
              helpText={field.helpText}
              required={isRequiredProfileField(customerType, field.key)}
            />
          );
        })}
      </div>
    </div>
  );
}

function isRequiredProfileField(customerType: CrmCustomerType, key: string) {
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

  return requiredMap[customerType].includes(key);
}
