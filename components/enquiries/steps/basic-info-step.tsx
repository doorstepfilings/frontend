"use client";

import type { CrmInquiryFormState } from "@/lib/constants/crm";
import { InquiryTextField, SectionHeader } from "./shared";

type BasicInfoStepProps = {
  form: CrmInquiryFormState;
  errors: Record<string, string>;
  onFieldChange: (name: keyof CrmInquiryFormState, value: string) => void;
};

export function BasicInfoStep({
  form,
  errors,
  onFieldChange,
}: BasicInfoStepProps) {
  return (
    <div>
      <SectionHeader
        eyebrow="Step 1"
        title="Start with the client profile"
        description="Capture the essential contact details first so the CA team can review the inquiry, reach out quickly, and open the consultation record with the right context."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <InquiryTextField
          label="Full Name"
          name="fullName"
          value={form.fullName}
          onChange={(name, value) =>
            onFieldChange(name as keyof CrmInquiryFormState, value)
          }
          error={errors.fullName}
          required
          placeholder="Enter customer full name"
        />
        <InquiryTextField
          label="Mobile Number"
          name="mobileNumber"
          value={form.mobileNumber}
          onChange={(name, value) =>
            onFieldChange(name as keyof CrmInquiryFormState, value.replace(/\D/g, ""))
          }
          error={errors.mobileNumber}
          required
          type="tel"
          placeholder="10-digit mobile number"
        />
        <InquiryTextField
          label="Email Address"
          name="email"
          value={form.email}
          onChange={(name, value) =>
            onFieldChange(name as keyof CrmInquiryFormState, value)
          }
          error={errors.email}
          type="email"
          placeholder="name@example.com"
        />
        <InquiryTextField
          label="City"
          name="city"
          value={form.city}
          onChange={(name, value) =>
            onFieldChange(name as keyof CrmInquiryFormState, value)
          }
          error={errors.city}
          required
          placeholder="City"
        />
        <div className="md:col-span-2">
          <InquiryTextField
            label="State"
            name="state"
            value={form.state}
            onChange={(name, value) =>
              onFieldChange(name as keyof CrmInquiryFormState, value)
            }
            error={errors.state}
            required
            placeholder="State"
          />
        </div>
      </div>
    </div>
  );
}
