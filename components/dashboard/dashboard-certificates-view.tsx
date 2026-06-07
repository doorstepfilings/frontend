"use client";
import { PageLogoLoader } from "@/components/ui/logo-loader";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { fetchMyServices } from "@/lib/features/services/services-slice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  forceDownload,
  getDocumentTimestamp,
  isClientDeliveryDocument,
  looksLikeCertificate,
  resolveStorageUrl,
} from "@/lib/utils/document-helpers";
import { formatDateWithPattern } from "@/lib/utils/formatters";
import { getStatusColorClass, getStatusLabel } from "@/lib/utils/status-helpers";

export function DashboardCertificatesView() {
  const dispatch = useAppDispatch();
  const { myServices, loading } = useAppSelector((state) => state.services);

  useEffect(() => {
    void dispatch(fetchMyServices());
  }, [dispatch]);

  const certificates = useMemo(
    () =>
      (myServices || []).reduce((acc: any[], service: any) => {
        (service.request_documents || []).forEach((doc: any) => {
          const isFinalDoc =
            (doc.is_final === 1 || doc.is_final === true) &&
            !String(doc.file_name || "").toLowerCase().includes("report") &&
            !String(doc.document_category || "").toLowerCase().includes("report");
          const isLegacyDeliverable =
            isClientDeliveryDocument(doc) && looksLikeCertificate(doc);

          if (isFinalDoc || isLegacyDeliverable) {
            acc.push({
              id: `doc-${doc.id}`,
              serviceName: service.service?.name,
              categoryName: doc.document_name || doc.document_category || "DELIVERABLE",
              url: resolveStorageUrl(doc.file_url),
              issuedDate: getDocumentTimestamp(doc) || service.updated_at,
              fileName: doc.file_name,
              status: doc.status || "Approved",
            });
          }
        });

        return acc;
      }, []),
    [myServices],
  );

  if (loading && certificates.length === 0) {
    return <PageLogoLoader label="Loading certificates..." />;
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">My Certificates</h1>
        <p className="text-xs text-gray-500">
          View and download your official certificates and registrations.
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-50">
            <i className="fas fa-award text-3xl text-gray-200" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-800">No Certificates Yet</h2>
          <p className="mx-auto mb-8 max-w-sm text-sm text-gray-400">
            Once your services are completed, you can access and download your official certificates here.
          </p>
          <Link
            href="/dashboard/services"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-800"
          >
            <i className="fas fa-tasks" /> View My Services
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => (
            <div
              key={certificate.id}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
            >
              <div className="relative flex aspect-[16/9] items-center justify-center bg-blue-900 p-6">
                <div className="absolute inset-0 bg-blue-950/20" />
                <div className="relative text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md shadow-xl">
                    <i className="fas fa-award text-3xl text-white" />
                  </div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-blue-200">
                    {certificate.categoryName}
                  </p>
                  <h4 className="text-sm font-bold leading-tight text-white">
                    {certificate.serviceName}
                  </h4>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      Issued Date
                    </p>
                    <p className="text-xs font-bold text-gray-800">
                      {formatDateWithPattern(certificate.issuedDate, "d MMM yyyy", "-")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      Status
                    </p>
                    <span className={`text-[10px] font-bold uppercase tracking-tight ${getStatusColorClass(certificate.status).replace(/bg-[^ ]+|border-[^ ]+|border/g, '')}`}>
                      {getStatusLabel(certificate.status)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    forceDownload(
                      certificate.url,
                      certificate.fileName || `${certificate.categoryName}.pdf`,
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-md transition-all hover:bg-blue-800"
                  type="button"
                >
                  <i className="fas fa-download" /> Download Certificate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
