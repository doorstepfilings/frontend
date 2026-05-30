"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import {
  ImageLightbox,
  type ImageLightboxSlide,
} from "@/components/ui/image-lightbox";
import {
  DocumentUpload,
  type DocumentUploadRow,
} from "@/components/ui/document-upload";
import {
  deleteMyDocument,
  fetchMyServices,
  uploadMyDocuments,
} from "@/lib/features/services/services-slice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  ensureDocumentAccessible,
  getClientUploadedDocuments,
  getDocumentSourceUrl,
  isImageDocument,
  openDocumentInNewTab,
  resolveStorageUrl,
} from "@/lib/utils/document-helpers";
import { useStoredUser } from "@/lib/auth/hooks";

type DashboardUploadRow = DocumentUploadRow & {
  source: "upload" | "existing";
  existing_document_id: string;
  notes: string;
};

type DashboardDocumentArchiveItem = {
  document_name?: string | null;
  document_type?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  id: number | string;
  mime_type?: string | null;
  serviceId: number | string;
  serviceName?: string | null;
  serviceStatus?: string | null;
  status?: string | null;
};

const createEmptyRow = (): DashboardUploadRow => ({
  source: "upload",
  file: null,
  existing_document_id: "",
  type: "",
  notes: "",
});

const DOC_TYPE_ICON = (mime: string | null | undefined) => {
  if (!mime) return "fa-file-alt text-gray-400";
  if (mime.includes("pdf")) return "fa-file-pdf text-rose-500";
  if (mime.includes("image")) return "fa-file-image text-blue-500";
  if (
    mime.includes("sheet") ||
    mime.includes("excel") ||
    mime.includes("csv")
  ) {
    return "fa-file-excel text-emerald-500";
  }
  if (mime.includes("word") || mime.includes("doc"))
    return "fa-file-word text-blue-600";
  return "fa-file-alt text-gray-400";
};

const getArchiveDocumentLabel = (doc: DashboardDocumentArchiveItem) =>
  doc.document_name || doc.document_type || doc.file_name || "Document";

type DashboardDocumentsViewProps = {
  paymentFeedback?: {
    message?: string;
    orderId?: string;
    paymentId?: string;
    serviceIds?: string[];
    status?: string;
  };
};

