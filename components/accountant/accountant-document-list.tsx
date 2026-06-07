"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import {
  formatFileSize,
  getDocumentIcon,
  getDocumentSourceUrl,
  openDocumentInNewTab,
  isImageDocument,
  resolveStorageUrl,
} from "@/lib/utils/document-helpers";
import { format } from "date-fns";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useStoredUser } from "@/lib/auth/hooks";
import { ImageLightbox, type ImageLightboxSlide } from "@/components/ui/image-lightbox";
import { ChatNoteModal } from "@/components/ui/chat-note-modal";

const DOC_STATUS: any = {
  pending: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: "fa-clock", label: "Pending" },
  approved: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: "fa-check", label: "Verified" },
  verified: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: "fa-check", label: "Verified" },
  rejected: { cls: "bg-rose-50 text-rose-700 border-rose-100", icon: "fa-times-circle", label: "Correction" },
};

interface AccountantDocumentListProps {
  title?: string;
  documents: any[];
  canUpload?: boolean;
  onDelete: (id: string | number) => void;
  onUpdateStatus?: (doc: any, status: string, remark?: string) => Promise<void>;
}

export const AccountantDocumentList = ({
  title = "Documents",
  documents,
  canUpload = true,
  onDelete,
  onUpdateStatus,
}: AccountantDocumentListProps) => {
  const currentUser = useStoredUser();
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [remarkingId, setRemarkingId] = useState<string | number | null>(null);
  const [remark, setRemark] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [viewingNoteDoc, setViewingNoteDoc] = useState<any | null>(null);

  const imageGallery = React.useMemo(() => {
    return documents.reduce<Array<{ docId: string | number; slide: ImageLightboxSlide }>>((gallery, doc) => {
      const src = resolveStorageUrl(doc.file_url ?? doc.url ?? doc.path ?? null);
      if (!src || !isImageDocument(doc)) {
        return gallery;
      }
      gallery.push({
        docId: doc.id,
        slide: {
          alt: doc.file_name ?? doc.document_name ?? "Document",
          src,
          download: doc.file_name ? { filename: doc.file_name, url: src } : src,
        },
      });
      return gallery;
    }, []);
  }, [documents]);

  const handleStatusChange = async (doc: any, newStatus: string) => {
    if (!onUpdateStatus) return;

    if (newStatus === "rejected") {
      setRemarkingId(doc.id);
      setRemark(doc.notes || "");
      return;
    }

    setUpdatingId(doc.id);
    try {
      await onUpdateStatus(doc, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const submitRemark = async (doc: any) => {
    if (!onUpdateStatus) return;
    setUpdatingId(doc.id);
    try {
      await onUpdateStatus(doc, "rejected", remark);
      setRemarkingId(null);
      setRemark("");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenDocument = (doc: any) => {
    if (isImageDocument(doc)) {
      const previewIndex = imageGallery.findIndex((item) => String(item.docId) === String(doc.id));
      if (previewIndex >= 0) {
        setLightboxIndex(previewIndex);
        return;
      }
    }

    try {
      openDocumentInNewTab(
        getDocumentSourceUrl(doc),
        doc.file_name ?? doc.document_name ?? "document",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to open this document.";
      toast.error(message);
    }
  };

  return (
    <div className="animate-fadeIn overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 tracking-tight">
          <i className="fas fa-folder-open text-blue-600" />
          {title}
        </h3>
        <span className="rounded-lg bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {documents.length} Documents
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {documents.length > 0 ? (
          documents.map((doc) => {
            const ds = DOC_STATUS[doc.status] || DOC_STATUS.pending;
            const iconConfig = getDocumentIcon(doc.mime_type, doc.file_name);
            const isRemarking = remarkingId === doc.id;

            return (
              <div key={doc.id} className="p-6 transition-colors hover:bg-slate-50/50">
                <div className="flex flex-col gap-6 md:flex-row md:items-center justify-between">
                  <div className="flex flex-1 items-center gap-4 min-w-0">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 ${iconConfig.bg} shadow-sm`}>
                      <i className={`fas ${iconConfig.icon} ${iconConfig.color} text-lg`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="truncate text-sm font-bold text-slate-900">
                          {doc.document_name || 
                           (doc.document_category ? (doc.document_category.charAt(0).toUpperCase() + doc.document_category.slice(1)) : null) || 
                           doc.document_type || 
                           "Unnamed Document"}
                        </h4>
                        {doc.uploaded_by?.name && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                            By {doc.uploaded_by.name}
                          </span>
                        )}
                        {doc.is_final && (
                          <span className="ml-2 rounded bg-blue-900 px-2 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider">
                            <i className="fas fa-check mr-1" /> Final Delivery
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate">
                        {doc.file_name} • {formatFileSize(doc.file_size)}
                        {doc.created_at && (
                          <> • <span className="text-slate-300">
                            {(() => {
                              const d = new Date(doc.created_at);
                              return isNaN(d.getTime()) ? '—' : format(d, "MMM d, yyyy");
                            })()}
                          </span></>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {onUpdateStatus && (
                      <SearchableSelect
                        value={["pending", "verified", "approved", "rejected"].includes(doc.status) ? doc.status : "pending"}
                        disabled={updatingId === doc.id}
                        isLoading={updatingId === doc.id}
                        onChange={(e) => handleStatusChange(doc, e.target.value)}
                        options={[
                          { value: "pending", label: "⏳ Pending" },
                          { value: "verified", label: "✅ Verified" },
                          { value: "rejected", label: "❌ Corrections" }
                        ]}
                        className="min-w-[155px]"
                        isClearable={false}
                        isSearchable={false}
                        size="sm"
                      />
                    )}

                    {!onUpdateStatus && (
                      <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-wider ${ds.cls}`}>
                        <i className={`fas ${ds.icon}`} />
                        {ds.label}
                      </div>
                    )}

                    {doc.notes && !isRemarking && (
                      <button
                        onClick={() => setViewingNoteDoc(doc)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-wider ${doc.status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'} transition-colors cursor-pointer`}
                        title="View Note"
                      >
                        <i className={`fas ${doc.status === 'rejected' ? 'fa-exclamation-circle' : 'fa-comment-dots'}`} />
                        Note
                      </button>
                    )}

                    <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-100 p-1 shadow-sm">
                      <button
                        onClick={() => void handleOpenDocument(doc)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
                        title="View Document"
                        type="button"
                      >
                        <i className="fas fa-eye text-[10px]" />
                      </button>
                      {canUpload && currentUser?.id && String(doc.uploaded_by?.id ?? doc.uploaded_by) === String(currentUser.id) && (
                        <>
                          <div className="h-4 w-px bg-slate-100" />
                          <button
                            onClick={() => onDelete(doc.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-600 hover:text-white transition-all"
                            title="Delete Document"
                          >
                            <i className="fas fa-trash-alt text-[10px]" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {isRemarking && (
                  <div className="mt-4 p-4 rounded-xl border border-rose-100 bg-rose-50/50 animate-slideDown">
                    <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                       <i className="fas fa-exclamation-circle" />
                       Required Corrections Notes
                    </p>
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="Explain what needs to be changed..."
                      className="w-full rounded-lg border border-rose-100 bg-white p-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-rose-500/10 min-h-[80px]"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button 
                        onClick={() => setRemarkingId(null)}
                        className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => submitRemark(doc)}
                        disabled={!remark.trim() || updatingId === doc.id}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-rose-700 transition-all disabled:opacity-50"
                      >
                        {updatingId === doc.id ? <i className="fas fa-circle-notch animate-spin" /> : "Submit Rejection"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-200">
              <i className="fas fa-folder-open text-xl" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No Documents Uploaded</p>
          </div>
        )}
      </div>

      <ImageLightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex >= 0 ? lightboxIndex : 0}
        slides={imageGallery.map((item) => item.slide)}
        onClose={() => setLightboxIndex(-1)}
      />

      <ChatNoteModal
        isOpen={viewingNoteDoc !== null}
        onClose={() => setViewingNoteDoc(null)}
        noteText={viewingNoteDoc?.notes}
        contextName={
          viewingNoteDoc?.document_name || 
          (viewingNoteDoc?.document_category ? (viewingNoteDoc.document_category.charAt(0).toUpperCase() + viewingNoteDoc.document_category.slice(1)) : null) || 
          viewingNoteDoc?.file_name || 
          "Document"
        }
        userType="accountant"
        onSubmitNote={async (note: string) => {
          if (!viewingNoteDoc || !onUpdateStatus) return;
          const roleName = currentUser?.role === "super_admin" ? "Admin" : "Accountant";
          const senderName = currentUser?.name;
          const formattedNote = senderName ? `${roleName} (${senderName}): ${note}` : `${roleName}: ${note}`;
          const newNoteText = viewingNoteDoc.notes ? `${viewingNoteDoc.notes}\n\n${formattedNote}` : formattedNote;
          await onUpdateStatus(viewingNoteDoc, viewingNoteDoc.status, newNoteText);
          setViewingNoteDoc({ ...viewingNoteDoc, notes: newNoteText });
        }}
      />
    </div>
  );
};
