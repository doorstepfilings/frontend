"use client";

import React, { useState } from "react";
import { DocumentUpload } from "@/components/ui/document-upload";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface AccountantUploadFormProps {
  requestId: string | number;
  onSuccess?: () => void;
  showFinalToggle?: boolean;
}

let accountantRowCounter = 0;

function buildEmptyRow() {
  accountantRowCounter += 1;
  return {
    id: `row-${accountantRowCounter}`,
    file: null as File | null,
    type: "",
    notes: "",
    document_type: "internal",
    document_category: "",
    requires_client_approval: false,
  };
}

export const AccountantUploadForm = ({
  requestId,
  onSuccess,
  showFinalToggle = false,
}: AccountantUploadFormProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [fileErrors, setFileErrors] = useState<Record<string | number, string>>({});

  const [rows, setRows] = useState<any[]>([buildEmptyRow()]);

  const handleFileChange = (index: number, file: File | null) => {
    const row = rows[index];
    const rowKey = row?.id != null ? String(row.id) : String(index);

    if (!file) {
      setFileErrors((current) => {
        const next = { ...current };
        delete next[rowKey];
        delete next[index];
        return next;
      });
      updateRow(index, "file", null);
      return;
    }

    const MAX_BYTES = 1024 * 1024; // 1MB
    if (file.size > MAX_BYTES) {
      setFileErrors((current) => ({
        ...current,
        [rowKey]: `File size exceeds 1 MB limit.`,
      }));
    } else {
      setFileErrors((current) => {
        const next = { ...current };
        delete next[rowKey];
        delete next[index];
        return next;
      });
    }

    updateRow(index, "file", file);
  };

  const handleFilesChange = (index: number, files: File[]) => {
    if (!files.length) return;
    const MAX_BYTES = 1024 * 1024;

    const firstFile = files[0];
    const currentTarget = rows[index] || buildEmptyRow();
    const currentKey = currentTarget.id != null ? String(currentTarget.id) : String(index);

    const additionalRows = files.slice(1).map((file) => ({
      ...buildEmptyRow(),
      file,
      type: currentTarget.type || file.name.replace(/\.[^/.]+$/, ""),
      document_type: currentTarget.document_type || "internal",
      document_category: currentTarget.document_category || "",
      requires_client_approval: Boolean(currentTarget.requires_client_approval),
    }));

    setRows((currentRows) => {
      const nextRows = [...currentRows];
      nextRows[index] = {
        ...currentTarget,
        file: firstFile,
        type: currentTarget.type || firstFile.name.replace(/\.[^/.]+$/, ""),
      };
      return [
        ...nextRows.slice(0, index + 1),
        ...additionalRows,
        ...nextRows.slice(index + 1),
      ];
    });

    setFileErrors((current) => {
      const next = { ...current };
      delete next[currentKey];
      delete next[index];

      if (firstFile.size > MAX_BYTES) {
        next[currentKey] = `File size exceeds 1 MB limit.`;
      }

      additionalRows.forEach((extraRow) => {
        if (extraRow.file && extraRow.file.size > MAX_BYTES) {
          const extraKey = String(extraRow.id);
          next[extraKey] = `File size exceeds 1 MB limit.`;
        }
      });

      return next;
    });
  };

  const handleRemoveRow = (index: number) => {
    const rowToRemove = rows[index];
    const rowKey = rowToRemove?.id != null ? String(rowToRemove.id) : String(index);

    setRows((currentRows) =>
      currentRows.filter((_, rowIndex) => rowIndex !== index),
    );

    setFileErrors((current) => {
      const next = { ...current };
      delete next[rowKey];
      delete next[index];
      return next;
    });
  };

  const updateRow = (index: number, field: string, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const updateRowFields = (index: number, values: Record<string, any>) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], ...values };
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
      formData.append(
        `documents[${index}][document_type]`,
        row.requires_client_approval ? "client" : row.document_type,
      );
      formData.append(
        `documents[${index}][requires_client_approval]`,
        row.requires_client_approval ? "1" : "0",
      );
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
        <div className="relative">
          <SearchableSelect
            value={row.requires_client_approval ? "approval" : row.document_type}
            onChange={(e) => {
              const value = e.target.value;
              updateRowFields(index, {
                document_type: value === "approval" ? "client" : value,
                requires_client_approval: value === "approval",
                document_category: value === "approval" ? "" : row.document_category,
              });
            }}
            options={[
              { value: "internal", label: "Internal Only" },
              { value: "client", label: "Visible to Client" },
              { value: "approval", label: "Send for Client Approval" }
            ]}
            placeholder="Select Visibility"
            size="sm"
          />
        </div>
      </div>

      {row.document_type === "client" && !row.requires_client_approval && (
        <div className="flex-1 space-y-2 animate-in fade-in slide-in-from-top-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
            Category
          </label>
          <div className="relative">
            <SearchableSelect
              value={row.document_category}
              onChange={(e) => updateRow(index, "document_category", e.target.value)}
              options={[
                { value: "certificate", label: "Certificate" },
                { value: "report", label: "Report" }
              ]}
              placeholder="Select Purpose..."
              size="sm"
            />
          </div>
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
        onFilesChange={handleFilesChange}
        onAddRow={() => setRows([...rows, buildEmptyRow()])}
        onRemoveRow={handleRemoveRow}
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
