"use client";

import {
  CRM_CUSTOMER_TYPE_OPTIONS,
  type CrmCustomerType,
} from "@/lib/constants/crm";
import { ChoiceCard, SectionHeader } from "./shared";

type CustomerTypeStepProps = {
  value: CrmCustomerType | "";
  error?: string;
  onSelect: (value: CrmCustomerType) => void;
};

export function CustomerTypeStep({
  value,
  error,
  onSelect,
}: CustomerTypeStepProps) {
  return (
    <div>
      <SectionHeader
        eyebrow="Step 2"
        title="Classify the customer correctly"
        description="This one choice drives the rest of the consultation form. The CA team will use it to decide which financial, compliance, and registration reviews are actually relevant."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {CRM_CUSTOMER_TYPE_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            title={option.label}
            description={option.description}
            active={value === option.value}
            onClick={() => onSelect(option.value)}
          />
        ))}
      </div>

      {error ? (
        <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}
