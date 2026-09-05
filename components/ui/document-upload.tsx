"use client";

import React from "react";
import { formatFileSize, getDocumentIcon } from "@/lib/utils/document-helpers";
import { Button } from "./button";
import { SearchableSelect } from "./searchable-select";

export interface DocumentUploadRow {
  id?: string | number;
  file: File | null;
  type: string;
  notes?: string;
  source?: "upload" | "existing";
  existing_document_id?: string | number;
  is_required?: boolean;
}

interface DocumentUploadProps {
  rows: DocumentUploadRow[];
  fileErrors: Record<string | number, string>;
  onFileChange: (index: number, file: File | null) => void;
  onFilesChange?: (index: number, files: File[]) => void;
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
  onFilesChange,
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
  const hasErrors = Object.values(fileErrors).some(Boolean);

  const rowIsComplete = (row: DocumentUploadRow) => {
    if (typeof isRowComplete === "function") {
      return isRowComplete(row);
    }
    const hasDoc = Boolean(row?.file || row?.existing_document_id);
    const hasType = Boolean(row?.type?.trim());
    if (row?.is_required) {
      return hasDoc && hasType;
    }
    if (hasDoc || hasType) {
      return hasDoc && hasType;
    }
    return true;
  };

  const hasAtLeastOneCompleteRow = rows.some((row) => {
    const hasDoc = Boolean(row?.file || row?.existing_document_id);
    const hasType = Boolean(row?.type?.trim());
    return hasDoc && hasType;
  });

  const allRowsAreValid = rows.every((row) => rowIsComplete(row));
  const isSubmitDisabled =
    isUploading || hasErrors || !allRowsAreValid || !hasAtLeastOneCompleteRow;

