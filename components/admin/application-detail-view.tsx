"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  fetchAdminApplicationDetail,
  updateDocumentStatus,
} from "@/lib/features/admin/admin-slice";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DetailViewSkeleton } from "@/components/ui/skeletons/detail-view-skeleton";
import { toast } from "react-hot-toast";
import { StatusManagement } from "./status-management";
import { FormDataRenderer } from "@/components/ui/form-data-renderer";
import { AccountantDocumentList } from "@/components/accountant/accountant-document-list";
import { splitDocumentsByOwner } from "@/lib/utils/document-helpers";
import { formatDateWithPattern } from "@/lib/utils/formatters";

const STATUS_CONFIG: any = {
  draft: {
    label: "Draft",
    color: "bg-slate-100 text-slate-600",
    icon: "fa-file-edit",
  },
  pending: {
    label: "Reviewing",
    color: "bg-amber-50 text-amber-700 border-amber-100",
    icon: "fa-search",
  },
  update_required: {
    label: "Action Needed",
    color: "bg-rose-50 text-rose-700 border-rose-100",
    icon: "fa-exclamation-circle",
  },
  approved: {
    label: "Completed",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: "fa-check-double",
  },
  rejected: {
    label: "Rejected",
    color: "bg-rose-50 text-rose-700 border-rose-100",
    icon: "fa-times-circle",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-slate-50 text-slate-500 border-slate-100",
    icon: "fa-ban",
  },
  in_progress: {
    label: "Processing",
    color: "bg-blue-50 text-blue-700 border-blue-100",
    icon: "fa-spinner",
  },
  paid: {
    label: "Payment Verified",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: "fa-wallet",
  },
  completed: {
    label: "Success",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: "fa-flag-checkered",
  },
  applied: {
    label: "New Arrival",
    color: "bg-indigo-50 text-indigo-700 border-indigo-100",
    icon: "fa-sparkles",
  },
  submitted_to_ca: {
    label: "Sent to CA",
    color: "bg-cyan-50 text-cyan-700 border-cyan-100",
    icon: "fa-paper-plane",
  },
  under_review: {
    label: "Verifying",
    color: "bg-purple-50 text-purple-700 border-purple-100",
    icon: "fa-user-check",
  },
  document_collection: {
    label: "Docs Needed",
    color: "bg-orange-50 text-orange-700 border-orange-100",
    icon: "fa-folder-open",
  },
};

