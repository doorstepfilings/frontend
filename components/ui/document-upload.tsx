"use client";

import React from "react";
import { formatFileSize, getDocumentIcon } from "@/lib/utils/document-helpers";
import { Button } from "./button";

export interface DocumentUploadRow {
  file: File | null;
  type: string;
  notes?: string;
  source?: "upload" | "existing";
  existing_document_id?: string | number;
}

interface DocumentUploadProps {
  rows: DocumentUploadRow[];
  fileErrors: Record<number, string>;
  onFileChange: (index: number, file: File | null) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onTypeChange: (index: number, type: string) => void;
  onNotesChange: (index: number, notes: string) => void;
  onSubmit: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  isUploading?: boolean;
  availableTypes?: any[];
  showTypeInput?: boolean;
  maxFileSizeMB?: number;
  renderExtraFields?: (row: any, index: number) => React.ReactNode;
  showSubmitButton?: boolean;
  allowExistingDocuments?: boolean;
  existingDocuments?: any[];
  onSourceChange?: (index: number, source: "upload" | "existing") => void;
  onExistingDocumentChange?: (index: number, docId: string | number) => void;
  isRowComplete?: (row: any) => boolean;
}

export const DocumentUpload = ({
  rows,
  fileErrors,
  onFileChange,
  onAddRow,
  onRemoveRow,
  onTypeChange,
  onNotesChange,
  onSubmit,
  title = "Upload Documents",
  description = "",
  submitLabel = "Upload Documents",
  isUploading = false,
  availableTypes = [],
  showTypeInput = true,
  maxFileSizeMB = 1,
  renderExtraFields,
  showSubmitButton = true,
  allowExistingDocuments = false,
  existingDocuments = [],
  onSourceChange,
  onExistingDocumentChange,
  isRowComplete,
}: DocumentUploadProps) => {
  const hasErrors = Object.keys(fileErrors).length > 0;

  const rowIsComplete = (row: any) => {
    if (typeof isRowComplete === "function") {
      return isRowComplete(row);
    }
    return Boolean((row?.file || row?.existing_document_id) && row?.type);
  };

  return (
    <div className="animate-fadeIn overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
        <div>
          <h3 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-gray-900">
            <i className="fas fa-cloud-upload-alt text-blue-500" />
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddRow}
          className="rounded-xl border-blue-200 bg-blue-50 font-bold text-blue-700 hover:bg-blue-100"
        >
          <i className="fas fa-plus mr-2" /> Add Row
        </Button>
      </div>

      <div className="space-y-4 p-6">
        {rows.map((row, index) => {
          const rowSource = allowExistingDocuments ? row.source || "upload" : "upload";
          const selectedExistingDocument = existingDocuments.find(
            (doc) => String(doc.id) === String(row.existing_document_id)
          );
          const iconData =
            rowSource === "existing"
              ? getDocumentIcon(
                  selectedExistingDocument?.mime_type || "",
                  selectedExistingDocument?.file_name || ""
                )
              : getDocumentIcon(row.file?.type || "", row.file?.name || "");

          return (
            <div
              key={index}
              className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                {showTypeInput && (
                  <div className="w-full space-y-2 xl:max-w-xs">
                    <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Document Type
                    </label>
                    {availableTypes.length > 0 ? (
                      <div className="relative">
                        <select
                          value={row.type}
                          onChange={(event) => onTypeChange(index, event.target.value)}
                          className="h-[50px] w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">Select Type</option>
                          {availableTypes.map((type) => (
                            <option key={type.id || type} value={type.value || type}>
                              {type.label || type}
                            </option>
                          ))}
                        </select>
                        <i className="fas fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={row.type}
                        onChange={(event) => onTypeChange(index, event.target.value)}
                        placeholder="e.g. Aadhaar Card"
                        className="h-[50px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    )}
                  </div>
                )}

                {allowExistingDocuments && (
                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Source
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onSourceChange?.(index, "upload")}
                        className={`rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                          rowSource === "upload"
                            ? "bg-blue-900 text-white shadow-lg shadow-blue-900/20"
                            : "border border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-900"
                        }`}
                      >
                        Upload New
                      </button>
                      <button
                        type="button"
                        onClick={() => onSourceChange?.(index, "existing")}
                        className={`rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                          rowSource === "existing"
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                            : "border border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:text-emerald-700"
                        }`}
                      >
                        Use Existing
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex-1" />

                {rows.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onRemoveRow(index)}
                    className="h-[50px] w-[50px] rounded-xl border border-red-50 text-red-500 hover:bg-red-50 hover:text-red-600"
                    title="Remove Row"
                  >
                    <i className="fas fa-trash-alt" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {rowSource === "existing"
                    ? "Existing Document"
                    : "Document File"}
                </label>

                {rowSource === "existing" ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <select
                        value={row.existing_document_id || ""}
                        onChange={(event) =>
                          onExistingDocumentChange?.(index, event.target.value)
                        }
                        className="h-[50px] w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="">Select a previous document</option>
                        {existingDocuments.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.label || doc.file_name}
                          </option>
                        ))}
                      </select>
                      <i className="fas fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-300" />
                    </div>

                    {selectedExistingDocument ? (
                      <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconData.bg} ${iconData.color}`}
                        >
                          <i className={`fas ${iconData.icon}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {selectedExistingDocument.file_name}
                          </p>
                          <p className="mt-1 text-[11px] font-medium text-gray-500">
                            {selectedExistingDocument.serviceName ||
                              "Past Service"}{" "}
                            • {selectedExistingDocument.status || "pending"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-4 text-xs text-gray-400">
                        Choose a previously uploaded document to attach it here.
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`relative rounded-xl border border-dashed bg-white p-4 transition-all ${
                      fileErrors[index]
                        ? "border-red-200 bg-red-50/30"
                        : "border-gray-200 hover:border-blue-200"
                    }`}
                  >
                    <input
                      type="file"
                      onChange={(event) =>
                        onFileChange(index, event.target.files?.[0] || null)
                      }
                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          fileErrors[index]
                            ? "bg-red-100 text-red-600"
                            : `${iconData.bg} ${iconData.color}`
                        }`}
                      >
                        <i
                          className={`fas ${
                            row.file ? iconData.icon : "fa-upload"
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-semibold ${
                            row.file ? "text-gray-900" : "text-gray-500"
                          }`}
                        >
                          {row.file ? row.file.name : "Choose file"}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {row.file
                            ? formatFileSize(row.file.size)
                            : `PDF, JPG, PNG up to ${maxFileSizeMB}MB`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {fileErrors[index] && rowSource !== "existing" && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
                    <p className="font-semibold">{fileErrors[index]}</p>
                    <p className="mt-1 text-[11px] text-red-600">
                      Reduce the file size below {maxFileSizeMB}MB and try again.
                    </p>
                  </div>
                )}
              </div>

              {renderExtraFields && (
                <div>{renderExtraFields(row, index)}</div>
              )}

              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={row.notes}
                  onChange={(event) => onNotesChange(index, event.target.value)}
                  placeholder="Add any specific details about this document..."
                  className="h-[50px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-600 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          );
        })}

        {showSubmitButton && (
          <div className="pt-4">
            <Button
              onClick={onSubmit}
              disabled={
                isUploading ||
                hasErrors ||
                rows.some((row) => !rowIsComplete(row))
              }
              className={`h-[60px] w-full rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl transition-all ${
                isUploading ||
                hasErrors ||
                rows.some((row) => !rowIsComplete(row))
                  ? "bg-gray-100 text-gray-400"
                  : "bg-blue-900 text-white shadow-blue-900/20 hover:bg-blue-800 hover:shadow-2xl active:scale-[0.98]"
              }`}
            >
              {isUploading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle mr-2" />
                  {submitLabel}
                </>
              )}
            </Button>

            {(hasErrors || rows.some((row) => !rowIsComplete(row))) &&
              !isUploading && (
                <p className="mt-4 text-center text-[11px] font-medium text-gray-500">
                  {hasErrors
                    ? "Please resolve file size errors to continue"
                    : "Complete each row with a document type and file to enable upload"}
                </p>
              )}
          </div>
        )}
      </div>
    </div>
  );
};
