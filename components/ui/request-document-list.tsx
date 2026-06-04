"use client";

import { useState, useMemo } from "react";
import { isClientDocument } from "@/lib/utils/document-helpers";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { useDocumentGallery } from "@/lib/hooks/use-document-gallery";
import { Modal } from "@/components/ui/modal";
import { FormSelect, FormTextarea } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

type DocumentStatus = "pending" | "verified" | "approved" | "rejected";

interface RequestDocumentListProps {
  documents: any[];
  role: "admin" | "accountant" | "client";
  userId?: number | string | null;
  onDeleteDocument?: (docId: number | string) => Promise<void> | void;
  onUpdateDocumentStatus?: (doc: any, status: DocumentStatus, notes?: string) => Promise<void> | void;
  onUploadDocument?: (file: File, documentType: string, notes: string) => Promise<void> | void;
  canUpload?: boolean;
  actionLoading?: boolean;
}

export function RequestDocumentList({
  documents = [],
  role,
  userId = null,
  onDeleteDocument,
  onUpdateDocumentStatus,
  onUploadDocument,
  canUpload = true,
  actionLoading = false,
}: RequestDocumentListProps) {
  const [activeTab, setActiveTab] = useState<"client" | "internal">("client");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    documentType: "internal",
    notes: "",
  });

  const [verifyForm, setVerifyForm] = useState({
    doc: null as any,
    status: "verified" as DocumentStatus,
    notes: "",
  });

  // Tab document splits
  const { clientDocs, internalDocs } = useMemo(() => {
    const isClientDocCheck = (doc: any) => {
      // client files uploaded by users or marked for client view
      const type = String(doc.document_type ?? doc.documentType ?? "").toLowerCase();
      const category = String(
        doc.document_category ?? doc.documentCategory ?? "",
      ).toLowerCase();

      if (["internal", "internal_only", "internal_document"].includes(type)) {
        return false;
      }

      if (["internal", "internal_document"].includes(category)) {
        return false;
      }

      if (type === "client" || type === "client_document") return true;
      if (
        ["client_document", "client_visible", "certificate", "report", "other"].includes(
          category,
        )
      ) {
        return true;
      }

      return isClientDocument ? isClientDocument(doc) : (doc.uploadedBy?.role === "user" || String(doc.uploadedById) === String(userId));
    };

    const client = documents.filter(isClientDocCheck);
    const internal = documents.filter(doc => !isClientDocCheck(doc));
    
    return { clientDocs: client, internalDocs: internal };
  }, [documents, userId]);

  const activeDocs = activeTab === "client" ? clientDocs : internalDocs;

  const {
    documentGallery,
    lightboxIndex,
    setLightboxIndex,
    handleOpenDocument,
    handleOpenPreview,
  } = useDocumentGallery(activeDocs as any);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) return toast.error("Please select a file to upload");
    if (!onUploadDocument) return;

    try {
      const nextTab = uploadForm.documentType === "client" ? "client" : "internal";
      await onUploadDocument(uploadForm.file, uploadForm.documentType, uploadForm.notes);
      toast.success("Document uploaded successfully");
      setActiveTab(nextTab);
      setShowUploadModal(false);
      setUploadForm({ file: null, documentType: "internal", notes: "" });
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyForm.doc || !onUpdateDocumentStatus) return;

    try {
      await onUpdateDocumentStatus(verifyForm.doc, verifyForm.status, verifyForm.notes);
      toast.success(`Document marked as ${verifyForm.status}`);
      setShowVerifyModal(false);
      setVerifyForm({ doc: null, status: "verified", notes: "" });
    } catch (err: any) {
      toast.error(err?.message || "Status update failed");
    }
  };

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Request Documents</h3>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            Review client uploads, internal archives, and verification states.
          </p>
        </div>
        
        {canUpload && onUploadDocument && (
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="h-10 w-full rounded-2xl bg-slate-900 px-5 text-xs font-bold uppercase tracking-[0.16em] text-white transition-all shadow-sm hover:bg-blue-600 sm:w-auto"
          >
            Upload Artifact
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50 p-1.5 sm:flex-row">
        <button
          type="button"
          onClick={() => setActiveTab("client")}
          className={`flex-1 rounded-xl py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
            activeTab === "client"
              ? "bg-white text-slate-900 shadow-sm border border-slate-100"
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          Client Uploads ({clientDocs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("internal")}
          className={`flex-1 rounded-xl py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
            activeTab === "internal"
              ? "bg-white text-slate-900 shadow-sm border border-slate-100"
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          Internal Archives ({internalDocs.length})
        </button>
      </div>

      {/* Document Grid */}
      {activeDocs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
          No documents archived in this section
        </div>
      ) : (
        <div className="grid gap-4">
          {activeDocs.map((doc) => {
            const previewIndex = documentGallery.findIndex(item => item.docId === String(doc.id));
            const isDeliverable = ["certificate", "report"].includes(doc.document_category || doc.documentCategory || "");
            const isRejected = doc.status === "rejected";
            const isVerified = ["verified", "approved"].includes(doc.status || "");
            
            const label = doc.document_name || doc.documentName ||
              (doc.document_category || doc.documentCategory
                ? String(doc.document_category || doc.documentCategory).charAt(0).toUpperCase() + String(doc.document_category || doc.documentCategory).slice(1)
                : null) || doc.file_name || doc.fileName;

            return (
              <div
                key={doc.id}
                className={`rounded-2xl border p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition-all group ${
                  isDeliverable
                    ? "bg-blue-50/40 border-blue-100 hover:bg-blue-50/60"
                    : isRejected
                    ? "bg-rose-50/30 border-rose-100 hover:bg-rose-50/50"
                    : "bg-slate-50/30 border-slate-200/60 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${
                      isDeliverable
                        ? "bg-blue-600 text-white"
                        : isRejected
                        ? "bg-rose-100 text-rose-600"
                        : isVerified
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-white text-slate-400 border border-slate-200/50"
                    }`}
                  >
                    <i className={`fas ${isDeliverable ? "fa-certificate" : "fa-file-alt"} text-xs`} />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <p className={`max-w-full break-words text-xs font-black uppercase tracking-wider sm:max-w-[280px] ${isDeliverable ? "text-blue-900" : "text-slate-800"}`}>
                      {label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                          isVerified
                            ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                            : isRejected
                            ? "bg-rose-50 border-rose-100 text-rose-700"
                            : "bg-amber-50 border-amber-100 text-amber-700"
                        }`}
                      >
                        {doc.status || "pending"}
                      </span>
                      {doc.document_type || doc.documentType ? (
                        <span className="rounded-full bg-white border border-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 shadow-sm">
                          {doc.document_type || doc.documentType}
                        </span>
                      ) : null}
                    </div>
                    {doc.notes && (
                      <p className="mt-2 max-w-full rounded-xl border border-slate-100 bg-white p-3 text-xs font-semibold leading-relaxed text-slate-500 sm:max-w-xl">
                        {doc.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start md:self-center md:justify-end">
                  {previewIndex >= 0 && (
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(previewIndex)}
                      className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm"
                      title="Preview image"
                    >
                      <i className="fas fa-eye text-xs" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenDocument(doc)}
                    className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm"
                    title="Download document"
                  >
                    <i className="fas fa-download text-xs" />
                  </button>
                  
                  {/* Management Buttons for staff */}
                  {role !== "client" && onUpdateDocumentStatus && (
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyForm({
                          doc,
                          status: doc.status === "verified" ? "rejected" : "verified",
                          notes: "",
                        });
                        setShowVerifyModal(true);
                      }}
                      className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-[10px] font-bold uppercase tracking-[0.16em] hover:bg-slate-50 transition-all shadow-sm"
                    >
                      Verify
                    </button>
                  )}
                  
                  {onDeleteDocument && (
                    <button
                      type="button"
                      onClick={() => onDeleteDocument(doc.id)}
                      className="h-9 w-9 rounded-xl border border-rose-100 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center shadow-sm"
                      title="Delete document"
                    >
                      <i className="fas fa-trash-alt text-xs" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox previews */}
      <ImageLightbox
        key={lightboxIndex >= 0 ? `${lightboxIndex}-${documentGallery.length}` : "closed"}
        open={lightboxIndex >= 0}
        index={lightboxIndex >= 0 ? lightboxIndex : 0}
        slides={documentGallery.map((item) => item.slide)}
        onClose={() => setLightboxIndex(-1)}
      />

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document Artifact"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Document File</label>
            <input
              type="file"
              onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
              className="w-full text-xs font-semibold file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-wider file:bg-slate-900 file:text-white hover:file:bg-blue-600 cursor-pointer"
            />
          </div>

          <FormSelect
            label="Document Target Type"
            value={uploadForm.documentType}
            onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
            options={[
              { value: "internal", label: "Internal Only (Staff Eyes Only)" },
              { value: "client", label: "Client Document (Visible to User)" },
            ]}
          />

          <FormTextarea
            label="Upload Notes / Remarks"
            value={uploadForm.notes}
            onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
            placeholder="Add brief details about this upload..."
          />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl text-xs font-bold uppercase tracking-widest"
              onClick={() => setShowUploadModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 flex-1 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-blue-600"
              loading={actionLoading}
            >
              Upload File
            </Button>
          </div>
        </form>
      </Modal>

      {/* Verification Status Modal */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        title="Verify Document Artifact"
      >
        <form onSubmit={handleVerifySubmit} className="space-y-6">
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verifying Document</p>
            <p className="text-xs font-black uppercase text-slate-800 tracking-wide">
              {verifyForm.doc?.document_name || verifyForm.doc?.documentName || verifyForm.doc?.file_name || verifyForm.doc?.fileName}
            </p>
          </div>

          <FormSelect
            label="Verification Status Action"
            value={verifyForm.status}
            onChange={(e) => setVerifyForm({ ...verifyForm, status: e.target.value as DocumentStatus })}
            options={[
              { value: "verified", label: "Verify & Approve Artifact" },
              { value: "rejected", label: "Reject (Requires Correction Cycle)" },
            ]}
          />

          <FormTextarea
            label="Verification Reason / Rejection Remark"
            required={verifyForm.status === "rejected"}
            value={verifyForm.notes}
            onChange={(e) => setVerifyForm({ ...verifyForm, notes: e.target.value })}
            placeholder={verifyForm.status === "rejected" ? "Clearly explain the correction required..." : "Add validation notes (optional)..."}
          />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl text-xs font-bold uppercase tracking-widest"
              onClick={() => setShowVerifyModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`h-11 flex-1 rounded-xl text-white text-xs font-bold uppercase tracking-widest shadow-lg ${
                verifyForm.status === "rejected" ? "bg-rose-600 hover:bg-rose-500" : "bg-slate-900 hover:bg-blue-600"
              }`}
              loading={actionLoading}
            >
              Save Verification
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