  return (
    <div className="animate-fadeIn overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-3.5 bg-slate-50/40">
        <div>
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
            <i className="fa-solid fa-cloud-arrow-up text-blue-600 text-xs" />
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-xs text-slate-400 font-medium">{description}</p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddRow}
          className="h-8 rounded-lg border-blue-200 bg-blue-50/60 hover:bg-blue-100 font-semibold text-xs text-blue-700 shadow-xs transition-all active:scale-95 px-3"
        >
          <i className="fas fa-plus mr-1.5 text-[10px]" /> Add Row
        </Button>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {rows.map((row, index) => {
          const rowKey = row.id != null ? String(row.id) : `row-${index}`;
          const rowError = fileErrors[rowKey] || fileErrors[index];
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
              key={rowKey}
              className="relative space-y-2.5 rounded-xl border border-slate-200/80 bg-slate-50/30 hover:bg-slate-50/60 p-3.5 transition-all duration-200"
            >
              {allowExistingDocuments && (
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Source
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSourceChange?.(index, "upload")}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                        rowSource === "upload"
                          ? "bg-blue-900 text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200"
                      }`}
                    >
                      Upload New
                    </button>
                    <button
                      type="button"
                      onClick={() => onSourceChange?.(index, "existing")}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                        rowSource === "existing"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-200"
                      }`}
                    >
                      Use Existing
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* 1. Document Type */}
                {showTypeInput && (
                  <div className="w-full space-y-1 col-span-12 md:col-span-4">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Document Type {row.is_required && <span className="text-rose-500">*</span>}
                    </label>
                    {availableTypes.length > 0 ? (
                      <SearchableSelect
                        value={row.type}
                        onChange={(event) => onTypeChange(index, event.target.value)}
                        options={availableTypes.map((type) => {
                          if (typeof type === "object" && type !== null) {
                            return {
                              value: String(type.value || type.id || ""),
                              label: String(type.label || type.value || type.id || ""),
                            };
                          }
                          return {
                            value: String(type),
                            label: String(type),
                          };
                        })}
                        placeholder="Select Type"
                        size="sm"
                        className="w-full"
                      />
                    ) : (
                      <input
                        type="text"
                        value={row.type}
                        onChange={(event) => onTypeChange(index, event.target.value)}
                        placeholder="e.g. Aadhaar Card"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-400 shadow-xs"
                      />
                    )}
                  </div>
                )}

                {/* 2. Document File */}
                <div className={`w-full space-y-1 col-span-12 ${showTypeInput ? "md:col-span-4" : "md:col-span-6"}`}>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    {rowSource === "existing" ? "Existing Document" : "Document File"}
                  </label>

                  {rowSource === "existing" ? (
                    <div>
                      <SearchableSelect
                        value={row.existing_document_id || ""}
                        onChange={(event) =>
                          onExistingDocumentChange?.(index, event.target.value)
                        }
                        options={existingDocuments.map((doc) => ({
                          value: String(doc.id),
                          label: String(doc.label || doc.file_name || ""),
                        }))}
                        placeholder="Select a previous document"
                        size="sm"
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div
                      className={`relative flex items-center h-9 px-3 rounded-lg border border-dashed transition-all ${
                        rowError
                          ? "border-rose-300 bg-rose-50/30"
                          : row.file
                            ? "border-emerald-300 bg-emerald-50/20"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/10"
                      }`}
                    >
                      <input
                        key={`file-input-${rowKey}-${row.file ? `${row.file.name}-${row.file.size}` : "empty"}`}
                        type="file"
                        onChange={(event) => {
                          const fileList = event.target.files ? Array.from(event.target.files) : [];
                          if (fileList.length > 1 && onFilesChange) {
                            onFilesChange(index, fileList);
                          } else {
                            onFileChange(index, fileList[0] || null);
                          }
                          event.target.value = "";
                        }}
                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.xlsx,.xls,.csv"
                        multiple={Boolean(onFilesChange)}
                      />
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <i
                          className={`fas ${
                            row.file ? iconData.icon : "fa-upload"
                          } text-xs shrink-0 ${
                            rowError
                              ? "text-rose-600"
                              : row.file
                                ? iconData.color || "text-emerald-600"
                                : "text-slate-400"
                          }`}
                        />
                        <span
                          className={`truncate text-xs ${
                            row.file ? "font-semibold text-slate-800" : "text-slate-400"
                          }`}
                        >
                          {row.file ? row.file.name : "Choose file (or drag & drop)"}
                        </span>
                        {row.file && (
                          <span className="shrink-0 text-[10px] text-slate-400 font-medium">
                            ({formatFileSize(row.file.size)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Notes (Optional) */}
                <div className={`w-full space-y-1 col-span-12 ${rows.length > 1 ? "md:col-span-3" : (showTypeInput ? "md:col-span-4" : "md:col-span-6")}`}>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={row.notes || ""}
                    onChange={(event) => onNotesChange(index, event.target.value)}
                    placeholder="Details about document..."
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-400 shadow-xs"
                  />
                </div>

                {/* 4. Delete Action Button */}
                {rows.length > 1 && (
                  <div className="col-span-12 md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onRemoveRow(index)}
                      className="h-9 w-9 rounded-lg border border-rose-100 bg-rose-50/60 text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition-all flex items-center justify-center shadow-xs"
                      title="Remove Row"
                    >
                      <i className="fas fa-trash-alt text-xs" />
                    </button>
                  </div>
                )}
              </div>

              {rowError && rowSource !== "existing" && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700 flex items-center gap-2">
                  <i className="fas fa-exclamation-circle text-rose-500 text-xs shrink-0" />
                  <span className="font-medium">{rowError}</span>
                </div>
              )}

              {renderExtraFields && (
                <div className="pt-1">{renderExtraFields(row, index)}</div>
              )}
            </div>
          );
        })}

        {showSubmitButton && (
          <div className="pt-2">
            <Button
              onClick={onSubmit}
              disabled={isSubmitDisabled}
              className={`h-11 w-full rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all duration-200 ${
                isSubmitDisabled
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60"
                  : "bg-blue-900 text-white shadow-blue-900/15 hover:bg-blue-800 active:scale-[0.99]"
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

            {isSubmitDisabled && !isUploading && (
              <p className="mt-2 text-center text-[11px] font-medium text-slate-400">
                {hasErrors
                  ? "Please resolve file size errors to continue"
                  : !hasAtLeastOneCompleteRow
                  ? "Complete at least one document row with a document type and file"
                  : "Complete each filled row with both a document type and file to enable upload"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
