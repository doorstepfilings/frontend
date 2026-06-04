"use client";

import React from "react";
import { formatFileSize, getDocumentIcon } from "@/lib/utils/document-helpers";
import { SearchSelect } from "@/components/ui/core/search-select";

type DocumentUploadProps = {
  rows: any[];
  fileErrors: Record<number, string>;
  onFileChange: (index: number, file: File | null) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onTypeChange: (index: number, value: string) => void;
  onNotesChange: (index: number, value: string) => void;
  onSubmit: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  isUploading?: boolean;
  availableTypes?: string[];
  showTypeInput?: boolean;
  maxFileSizeMB?: number;
  renderExtraFields?: (row: any, index: number) => React.ReactNode;
  showSubmitButton?: boolean;
  allowExistingDocuments?: boolean;
  existingDocuments?: any[];
  onSourceChange?: (index: number, source: "upload" | "existing") => void;
  onExistingDocumentChange?: (index: number, value: string) => void;
  isRowComplete?: (row: any) => boolean;
};

export function DocumentUpload({
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
}: DocumentUploadProps) {
  const hasErrors = Object.keys(fileErrors).length > 0;

  const rowIsComplete = (row: any) => {
    if (typeof isRowComplete === "function") {
      return isRowComplete(row);
    }
    return Boolean((row?.source === "existing" ? row?.existing_document_id : row?.file) && row?.type);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-8 py-6 bg-slate-50/50">
        <div>
          <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-slate-900">
            <i className="fas fa-cloud-upload-alt text-blue-600" />
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onAddRow}
          className="shrink-0 rounded-2xl bg-blue-50 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-blue-700 transition-all hover:bg-blue-100"
        >
          <i className="fas fa-plus mr-2" /> Add Row
        </button>
      </div>

      <div className="space-y-6 p-8">
        {rows.map((row, index) => {
          const rowSource = allowExistingDocuments ? (row.source || "upload") : "upload";
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
              className="space-y-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 p-6"
            >
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end">
                {showTypeInput && (
                  <div className="w-full xl:max-w-xs space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Document Type
                    </label>
                    {availableTypes.length > 0 ? (
                      <SearchSelect
                        options={[
                          { value: "", label: "Select Type" },
                          ...availableTypes.map((type: any) => ({
                            value: String(type.value || type),
                            label: String(type.label || type),
                          })),
                        ]}
                        value={row.type}
                        onChange={(nextValue) => onTypeChange(index, nextValue)}
                        searchable={availableTypes.length > 6}
                        treatEmptyValueAsPlaceholder
                        triggerClassName="min-h-[56px] rounded-2xl px-5 py-4"
                        valueLabelClassName="text-sm font-bold text-slate-700"
                        handleClassName="h-8 w-8 rounded-lg border-0 bg-transparent text-slate-400"
                        selectStyle={{ borderColor: "#f1f5f9", borderWidth: "2px", boxShadow: "none" }}
                      />
                    ) : (
                      <input
                        type="text"
                        value={row.type}
                        onChange={(event) => onTypeChange(index, event.target.value)}
                        placeholder="e.g. Aadhaar Card"
                        className="h-[56px] w-full rounded-2xl border-2 border-slate-100 bg-white px-5 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-500"
                      />
                    )}
                  </div>
                )}

                {allowExistingDocuments && (
                  <div className="space-y-2 flex-1">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Source
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onSourceChange?.(index, "upload")}
                        className={`rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                          rowSource === "upload"
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                            : "border-2 border-slate-100 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-900"
                        }`}
                      >
                        Upload New
                      </button>
                      <button
                        type="button"
                        onClick={() => onSourceChange?.(index, "existing")}
                        className={`rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                          rowSource === "existing"
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                            : "border-2 border-slate-100 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-900"
                        }`}
                      >
                        Use Existing
                      </button>
                    </div>
                  </div>
                )}

                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveRow(index)}
                    className="inline-flex h-[56px] w-[56px] items-center justify-center rounded-2xl border-2 border-rose-50 bg-white text-rose-500 transition-all hover:bg-rose-50 hover:border-rose-100"
                    title="Remove Row"
                  >
                    <i className="fas fa-trash-alt" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {rowSource === "existing" ? "Existing Document" : "Document File"}
                </label>

                {rowSource === "existing" ? (
                  <div className="space-y-4">
                    <SearchSelect
                      options={[
                        { value: "", label: "Select a previous document" },
                        ...existingDocuments.map((doc) => ({
                          value: String(doc.id),
                          label: String(doc.label || doc.file_name || ""),
                        })),
                      ]}
                      value={String(row.existing_document_id || "")}
                      onChange={(nextValue) => onExistingDocumentChange?.(index, nextValue)}
                      searchable={existingDocuments.length > 6}
                      treatEmptyValueAsPlaceholder
                      triggerClassName="min-h-[56px] rounded-2xl px-5 py-4"
                      valueLabelClassName="text-sm font-bold text-slate-700"
                      handleClassName="h-8 w-8 rounded-lg border-0 bg-transparent text-slate-300"
                      selectStyle={{ borderColor: "#f1f5f9", borderWidth: "2px", boxShadow: "none" }}
                    />

                    {selectedExistingDocument ? (
                      <div className="flex items-center gap-4 rounded-2xl border-2 border-blue-50 bg-white p-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconData.bg} ${iconData.color} shadow-sm`}
                        >
                          <i className={`fas ${iconData.icon} text-lg`} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">
                            {selectedExistingDocument.file_name}
                          </p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {selectedExistingDocument.serviceName || "Past Service"} •{" "}
                            {selectedExistingDocument.status || "pending"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-slate-100 bg-white px-6 py-5 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Choose a previously uploaded document to attach it here.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`relative rounded-2xl border-2 border-dashed bg-white p-5 transition-all ${
                      fileErrors[index]
                        ? "border-rose-200 bg-rose-50/20"
                        : "border-slate-200 hover:border-blue-200"
                    }`}
                  >
                    <input
                      type="file"
                      onChange={(event) => onFileChange(index, event.target.files?.[0] || null)}
                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          fileErrors[index]
                            ? "bg-rose-100 text-rose-600"
                            : `${iconData.bg} ${iconData.color}`
                        } shadow-sm`}
                      >
                        <i className={`fas ${row.file ? iconData.icon : "fa-upload"} text-lg`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-black ${
                            row.file ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {row.file ? row.file.name : "Click to choose file or drag and drop"}
                        </p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {row.file
                            ? formatFileSize(row.file.size)
                            : `PDF, JPG, PNG up to ${maxFileSizeMB}MB`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {fileErrors[index] && rowSource !== "existing" && (
                  <div className="rounded-2xl border-2 border-rose-100 bg-rose-50 px-5 py-4 text-xs font-bold text-rose-700">
                    <p>{fileErrors[index]}</p>
                    <p className="mt-1 text-[10px] text-rose-500 uppercase tracking-widest">
                      Reduce the file size below {maxFileSizeMB}MB and try again.
                    </p>
                  </div>
                )}
              </div>

              {renderExtraFields && <div>{renderExtraFields(row, index)}</div>}

              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={row.notes}
                  onChange={(event) => onNotesChange(index, event.target.value)}
                  placeholder="Add any specific details about this document..."
                  className="w-full rounded-2xl border-2 border-slate-100 bg-white px-5 py-4 text-sm font-bold text-slate-600 outline-none transition-all focus:border-blue-500"
                />
              </div>
            </div>
          );
        })}

        {showSubmitButton && (
          <div className="pt-4">
            <button
              onClick={onSubmit}
              disabled={isUploading || hasErrors || rows.some((row) => !rowIsComplete(row))}
              className={`flex w-full items-center justify-center gap-3 rounded-[2rem] py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-lg ${
                isUploading || hasErrors || rows.some((row) => !rowIsComplete(row))
                  ? "cursor-not-allowed bg-slate-100 text-slate-300 shadow-none"
                  : "bg-slate-900 text-white hover:bg-blue-700 hover:shadow-blue-900/20 active:scale-[0.98]"
              }`}
            >
              {isUploading ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle" />
                  {submitLabel}
                </>
              )}
            </button>

            {(hasErrors || rows.some((row) => !rowIsComplete(row))) && !isUploading && (
              <p className="mt-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
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
}
