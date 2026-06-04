"use client";

import React, { useState } from "react";
import { DocumentUpload } from "@/components/ui/document-upload";
import { SearchSelect } from "@/components/ui/core/search-select";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";

interface AccountantUploadFormProps {
  requestId: string | number;
  onSuccess?: () => void;
  showFinalToggle?: boolean;
}

export const AccountantUploadForm = ({
  requestId,
  onSuccess,
  showFinalToggle = false,
}: AccountantUploadFormProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [fileErrors, setFileErrors] = useState<Record<number, string>>({});

  const buildEmptyRow = () => ({
    file: null as File | null,
    type: "",
    notes: "",
    document_type: "internal",
    document_category: "",
  });

  const [rows, setRows] = useState<any[]>([buildEmptyRow()]);

  const handleFileChange = (index: number, file: File | null) => {
    if (!file) {
      const newErrors = { ...fileErrors };
      delete newErrors[index];
      setFileErrors(newErrors);
      updateRow(index, "file", null);
      return;
    }

    const MAX_BYTES = 1024 * 1024; // 1MB
    if (file.size > MAX_BYTES) {
      setFileErrors({
        ...fileErrors,
        [index]: `File size exceeds 1 MB limit.`,
      });
    } else {
      const newErrors = { ...fileErrors };
      delete newErrors[index];
      setFileErrors(newErrors);
    }

    updateRow(index, "file", file);
  };

  const updateRow = (index: number, field: string, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const handleUpload = async () => {
    const validRows = rows.filter((r) => r.file && r.type);
    if (validRows.length === 0) {
      return toast.error("Please add at least one document row");
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("is_final", isFinal ? "1" : "0");

    validRows.forEach((row, index) => {
      formData.append(`documents[${index}][file]`, row.file);
      formData.append(`documents[${index}][type]`, row.type);
      formData.append(`documents[${index}][notes]`, row.notes || "");
      formData.append(`documents[${index}][document_type]`, row.document_type);
      if (row.document_category) {
        formData.append(`documents[${index}][document_category]`, row.document_category);
      }
    });

    try {
      await apiClient.post(`/accountant/service-requests/${requestId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Documents uploaded successfully");
      setRows([buildEmptyRow()]);
      setFileErrors({});
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const renderExtraFields = (row: any, index: number) => (
    <div className="flex flex-col sm:flex-row gap-4 mt-2">
      <div className="flex-1 space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
          Visibility
        </label>
        <SearchSelect
          options={[
            { value: "internal", label: "Internal Only" },
            { value: "client", label: "Visible to Client" },
          ]}
          value={row.document_type}
          onChange={(nextValue) => updateRow(index, "document_type", nextValue)}
          triggerClassName="min-h-[2.75rem] rounded-xl px-4 py-3"
          valueLabelClassName="text-xs font-semibold text-slate-700"
          handleClassName="h-7 w-7 rounded-md border-0 bg-transparent text-slate-300"
          selectStyle={{ borderColor: "#e2e8f0", boxShadow: "none" }}
        />
      </div>

      {row.document_type === "client" && (
        <div className="flex-1 space-y-2 animate-in fade-in slide-in-from-top-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
            Category
          </label>
          <SearchSelect
            options={[
              { value: "", label: "Select Purpose..." },
              { value: "certificate", label: "Final Certificate" },
              { value: "report", label: "Operational Report" },
              { value: "other", label: "Other Asset" },
            ]}
            value={row.document_category}
            onChange={(nextValue) => updateRow(index, "document_category", nextValue)}
            treatEmptyValueAsPlaceholder
            triggerClassName="min-h-[2.75rem] rounded-xl px-4 py-3"
            valueLabelClassName="text-xs font-semibold text-slate-700"
            handleClassName="h-7 w-7 rounded-md border-0 bg-transparent text-slate-300"
            selectStyle={{ borderColor: "#e2e8f0", boxShadow: "none" }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <DocumentUpload
        rows={rows}
        fileErrors={fileErrors}
        onFileChange={handleFileChange}
        onAddRow={() => setRows([...rows, buildEmptyRow()])}
        onRemoveRow={(index) => setRows(rows.filter((_, i) => i !== index))}
        onTypeChange={(index, value) => updateRow(index, "type", value)}
        onNotesChange={(index, value) => updateRow(index, "notes", value)}
        onSubmit={handleUpload}
        isUploading={isUploading}
        renderExtraFields={renderExtraFields}
        title="Document Management"
        submitLabel="Upload Documents"
      />

      {showFinalToggle && (
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shadow-sm">
              <i className="fas fa-flag-checkered text-lg" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 tracking-tight">Final Service Delivery</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Client will be notified of completion</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFinal(!isFinal)}
            className={`w-14 h-8 rounded-full p-1 transition-all duration-300 relative ${isFinal ? "bg-blue-600" : "bg-slate-200"}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${isFinal ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>
      )}
    </div>
  );
};
