"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { adminApi } from "@/lib/api/admin-api";
import {
  CRM_PAYMENT_STATUS_OPTIONS,
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
  CrmPanel,
  CrmSubmitButton,
} from "./shared";

type CrmPaymentPanelProps = {
  inquiry: CrmInquiryRecord;
  onRefresh: () => Promise<void> | void;
};

export function CrmPaymentPanel({
  inquiry,
  onRefresh,
}: CrmPaymentPanelProps) {
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [receivedAt, setReceivedAt] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!amount.trim()) {
      toast.error("Enter the payment amount first.");
      return;
    }

    setSaving(true);

    try {
      await adminApi.createCrmPayment(inquiry.id, {
        amount,
        payment_status: paymentStatus,
        payment_method: paymentMethod.trim() || undefined,
        reference_number: referenceNumber.trim() || undefined,
        received_at: receivedAt || undefined,
      });
      toast.success("Payment entry saved");
      setAmount("");
      setPaymentMethod("");
      setReferenceNumber("");
      setReceivedAt("");
      setPaymentStatus("paid");
      await onRefresh();
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CrmPanel title="Payment Tracking" eyebrow="Collections">
      <div className="space-y-6">
        <div className="grid gap-4">
          <CrmInlineField
            label="Amount"
            value={amount}
            onChange={setAmount}
            type="number"
            placeholder="Payment amount"
          />
          <CrmInlineSelect
            label="Payment Status"
            value={paymentStatus}
            onChange={setPaymentStatus}
            options={CRM_PAYMENT_STATUS_OPTIONS}
            placeholder="Select payment status"
          />
          <CrmInlineField
            label="Payment Method"
            value={paymentMethod}
            onChange={setPaymentMethod}
            placeholder="UPI, bank transfer, cash, etc."
          />
          <CrmInlineField
            label="Reference Number"
            value={referenceNumber}
            onChange={setReferenceNumber}
            placeholder="Transaction reference"
          />
          <CrmInlineField
            label="Received At"
            value={receivedAt}
            onChange={setReceivedAt}
            type="date"
          />
        </div>

        <CrmSubmitButton
          label="Record Payment"
          loading={saving}
          onClick={handleSave}
        />

        {inquiry.payments.length === 0 ? (
          <CrmEmptyState
            icon="fa-wallet"
            title="No payment records yet"
            description="Once the client confirms and pays, record the collection here before work begins."
          />
        ) : (
          <div className="space-y-4">
            {inquiry.payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-[1.6rem] border border-slate-200 bg-slate-50/70 px-5 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {payment.payment_method || "Payment method not added"}
                    </p>
                  </div>
                  <CrmBadge paymentStatus={payment.payment_status} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MetricTile
                    label="Reference Number"
                    value={payment.reference_number || "-"}
                  />
                  <MetricTile
                    label="Received At"
                    value={
                      payment.received_at ||
                      formatDateTime(payment.created_at ?? undefined)
                    }
                  />
                </div>
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
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
