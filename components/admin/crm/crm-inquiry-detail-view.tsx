"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/api/admin-api";
import {
  formatCurrency,
  getCrmCustomerTypeLabel,
  getCrmPaymentStatusLabel,
  getCrmProfileFieldLabel,
  getCrmQuotationStatusLabel,
  getCrmStageLabel,
  normalizeCrmInquiryRecord,
  normalizeCrmList,
  type CrmInquiryRecord,
} from "@/lib/constants/crm";
import { parseApiError } from "@/lib/utils/error-parser";
import { formatDateTime, formatDateWithPattern } from "@/lib/utils/formatters";
import { CrmDocumentsPanel } from "./crm-documents-panel";
import { CrmNotesPanel } from "./crm-notes-panel";
import { CrmPaymentPanel } from "./crm-payment-panel";
import { CrmQuotationPanel } from "./crm-quotation-panel";
import { CrmServiceRecommendationsPanel } from "./crm-service-recommendations-panel";
import { CrmStagePanel } from "./crm-stage-panel";
import {
  CrmBadge,
  CrmEmptyState,
  CrmKeyValue,
  CrmPanel,
  CrmStatCard,
} from "./shared";

type SimplePersonOption = { id?: unknown; name?: unknown };
type SimpleServiceOption = {
  id?: unknown;
  name?: unknown;
  category?: { name?: string | null } | null;
};

