"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { adminApi } from "@/lib/api/admin-api";
import {
  CRM_QUOTATION_STATUS_OPTIONS,
  formatCurrency,
  type CrmInquiryRecord,
} from "@/lib/constants/crm";
import { parseApiError } from "@/lib/utils/error-parser";
import { formatDateTime } from "@/lib/utils/formatters";
import {
  CrmBadge,
  CrmEmptyState,
  CrmInlineField,
  CrmInlineSelect,
  CrmInlineTextarea,
  CrmPanel,
  CrmSubmitButton,
} from "./shared";

type CrmQuotationPanelProps = {
  inquiry: CrmInquiryRecord;
  onRefresh: () => Promise<void> | void;
};

export function CrmQuotationPanel({
  inquiry,
  onRefresh,
}: CrmQuotationPanelProps) {
  const [subtotal, setSubtotal] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const totalAmount = useMemo(() => {
    const subtotalValue = Number(subtotal || 0);
    const taxValue = Number(taxAmount || 0);
    return subtotalValue + taxValue;
  }, [subtotal, taxAmount]);

  const handleSave = async () => {
    if (!subtotal.trim()) {
      toast.error("Enter a subtotal before creating the quotation.");
      return;
    }

    setSaving(true);

    try {
      await adminApi.createCrmQuotation(inquiry.id, {
        subtotal,
        tax_amount: taxAmount || "0",
        total_amount: String(totalAmount),
        status,
        notes: notes.trim() || undefined,
      });
      toast.success("Quotation created");
      setSubtotal("");
      setTaxAmount("");
      setStatus("draft");
      setNotes("");
      await onRefresh();
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CrmPanel title="Quotation Desk" eyebrow="Commercial Proposal">
      <div className="space-y-6">
        <div className="grid gap-4">
          <CrmInlineField
            label="Subtotal"
            value={subtotal}
            onChange={setSubtotal}
            type="number"
            placeholder="Service subtotal"
          />
          <CrmInlineField
            label="Tax Amount"
            value={taxAmount}
            onChange={setTaxAmount}
            type="number"
            placeholder="GST or other tax amount"
          />
          <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-500">
              Calculated Total
            </p>
            <p className="mt-1 text-xl font-black text-violet-800">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <CrmInlineSelect
            label="Quotation Status"
            value={status}
            onChange={setStatus}
            options={CRM_QUOTATION_STATUS_OPTIONS}
            placeholder="Select quotation status"
          />
          <CrmInlineTextarea
            label="Quotation Notes"
            value={notes}
            onChange={setNotes}
            placeholder="Add commercial notes, inclusions, or assumptions."
          />
        </div>

        <CrmSubmitButton
          label="Create Quotation"
          loading={saving}
          onClick={handleSave}
        />

        {inquiry.quotations.length === 0 ? (
          <CrmEmptyState
            icon="fa-file-invoice-dollar"
            title="No quotation created yet"
            description="Prepare the commercial proposal here after the team identifies the right services for the inquiry."
          />
        ) : (
          <div className="space-y-4">
            {inquiry.quotations.map((quotation) => (
              <div
                key={quotation.id}
                className="rounded-[1.6rem] border border-slate-200 bg-slate-50/70 px-5 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {quotation.quotation_number || `Quotation #${quotation.id}`}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Created {formatDateTime(quotation.created_at ?? undefined)}
                    </p>
                  </div>
                  <CrmBadge quotationStatus={quotation.status} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MetricTile label="Subtotal" value={formatCurrency(quotation.subtotal)} />
                  <MetricTile label="Tax" value={formatCurrency(quotation.tax_amount)} />
                  <MetricTile label="Total" value={formatCurrency(quotation.total_amount)} />
                </div>
                {quotation.notes ? (
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {quotation.notes}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </CrmPanel>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}