export function DashboardDocumentsView({
  paymentFeedback,
}: DashboardDocumentsViewProps) {
  const dispatch = useAppDispatch();
  const { myServices, loading } = useAppSelector((state) => state.services);
  const user = useStoredUser();
  const successMessageHandled = useRef(false);
  const initialFeedbackServiceId = paymentFeedback?.serviceIds?.[0] || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [uploadServiceId, setUploadServiceId] = useState(initialFeedbackServiceId);
  const [archiveServiceId, setArchiveServiceId] = useState(
    initialFeedbackServiceId || "all",
  );
  const [rows, setRows] = useState<DashboardUploadRow[]>([createEmptyRow()]);
  const [fileErrors, setFileErrors] = useState<Record<number, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [documentToDelete, setDocumentToDelete] =
    useState<DashboardDocumentArchiveItem | null>(null);
  const [isDeletingDocument, setIsDeletingDocument] = useState(false);

  useEffect(() => {
    void dispatch(fetchMyServices());
  }, [dispatch]);

  useEffect(() => {
    if (
      String(paymentFeedback?.status || "").toLowerCase() !== "success" ||
      successMessageHandled.current
    ) {
      return;
    }

    successMessageHandled.current = true;
    toast.success(
      paymentFeedback?.message || "Payment successfully done.",
    );
  }, [paymentFeedback?.message, paymentFeedback?.status]);

  const uploadableServices = useMemo(
    () =>
      (myServices || []).filter(
        (service) =>
          !["completed", "cancelled", "approved"].includes(service.status),
      ),
    [myServices],
  );

  const flatDocuments = useMemo(
    () =>
      (myServices || []).flatMap((service) =>
        getClientUploadedDocuments(
          service.request_documents || [],
          user?.id ?? null,
        ).map((doc: DashboardDocumentArchiveItem) => ({
          ...doc,
          serviceId: service.id,
          serviceName: service.service?.name,
          serviceStatus: service.status,
        })),
      ),
    [myServices, user?.id],
  );

  const filteredDocs = useMemo(
    () =>
      flatDocuments.filter((doc) => {
        const matchesService =
          archiveServiceId === "all" ||
          String(doc.serviceId) === String(archiveServiceId);
        const matchesSearch =
          !searchQuery ||
          doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.document_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          doc.document_type
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          doc.serviceName?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesService && matchesSearch;
      }),
    [archiveServiceId, flatDocuments, searchQuery],
  );

  const imageGallery = useMemo(
    () =>
      filteredDocs.reduce<
        Array<{
          docId: string;
          slide: ImageLightboxSlide;
        }>
      >((gallery, doc) => {
        const src = resolveStorageUrl(doc.file_url ?? null);
        if (!src || !isImageDocument(doc)) {
          return gallery;
        }

        gallery.push({
          docId: String(doc.id),
          slide: {
            alt: getArchiveDocumentLabel(doc),
            download: doc.file_name
              ? {
                  filename: doc.file_name,
                  url: src,
                }
              : src,
            src,
          },
        });

        return gallery;
      }, []),
    [filteredDocs],
  );

  const handleFileChange = (index: number, file: File | null) => {
    setRows((currentRows) => {
      const nextRows = [...currentRows];
      nextRows[index] = {
        ...nextRows[index],
        file,
      };
      return nextRows;
    });

    if (!file) {
      setFileErrors((current) => {
        const next = { ...current };
        delete next[index];
        return next;
      });
      return;
    }

    const maxBytes = 1024 * 1024;
    if (file.size > maxBytes) {
      setFileErrors((current) => ({
        ...current,
        [index]: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 1 MB limit.`,
      }));
      return;
    }

    setFileErrors((current) => {
      const next = { ...current };
      delete next[index];
      return next;
    });
  };

  const handleUpload = async () => {
    if (!uploadServiceId) {
      toast.error("Please select a service");
      return;
    }

    const validRows = rows.filter((row) => row.file && row.type);
    if (validRows.length === 0) {
      toast.error("Please add at least one document row");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();

    validRows.forEach((row, index) => {
      if (row.file) {
        formData.append(`documents[${index}][file]`, row.file);
        formData.append(`documents[${index}][type]`, row.type);
        if (row.notes) {
          formData.append(`documents[${index}][notes]`, row.notes);
        }
      }
    });

    try {
      await dispatch(
        uploadMyDocuments({ id: uploadServiceId, formData }),
      ).unwrap();
      toast.success("Documents uploaded successfully");
      setRows([createEmptyRow()]);
      setFileErrors({});
      void dispatch(fetchMyServices());
    } catch (error: unknown) {
      const message =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Upload failed";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, serviceId: string) => {
    setIsDeletingDocument(true);
    try {
      await dispatch(deleteMyDocument({ serviceId, docId })).unwrap();
      toast.success("Document deleted");
      setDocumentToDelete(null);
    } catch (error: unknown) {
      const message =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Delete failed";
      toast.error(message);
    } finally {
      setIsDeletingDocument(false);
    }
  };

  const handleDeleteClick = (doc: DashboardDocumentArchiveItem) => {
    setDocumentToDelete(doc);
  };

  const handleOpenDocument = async (doc: DashboardDocumentArchiveItem) => {
    try {
      await openDocumentInNewTab(
        getDocumentSourceUrl(doc),
        doc.file_name ?? getArchiveDocumentLabel(doc),
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to open this document.";
      toast.error(message);
    }
  };

  const handleOpenPreview = async (docId: number | string) => {
    const previewIndex = imageGallery.findIndex(
      (item) => item.docId === String(docId),
    );
    if (previewIndex >= 0) {
      try {
        await ensureDocumentAccessible(
          imageGallery[previewIndex]?.slide.src ?? null,
        );
        setLightboxIndex(previewIndex);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to preview this image.";
        toast.error(message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Documents</h1>
        <p className="text-xs text-gray-500">
          Upload and manage your documents for active service applications.
        </p>
      </div>

      <div className="space-y-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Add New Documents
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Select a service to attach documents
            </p>
          </div>
          <select
            value={uploadServiceId}
            onChange={(event) => setUploadServiceId(event.target.value)}
            className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500"
          >
            <option value="">Select Target Service</option>
            {uploadableServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.service?.name}
              </option>
            ))}
          </select>
        </div>

        {uploadServiceId ? (
          <DocumentUpload
            rows={rows}
            fileErrors={fileErrors}
            onFileChange={handleFileChange}
            onTypeChange={(index, type) => {
              setRows((currentRows) => {
                const nextRows = [...currentRows];
                nextRows[index] = { ...nextRows[index], type };
                return nextRows;
              });
            }}
            onNotesChange={(index, notes) => {
              setRows((currentRows) => {
                const nextRows = [...currentRows];
                nextRows[index] = { ...nextRows[index], notes };
                return nextRows;
              });
            }}
            onAddRow={() =>
              setRows((currentRows) => [...currentRows, createEmptyRow()])
            }
            onRemoveRow={(index) =>
              setRows((currentRows) =>
                currentRows.filter((_, rowIndex) => rowIndex !== index),
              )
            }
            onSubmit={handleUpload}
            isUploading={isUploading}
          />
        ) : null}
      </div>

      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <h2 className="text-2xl font-bold text-gray-900">Document Archive</h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
            <select
              value={archiveServiceId}
              onChange={(event) => setArchiveServiceId(event.target.value)}
              className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-blue-500"
            >
              <option value="all">All Services</option>
              {myServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.service?.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-900 border-t-transparent" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-50">
              <i className="fas fa-folder-open text-3xl text-gray-200" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-800">
              No Documents Found
            </h2>
            <p className="text-sm text-gray-400">
              Upload documents for your active services and they will appear
              here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredDocs.map((doc: DashboardDocumentArchiveItem) => (
              <div
                key={doc.id}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50">
                      <i
                        className={`fas ${DOC_TYPE_ICON(doc.mime_type)} text-xl`}
                      />
                    </div>
                    <div>
                      <h4 className="max-w-[150px] truncate text-sm font-bold text-gray-900">
                        {getArchiveDocumentLabel(doc)}
                      </h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {doc.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isImageDocument(doc) ? (
                      <button
                        onClick={() => void handleOpenPreview(doc.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all hover:bg-blue-900 hover:text-white"
                        title="Preview image"
                        type="button"
                      >
                        <i className="fas fa-eye text-xs" />
                      </button>
                    ) : null}
                    <button
                      onClick={() => void handleOpenDocument(doc)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-all hover:bg-blue-900 hover:text-white"
                      type="button"
                    >
                      <i className="fas fa-external-link-alt text-xs" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(doc)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition-all hover:bg-rose-600 hover:text-white"
                      type="button"
                    >
                      <i className="fas fa-trash-alt text-xs" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Service
                  </span>
                  <span className="max-w-[120px] truncate text-[10px] font-bold uppercase text-gray-900">
                    {doc.serviceName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ImageLightbox
        key={lightboxIndex >= 0 ? `${lightboxIndex}-${imageGallery.length}` : "closed"}
        open={lightboxIndex >= 0}
        index={lightboxIndex >= 0 ? lightboxIndex : 0}
        slides={imageGallery.map((item) => item.slide)}
        onClose={() => setLightboxIndex(-1)}
      />

      <ConfirmationModal
        isOpen={documentToDelete !== null}
        loading={isDeletingDocument}
        onClose={() => {
          if (!isDeletingDocument) {
            setDocumentToDelete(null);
          }
        }}
        onConfirm={() =>
          documentToDelete
            ? void handleDelete(
                String(documentToDelete.id),
                String(documentToDelete.serviceId),
              )
            : undefined
        }
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmLabel="Delete Document"
        variant="danger"
      />
    </div>
  );
}
