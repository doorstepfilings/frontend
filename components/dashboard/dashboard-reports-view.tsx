"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { fetchMyServices } from "@/lib/features/services/services-slice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  forceDownload,
  getDocumentTimestamp,
  isClientDocument,
  looksLikeReport,
  resolveStorageUrl,
} from "@/lib/utils/document-helpers";
import { formatDateWithPattern } from "@/lib/utils/formatters";
import { getStatusColorClass, getStatusLabel } from "@/lib/utils/status-helpers";
import { PanelLogoLoader } from "@/components/ui/logo-loader";

export function DashboardReportsView() {
  const dispatch = useAppDispatch();
  const { myServices, loading } = useAppSelector((state) => state.services);

  useEffect(() => {
    void dispatch(fetchMyServices());
  }, [dispatch]);

  const reports = useMemo(
    () =>
      (myServices || []).reduce((acc: any[], service: any) => {
        (service.request_documents || []).forEach((doc: any) => {
          if (isClientDocument(doc) && looksLikeReport(doc)) {
            acc.push({
              id: `doc-${doc.id}`,
              serviceName: service.service?.name,
              categoryName: doc.document_category || doc.document_name || "REPORT",
              url: resolveStorageUrl(doc.file_url),
              issuedDate: getDocumentTimestamp(doc) || service.updated_at,
              fileName: doc.file_name,
              status: doc.status,
            });
          }
        });

        return acc;
      }, []),
    [myServices],
  );

  if (loading && reports.length === 0) {
    return (
      <PanelLogoLoader
        className="min-h-[24rem] px-0 py-0"
        label="Loading reports..."
        size={60}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="truncate text-2xl font-bold text-gray-900">My Reports</h1>
        <p className="text-xs text-gray-500">
          View and download your service reports and compliance documents.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-50">
            <i className="fas fa-file-alt text-3xl text-gray-200" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-800">No Reports Yet</h2>
          <p className="mx-auto mb-8 max-w-sm text-sm text-gray-400">
            Once your applications are processed, your reports and documents will appear here.
          </p>
          <Link
            href="/dashboard/services"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-800"
          >
            <i className="fas fa-tasks" /> Check Application Status
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
                  <i className="fas fa-file-invoice text-lg" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {report.categoryName}
                  </p>
                  <h3 className="truncate text-sm font-bold text-gray-800">
                    {report.serviceName}
                  </h3>
                </div>
              </div>

              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-tight text-gray-400">
                    Date
                  </span>
                  <span className="text-xs font-bold text-gray-700">
                    {formatDateWithPattern(report.issuedDate, "d MMM yyyy", "-")}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-tight text-gray-400">
                    Status
                  </span>
                  <span className={`rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${getStatusColorClass(report.status || "Ready")}`}>
                    {getStatusLabel(report.status || "Ready")}
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  forceDownload(
                    report.url,
                    report.fileName || `${report.categoryName}.pdf`,
                  )
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-md transition-all hover:bg-blue-800"
                type="button"
              >
                <i className="fas fa-download" /> Download Report
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