export function ApplicationDetailView() {
  const params = useParams();
  const id = params?.id as string;

  const dispatch = useAppDispatch();
  const { selectedApplication: app, loading } = useAppSelector(
    (state) => state.admin,
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchAdminApplicationDetail(id));
    }
  }, [id, dispatch]);

  const handleUpdateDocStatus = async (
    doc: any,
    status: string,
    remark?: string,
  ) => {
    const resultAction = await dispatch(
      updateDocumentStatus({
        applicationId: id,
        docId: doc.id,
        status,
        remark,
      }),
    );
    if (updateDocumentStatus.fulfilled.match(resultAction)) {
      toast.success("Document updated");
      dispatch(fetchAdminApplicationDetail(id));
    } else {
      toast.error("Update failed");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <DetailViewSkeleton />
      </AdminLayout>
    );
  }

  const { clientDocs, internalDocs } = splitDocumentsByOwner(
    app.request_documents || [],
  );
  const statusConfig = STATUS_CONFIG[app.status] || {
    label: app.status,
    color: "bg-slate-100 text-slate-600",
    icon: "fa-info-circle",
  };

  const orderLabel =
    app.order_unique_id || app.application_unique_id || String(app.id);
  const paymentStatus = ["paid", "success"].includes(
    String(app.payment_status || "").toLowerCase(),
  )
    ? "Paid"
    : "Pending";
  const receivedAt = app.order_created_at || app.created_at || null;

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="panel-page">
          <section className="panel-hero p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
            <div className="flex items-start gap-4 sm:gap-5">
              <Link
                href="/admin/service-applications"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-blue-100 hover:text-blue-600 sm:h-12 sm:w-12"
              >
                <i className="fas fa-chevron-left text-xs"></i>
              </Link>
              <div className="min-w-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Order #{orderLabel}
                  </h1>
                  <span
                    className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusConfig.color}`}
                  >
                    <i className={`fas ${statusConfig.icon} text-[9px]`}></i>
                    {statusConfig.label}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {app.service?.name}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 sm:w-auto"
              >
                <i className="fas fa-file-pdf text-xs text-rose-500"></i> Save PDF
              </button>
              <button
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-xs font-bold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-blue-600 sm:w-auto"
              >
                <i className="fas fa-print text-xs"></i> Print
              </button>
            </div>
          </div>
          </section>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <InfoSection title="Client Profile" icon="fa-user-circle">
                  <div className="space-y-4">
                    <DetailRow label="Name" value={app.user?.name} />
                    <DetailRow label="Email Address" value={app.user?.email} />
                    <DetailRow
                      label="Contact Number"
                      value={app.user?.mobile_number}
                    />
                  </div>
                </InfoSection>

                <InfoSection title="Financial Snapshot" icon="fa-credit-card">
                  <div className="space-y-4">
                    <DetailRow
                      label="Service Fee"
                      value={`Rs ${Math.round(app.amount).toLocaleString("en-IN")}`}
                    />
                    <DetailRow label="Payment Status" value={paymentStatus} />
                    <DetailRow
                      label="Date Received"
                      value={
                        receivedAt
                          ? formatDateWithPattern(receivedAt, "dd MMM yyyy")
                          : "-"
                      }
                    />
                    <DetailRow
                      label="Invoice ID"
                      value={app.invoice_unique_id || "-"}
                    />
                  </div>
                </InfoSection>
              </div>

              <div className="panel-card overflow-hidden">
                <FormDataRenderer
                  formData={app.form_data}
                  title="Application Data"
                  icon="fa-database"
                />
              </div>

              <div className="space-y-6">
                <AccountantDocumentList
                  title="Client Submission Documents"
                  documents={clientDocs}
                  onDelete={() => {}}
                  onUpdateStatus={handleUpdateDocStatus}
                  canUpload={false}
                />
                <AccountantDocumentList
                  title="Internal Verification Documents"
                  documents={internalDocs}
                  onDelete={() => {}}
                  onUpdateStatus={handleUpdateDocStatus}
                  canUpload={false}
                />
              </div>

              {/* <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <ChatBox
                  title="Conversation Monitor"
                  userServiceId={Number(app?.id)}
                  counterpart={app?.user ? {
                    id: Number(app.user.id),
                    name: app.user.name,
                    email: app.user.email,
                    role: app.user.role,
                  } : null}
                />
              </div> */}
              <InfoSection title="Communication Log" icon="fa-history">
                <div className="space-y-4">
                  {!app.notes &&
                    !app.client_message &&
                    !app.ca_notes &&
                    !app.rejection_reason && (
                    <p className="text-sm italic text-slate-400">
                      No notes or remarks found for this order.
                    </p>
                  )}
                  {app.notes && (
                    <NoteBox
                      label="Client Instruction"
                      text={app.notes}
                      color="slate"
                    />
                  )}
                  {app.client_message && (
                    <NoteBox
                      label="Client Message"
                      text={app.client_message}
                      color="emerald"
                    />
                  )}
                  {app.ca_notes && (
                    <NoteBox
                      label="Internal Note"
                      text={app.ca_notes}
                      color="blue"
                    />
                  )}
                  {app.rejection_reason && (
                    <NoteBox
                      label="Reason for Rejection"
                      text={app.rejection_reason}
                      color="rose"
                    />
                  )}
                </div>
              </InfoSection>
            </div>

            <div className="space-y-6">
              <div className="panel-card p-6">
                <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Process Management
                </h3>
                <StatusManagement application={app} />
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

function InfoSection({ title, icon, children }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
          <i className={`fas ${icon} text-xs`}></i>
        </div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="mb-0.5 text-[10px] font-bold uppercase tracking-tight text-slate-400">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-900">
        {value || "-"}
      </span>
    </div>
  );
}

function NoteBox({
  label,
  text,
  color,
}: {
  label: string;
  text: string;
  color: string;
}) {
  const themes: any = {
    slate: "bg-slate-50 border-slate-100 text-slate-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    rose: "bg-rose-50 border-rose-100 text-rose-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${themes[color] || themes.slate}`}>
      <p className="mb-1 text-[9px] font-black uppercase tracking-widest opacity-60">
        {label}
      </p>
      <p className="text-sm font-medium leading-relaxed">{text}</p>
    </div>
  );
}

