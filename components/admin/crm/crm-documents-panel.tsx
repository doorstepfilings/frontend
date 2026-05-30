"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { DocumentUpload } from "@/components/ui/document-upload";
import { adminApi } from "@/lib/api/admin-api";
import {
  CRM_DOCUMENT_TYPE_OPTIONS,
  getCrmDocumentTypeLabel,
  type CrmInquiryRecord,
} from "@/lib/constants/crm";
import { parseApiError } from "@/lib/utils/error-parser";
import { formatDateTime } from "@/lib/utils/formatters";
import { CrmEmptyState, CrmPanel } from "./shared";

type UploadRow = {
  file: File | null;
  type: string;
  notes: string;
};

type CrmDocumentsPanelProps = {
  inquiry: CrmInquiryRecord;
  onRefresh: () => Promise<void> | void;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function CrmDocumentsPanel({
  inquiry,
  onRefresh,
}: CrmDocumentsPanelProps) {
  const [rows, setRows] = useState<UploadRow[]>([
    { file: null, type: "", notes: "" },
  ]);
  const [fileErrors, setFileErrors] = useState<Record<number, string>>({});
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (index: number, file: File | null) => {
    setRows((current) => {
      const next = [...current];
      next[index] = { ...next[index], file };
      return next;
    });

    setFileErrors((current) => {
      const next = { ...current };
      if (!file) {
        delete next[index];
        return next;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        next[index] = "Each document must be 5 MB or smaller.";
        return next;
      }

      delete next[index];
      return next;
    });
  };

  const handleUpload = async () => {
    const nextErrors: Record<number, string> = {};

    rows.forEach((row, index) => {
      if (!row.file && !row.type && !row.notes.trim()) {
        return;
      }

      if (!row.file) {
        nextErrors[index] = "Attach the file you want to upload.";
        return;
      }

      if (!row.type) {
        nextErrors[index] = "Choose a document type for this upload.";
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setFileErrors(nextErrors);
      toast.error("Fix the document rows before uploading.");
      return;
    }

    const activeRows = rows.filter((row) => row.file && row.type);
    if (activeRows.length === 0) {
      toast.error("Add at least one document to upload.");
      return;
    }

    setUploading(true);

    try {
      const payload = new FormData();
      activeRows.forEach((row, index) => {
        if (!row.file) {
          return;
        }

        payload.append(`documents[${index}][file]`, row.file);
        payload.append(`documents[${index}][type]`, row.type);
        payload.append(`documents[${index}][document_type]`, row.type);
        if (row.notes.trim()) {
          payload.append(`documents[${index}][notes]`, row.notes.trim());
        }
      });

      await adminApi.uploadCrmInquiryDocuments(inquiry.id, payload);
      toast.success("Documents uploaded");
      setRows([{ file: null, type: "", notes: "" }]);
      setFileErrors({});
      await onRefresh();
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <CrmPanel title="Documents" eyebrow="Received & Additional Uploads">
      <div className="space-y-6">
        {inquiry.documents.length === 0 ? (
          <CrmEmptyState
            icon="fa-folder-open"
            title="No documents uploaded yet"
            description="Use the uploader below to add client or internal supporting documents to the inquiry."
          />
        ) : (
          <div className="grid gap-4">
            {inquiry.documents.map((document) => (
              <div
                key={document.id}
                className="rounded-[1.6rem] border border-slate-200 bg-slate-50/70 px-5 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {getCrmDocumentTypeLabel(document.document_type)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {document.file_name}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Uploaded by {document.uploaded_by?.name || "System"} on{" "}
                      {formatDateTime(document.created_at ?? undefined)}
                    </p>
                  </div>
                  {document.file_url || document.file_path ? (
                    <a
                      href={document.file_url || document.file_path || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 transition-all hover:border-sky-200 hover:text-sky-700"
                    >
                      View File
                    </a>
                  ) : null}
                </div>
                {document.notes ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {document.notes}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <DocumentUpload
          rows={rows}
          fileErrors={fileErrors}
          onFileChange={handleFileChange}
          onAddRow={() =>
            setRows((current) => [...current, { file: null, type: "", notes: "" }])
          }
          onRemoveRow={(index) => {
            setRows((current) => {
              const nextRows = current.filter((_, rowIndex) => rowIndex !== index);
              return nextRows.length > 0
                ? nextRows
                : [{ file: null, type: "", notes: "" }];
            });
            setFileErrors((current) => {
              const nextErrors: Record<number, string> = {};

              Object.entries(current).forEach(([key, value]) => {
                const rowIndex = Number(key);
                if (rowIndex < index) {
                  nextErrors[rowIndex] = value;
                } else if (rowIndex > index) {
                  nextErrors[rowIndex - 1] = value;
                }
              });

              return nextErrors;
            });
          }}
          onTypeChange={(index, value) =>
            setRows((current) => {
              const next = [...current];
              next[index] = { ...next[index], type: value };
              return next;
            })
          }
          onNotesChange={(index, value) =>
            setRows((current) => {
              const next = [...current];
              next[index] = { ...next[index], notes: value };
              return next;
            })
          }
          onSubmit={handleUpload}
          title="Upload Additional Documents"
          description="Attach any extra files collected by the sales, CA, or accountant team."
          submitLabel="Upload Documents"
          isUploading={uploading}
          availableTypes={CRM_DOCUMENT_TYPE_OPTIONS}
          maxFileSizeMB={5}
        />
      </div>
    </CrmPanel>
  );
}