export function CrmInquiryDetailView() {
  const params = useParams();
  const id = Number(params?.id ?? 0);
  const [inquiry, setInquiry] = useState<CrmInquiryRecord | null>(null);
  const [accountants, setAccountants] = useState<Array<{ id: number; name: string }>>(
    [],
  );
  const [services, setServices] = useState<
    Array<{ id: number; name: string; category?: { name?: string | null } | null }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function hydrate() {
      if (!id) {
        return;
      }

      try {
        const [inquiryResponse, accountantsResponse, servicesResponse] =
          await Promise.all([
            adminApi.getCrmInquiry(id),
            adminApi.getAccountants(),
            adminApi.getServices(),
          ]);

        if (!isActive) {
          return;
        }

        const inquiryPayload =
          inquiryResponse.data?.data ?? inquiryResponse.data ?? null;
        const accountantsPayload =
          accountantsResponse.data?.data ?? accountantsResponse.data;
        const servicesPayload =
          servicesResponse.data?.data ?? servicesResponse.data;

        setInquiry(normalizeCrmInquiryRecord(inquiryPayload));
        setAccountants(
          normalizeCrmList(accountantsPayload).map((accountant) => ({
            ...({} as SimplePersonOption),
            ...((accountant ?? {}) as SimplePersonOption),
          })).map((accountant) => ({
            id: Number(accountant.id ?? 0),
            name: String(accountant.name ?? "Accountant"),
          })),
        );
        setServices(
          normalizeCrmList(servicesPayload).map((service) => ({
            ...({} as SimpleServiceOption),
            ...((service ?? {}) as SimpleServiceOption),
          })).map((service) => ({
            id: Number(service.id ?? 0),
            name: String(service.name ?? "Service"),
            category: service.category ?? null,
          })),
        );
      } catch (error) {
        if (isActive) {
          toast.error(parseApiError(error));
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void hydrate();

    return () => {
      isActive = false;
    };
  }, [id]);

  async function loadPage() {
    if (!id) {
      return;
    }

    setLoading(true);

    try {
      const [inquiryResponse, accountantsResponse, servicesResponse] =
        await Promise.all([
          adminApi.getCrmInquiry(id),
          adminApi.getAccountants(),
          adminApi.getServices(),
        ]);

      const inquiryPayload =
        inquiryResponse.data?.data ?? inquiryResponse.data ?? null;
      const accountantsPayload =
        accountantsResponse.data?.data ?? accountantsResponse.data;
      const servicesPayload = servicesResponse.data?.data ?? servicesResponse.data;

      setInquiry(normalizeCrmInquiryRecord(inquiryPayload));
      setAccountants(
        normalizeCrmList(accountantsPayload).map((accountant) => ({
          ...({} as SimplePersonOption),
          ...((accountant ?? {}) as SimplePersonOption),
        })).map((accountant) => ({
          id: Number(accountant.id ?? 0),
          name: String(accountant.name ?? "Accountant"),
        })),
      );
      setServices(
        normalizeCrmList(servicesPayload).map((service) => ({
          ...({} as SimpleServiceOption),
          ...((service ?? {}) as SimpleServiceOption),
        })).map((service) => ({
          id: Number(service.id ?? 0),
          name: String(service.name ?? "Service"),
          category: service.category ?? null,
        })),
      );
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  }

  const paymentTotal = useMemo(() => {
    if (!inquiry) {
      return 0;
    }

    return inquiry.payments.reduce((sum, payment) => {
      const amount =
        typeof payment.amount === "number"
          ? payment.amount
          : Number(payment.amount || 0);
      return sum + (Number.isNaN(amount) ? 0 : amount);
    }, 0);
  }, [inquiry]);

  if (loading) {
    return (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AdminLayout>
          <div className="flex h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                Loading CRM inquiry
              </p>
            </div>
          </div>
        </AdminLayout>
      </AuthGuard>
    );
  }

  if (!inquiry) {
    return (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AdminLayout>
          <CrmEmptyState
            icon="fa-circle-exclamation"
            title="CRM inquiry not found"
            description="This record could not be loaded. Refresh the page or return to the CRM inquiry board."
          />
        </AdminLayout>
      </AuthGuard>
    );
  }

  const profileEntries = Object.entries(inquiry.profile_data ?? {});

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="space-y-8 pb-24">
          <div className="flex flex-col gap-6 border-b border-slate-100 pb-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <Link
                href="/admin/crm/inquiries"
                className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-sky-200 hover:text-sky-700"
              >
                <i className="fas fa-chevron-left" />
              </Link>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-sky-700/70">
                  CRM Inquiry Detail
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {inquiry.inquiry_number || `Inquiry #${inquiry.id}`}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {inquiry.customer?.full_name || "Customer"} |{" "}
                  {getCrmCustomerTypeLabel(inquiry.customer_type)}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <CrmBadge stage={inquiry.current_stage} />
                  <CrmBadge paymentStatus={inquiry.payment_status} />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <CrmStatCard
                label="Documents"
                value={String(inquiry.documents.length)}
                helper="Files currently attached."
                icon="fa-folder-open"
                tone="sky"
              />
              <CrmStatCard
                label="Recommendations"
                value={String(inquiry.recommendations.length)}
                helper="Services identified so far."
                icon="fa-compass-drafting"
                tone="violet"
              />
              <CrmStatCard
                label="Collections"
                value={formatCurrency(paymentTotal)}
                helper="Total recorded payments."
                icon="fa-wallet"
                tone="emerald"
              />
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-8">
              <CrmPanel title="Customer Snapshot" eyebrow="Core Profile">
                <div className="grid gap-4 md:grid-cols-2">
                  <CrmKeyValue
                    label="Full Name"
                    value={inquiry.customer?.full_name || "-"}
                  />
                  <CrmKeyValue
                    label="Mobile Number"
                    value={inquiry.customer?.mobile_number || "-"}
                  />
                  <CrmKeyValue
                    label="Email Address"
                    value={inquiry.customer?.email || "-"}
                  />
                  <CrmKeyValue label="City" value={inquiry.customer?.city || "-"} />
                  <CrmKeyValue
                    label="State"
                    value={inquiry.customer?.state || "-"}
                  />
                  <CrmKeyValue
                    label="Customer Type"
                    value={getCrmCustomerTypeLabel(inquiry.customer_type)}
                  />
                  <CrmKeyValue
                    label="Created On"
                    value={formatDateWithPattern(inquiry.created_at, "dd MMM yyyy")}
                  />
                  <CrmKeyValue
                    label="Last Updated"
                    value={formatDateTime(inquiry.updated_at ?? undefined)}
                  />
                </div>
              </CrmPanel>

              <CrmPanel title="Profile Data" eyebrow="Collected from Public Form">
                {profileEntries.length === 0 ? (
                  <CrmEmptyState
                    icon="fa-id-card"
                    title="No profile details recorded"
                    description="The public form did not return any structured classification data for this inquiry."
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {profileEntries.map(([key, value]) => (
                      <CrmKeyValue
                        key={key}
                        label={getCrmProfileFieldLabel(inquiry.customer_type, key)}
                        value={String(value ?? "-")}
                      />
                    ))}
                  </div>
                )}
              </CrmPanel>

              <CrmServiceRecommendationsPanel
                inquiry={inquiry}
                services={services}
                onRefresh={loadPage}
              />

              <CrmNotesPanel inquiry={inquiry} onRefresh={loadPage} />

              <CrmDocumentsPanel inquiry={inquiry} onRefresh={loadPage} />
            </div>

            <div className="space-y-8">
              <CrmStagePanel
                key={`${inquiry.id}-${inquiry.current_stage}-${inquiry.assigned_accountant?.id ?? "none"}`}
                inquiry={inquiry}
                accountants={accountants}
                onRefresh={loadPage}
              />
              <CrmQuotationPanel inquiry={inquiry} onRefresh={loadPage} />
              <CrmPaymentPanel inquiry={inquiry} onRefresh={loadPage} />

              <CrmPanel title="Team Summary" eyebrow="At a Glance">
                <div className="space-y-4">
                  <SummaryRow
                    label="Assigned Accountant"
                    value={inquiry.assigned_accountant?.name || "Unassigned"}
                  />
                  <SummaryRow
                    label="Quotation Status"
                    value={getCrmQuotationStatusLabel(inquiry.quotation_status || "draft")}
                  />
                  <SummaryRow
                    label="Payment Status"
                    value={getCrmPaymentStatusLabel(inquiry.payment_status || "unpaid")}
                  />
                  <SummaryRow
                    label="Profile Verified"
                    value={inquiry.profile_verified ? "Yes" : "No"}
                  />
                  <SummaryRow
                    label="Documents Verified"
                    value={inquiry.documents_verified ? "Yes" : "No"}
                  />
                  <SummaryRow
                    label="Latest Stage"
                    value={getCrmStageLabel(inquiry.current_stage)}
                  />
                </div>
              </CrmPanel>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="text-right text-sm font-semibold capitalize text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}
