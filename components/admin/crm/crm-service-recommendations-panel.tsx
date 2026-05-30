"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { adminApi } from "@/lib/api/admin-api";
import { formatCurrency, type CrmInquiryRecord } from "@/lib/constants/crm";
import { parseApiError } from "@/lib/utils/error-parser";
import { formatDateTime } from "@/lib/utils/formatters";
import {
  CrmEmptyState,
  CrmInlineField,
  CrmInlineSelect,
  CrmInlineTextarea,
  CrmPanel,
  CrmSubmitButton,
} from "./shared";

type CrmServiceRecommendationsPanelProps = {
  inquiry: CrmInquiryRecord;
  services: Array<{ id: number; name: string }>;
  onRefresh: () => Promise<void> | void;
};

export function CrmServiceRecommendationsPanel({
  inquiry,
  services,
  onRefresh,
}: CrmServiceRecommendationsPanelProps) {
  const [serviceId, setServiceId] = useState("");
  const [notes, setNotes] = useState("");
  const [quotedAmount, setQuotedAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!serviceId) {
      toast.error("Select a service before saving.");
      return;
    }

    setSaving(true);

    try {
      await adminApi.recommendCrmService(inquiry.id, {
        service_id: Number(serviceId),
        notes: notes.trim() || undefined,
        quoted_amount: quotedAmount.trim() || undefined,
      });
      toast.success("Recommended service added");
      setServiceId("");
      setNotes("");
      setQuotedAmount("");
      await onRefresh();
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CrmPanel
      title="Service Identification"
      eyebrow="Internal Recommendation"
    >
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <CrmInlineSelect
            label="Recommended Service"
            value={serviceId}
            onChange={setServiceId}
            options={services.map((service) => ({
              value: service.id,
              label: service.name,
            }))}
            placeholder="Select service"
          />
          <CrmInlineField
            label="Quoted Amount"
            value={quotedAmount}
            onChange={setQuotedAmount}
            type="number"
            placeholder="Optional amount"
          />
          <div className="lg:col-span-2">
            <CrmInlineTextarea
              label="Recommendation Notes"
              value={notes}
              onChange={setNotes}
              placeholder="Explain why this service should be offered based on the inquiry profile."
            />
          </div>
        </div>

        <CrmSubmitButton
          label="Add Recommendation"
          loading={saving}
          onClick={handleSave}
        />

        {inquiry.recommendations.length === 0 ? (
          <CrmEmptyState
            icon="fa-compass-drafting"
            title="No services identified yet"
            description="Use this panel after review to map the inquiry into the correct tax, compliance, registration, or accounting services."
          />
        ) : (
          <div className="space-y-4">
            {inquiry.recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="rounded-[1.6rem] border border-slate-200 bg-slate-50/70 px-5 py-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {recommendation.service?.name || "Recommended service"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {recommendation.service?.category?.name || "General advisory"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Recommended On
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {formatDateTime(recommendation.created_at ?? undefined)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">
                    {recommendation.notes || "No notes added for this recommendation."}
                  </p>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                    {formatCurrency(recommendation.quoted_amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CrmPanel>
  );
}
