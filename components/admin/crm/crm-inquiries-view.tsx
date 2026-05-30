"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/api/admin-api";
import {
  CRM_CUSTOMER_TYPE_OPTIONS,
  CRM_PAYMENT_STATUS_OPTIONS,
  CRM_STAGE_OPTIONS,
  getCrmCustomerTypeLabel,
  normalizeCrmInquiryRecord,
  normalizeCrmList,
  type CrmInquiryRecord,
} from "@/lib/constants/crm";
import { parseApiError } from "@/lib/utils/error-parser";
import { formatDateWithPattern } from "@/lib/utils/formatters";
import {
  CrmBadge,
  CrmEmptyState,
  CrmPanel,
  CrmStatCard,
} from "./shared";

export function CrmInquiriesView() {
  const [inquiries, setInquiries] = useState<CrmInquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [stage, setStage] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  useEffect(() => {
    void loadInquiries();
  }, []);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      const matchesSearch =
        !search ||
        inquiry.customer?.full_name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        inquiry.customer?.mobile_number?.includes(search) ||
        inquiry.inquiry_number?.toLowerCase().includes(search.toLowerCase());
      const matchesCustomerType =
        !customerType || inquiry.customer_type === customerType;
      const matchesStage = !stage || inquiry.current_stage === stage;
      const matchesPayment =
        !paymentStatus || inquiry.payment_status === paymentStatus;

      return (
        matchesSearch &&
        matchesCustomerType &&
        matchesStage &&
        matchesPayment
      );
    });
  }, [customerType, inquiries, paymentStatus, search, stage]);

  const stats = useMemo(() => {
    return {
      total: inquiries.length,
      unassigned: inquiries.filter((item) => !item.assigned_accountant).length,
      quotationReady: inquiries.filter((item) =>
        ["quotation_preparation", "quotation_sent"].includes(item.current_stage),
      ).length,
      paid: inquiries.filter((item) => item.payment_status === "paid").length,
    };
  }, [inquiries]);

  async function loadInquiries() {
    setLoading(true);

    try {
      const response = await adminApi.getCrmInquiries();
      const payload = response.data?.data ?? response.data;
      const normalized = normalizeCrmList(payload)
        .map(normalizeCrmInquiryRecord)
        .sort((left, right) => {
          const rightDate = new Date(right.created_at ?? 0).getTime();
          const leftDate = new Date(left.created_at ?? 0).getTime();

          if (rightDate !== leftDate) {
            return rightDate - leftDate;
          }

          return right.id - left.id;
        });

      setInquiries(normalized);
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="space-y-8 pb-20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-sky-700/70">
                Consultation CRM
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Inquiry pipeline for CA-led discovery
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                These inquiries are consultation-first. Customers only share
                their profile and documents here. Your team reviews the case,
                identifies the right services, sends quotations, and moves the
                work into execution later.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/inquiry"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700 transition-all hover:border-sky-200 hover:text-sky-700"
              >
                Open Public Form
              </Link>
              <button
                type="button"
                onClick={() => void loadInquiries()}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-[11px] font-black uppercase tracking-[0.16em] text-white transition-all hover:bg-sky-700"
              >
                Refresh Board
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <CrmStatCard
              label="Total Inquiries"
              value={String(stats.total)}
              helper="All consultation records in the CRM."
              icon="fa-address-card"
              tone="sky"
            />
            <CrmStatCard
              label="Unassigned"
              value={String(stats.unassigned)}
              helper="Still waiting for accountant ownership."
              icon="fa-user-clock"
              tone="slate"
            />
            <CrmStatCard
              label="Quotation Stage"
              value={String(stats.quotationReady)}
              helper="Already moved into proposal handling."
              icon="fa-file-invoice-dollar"
              tone="violet"
            />
            <CrmStatCard
              label="Payments Received"
              value={String(stats.paid)}
              helper="Client payments marked as paid."
              icon="fa-wallet"
              tone="emerald"
            />
          </div>

          <CrmPanel title="Filter Board" eyebrow="Find the right inquiry quickly">
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Search
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by customer, mobile number, or inquiry reference"
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                />
              </div>
              <FilterSelect
                label="Customer Type"
                value={customerType}
                onChange={setCustomerType}
                options={CRM_CUSTOMER_TYPE_OPTIONS}
              />
              <FilterSelect
                label="Current Stage"
                value={stage}
                onChange={setStage}
                options={CRM_STAGE_OPTIONS}
              />
              <FilterSelect
                label="Payment Status"
                value={paymentStatus}
                onChange={setPaymentStatus}
                options={CRM_PAYMENT_STATUS_OPTIONS}
              />
            </div>
          </CrmPanel>

          <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Inquiry
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Customer Type
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Stage
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Assigned Accountant
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Loading CRM inquiries
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredInquiries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16">
                        <CrmEmptyState
                          icon="fa-inbox"
                          title="No inquiries match these filters"
                          description="Try broadening the customer type, stage, or payment filters to see more CRM records."
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredInquiries.map((inquiry) => (
                      <tr
                        key={inquiry.id}
                        className="transition-all hover:bg-sky-50/40"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                              {inquiry.customer?.full_name?.charAt(0).toUpperCase() || "C"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {inquiry.customer?.full_name || "Customer"}
                              </p>
                              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700/70">
                                {inquiry.inquiry_number || `Inquiry #${inquiry.id}`}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {formatDateWithPattern(inquiry.created_at, "dd MMM yyyy")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                          {getCrmCustomerTypeLabel(inquiry.customer_type)}
                        </td>
                        <td className="px-6 py-5">
                          <CrmBadge stage={inquiry.current_stage} />
                        </td>
                        <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                          {inquiry.assigned_accountant?.name || "Unassigned"}
                        </td>
                        <td className="px-6 py-5">
                          <CrmBadge paymentStatus={inquiry.payment_status} />
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Link
                            href={`/admin/crm/inquiries/${inquiry.id}`}
                            className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-5 text-[10px] font-black uppercase tracking-[0.16em] text-white transition-all hover:bg-sky-700"
                          >
                            Open Detail
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
