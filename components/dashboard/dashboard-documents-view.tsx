"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";

import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  Eye,
  FileStack,
  FilterX,
  Hourglass,
  MessageSquareText,
  Search,
  SlidersHorizontal,
  SquareArrowOutUpRight,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { ChatNoteModal } from "@/components/ui/chat-note-modal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import {
  DocumentUpload,
  type DocumentUploadRow,
} from "@/components/ui/document-upload";
import {
  ImageLightbox,
  type ImageLightboxSlide,
} from "@/components/ui/image-lightbox";
import { PageLogoLoader } from "@/components/ui/logo-loader";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useStoredUser } from "@/lib/auth/hooks";
import {
  deleteMyDocument,
  fetchMyServices,
  uploadMyDocuments,
} from "@/lib/features/services/services-slice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  ensureDocumentAccessible,
  formatFileSize,
  getClientUploadedDocuments,
  getDocumentIcon,
  getDocumentNoteText,
  getDocumentSourceUrl,
  getDocumentTimestamp,
  isImageDocument,
  openDocumentInNewTab,
  resolveStorageUrl,
} from "@/lib/utils/document-helpers";

type DashboardUploadRow = DocumentUploadRow & {
  source: "upload" | "existing";
  existing_document_id: string;
  notes: string;
};

type DashboardDocumentArchiveItem = {
  created_at?: string | null;
  document_category?: string | null;
  document_name?: string | null;
  document_type?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_url?: string | null;
  id: number | string;
  mime_type?: string | null;
  notes?: string | null;
  rejection_reason?: string | null;
  remark?: string | null;
  remarks?: string | null;
  revision_notes?: string | null;
  serviceId: number | string;
  serviceName?: string | null;
  serviceStatus?: string | null;
  status?: string | null;
  update_note?: string | null;
  uploaded_at?: string | null;
  uploaded_by?: {
    id?: number | string | null;
    name?: string | null;
    role?: string | null;
  } | null;
};

type DashboardDocumentsViewProps = {
  paymentFeedback?: {
    message?: string;
    orderId?: string;
    paymentId?: string;
    serviceIds?: string[];
    status?: string;
  };
};

const createEmptyRow = (): DashboardUploadRow => ({
  source: "upload",
  file: null,
  existing_document_id: "",
  type: "",
  notes: "",
});

const getArchiveDocumentLabel = (doc: DashboardDocumentArchiveItem) =>
  doc.document_name || doc.document_type || doc.file_name || "Document";

const getDocumentTypeLabel = (doc: DashboardDocumentArchiveItem) => {
  const mime = String(doc.mime_type || "").toLowerCase();
  const fileName = String(doc.file_name || "").toLowerCase();

  if (mime.includes("pdf") || fileName.endsWith(".pdf")) return "PDF";
  if (mime.includes("image") || /\.(png|jpe?g|gif|webp)$/i.test(fileName)) {
    return "Image";
  }
  if (
    mime.includes("excel") ||
    mime.includes("sheet") ||
    mime.includes("csv") ||
    /\.(xlsx?|csv)$/i.test(fileName)
  ) {
    return "Sheet";
  }
  if (mime.includes("word") || /\.(docx?)$/i.test(fileName)) return "Doc";
  return "File";
};

const getDocumentTypeBadgeClass = (type: string) => {
  if (type === "PDF") return "border-rose-100 bg-rose-50 text-rose-600";
  if (type === "Image") return "border-blue-100 bg-blue-50 text-blue-600";
  if (type === "Sheet") return "border-emerald-100 bg-emerald-50 text-emerald-600";
  if (type === "Doc") return "border-indigo-100 bg-indigo-50 text-indigo-600";
  return "border-slate-100 bg-slate-50 text-slate-600";
};

const getDocStatusLabel = (status?: string | null) => {
  const s = String(status || "").toLowerCase();
  if (s === "rejected" || s === "correction") return "Issue";
  if (s === "verified" || s === "approved") return "Approved";
  if (s === "pending") return "Pending";
  return s || "Uploaded";
};

const getDocumentStatusBadgeClass = (status?: string | null) => {
  const normalized = String(status || "").toLowerCase();

  if (["verified", "approved"].includes(normalized)) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }
  if (["rejected", "correction"].includes(normalized)) {
    return "border-rose-100 bg-rose-50 text-rose-700";
  }
  if (normalized === "pending") {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }
  return "border-slate-100 bg-slate-50 text-slate-600";
};

const formatDocumentTimestamp = (doc: DashboardDocumentArchiveItem) => {
  const timestamp = getDocumentTimestamp(doc);
  if (!timestamp) return "Not available";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Not available";

  return format(date, "dd MMM yyyy, hh:mm a");
};

const isFinalizedDocument = (status?: string | null) =>
  ["verified", "approved"].includes(String(status || "").toLowerCase());


export function DashboardDocumentsView({
  paymentFeedback,
}: DashboardDocumentsViewProps) {
  const dispatch = useAppDispatch();
  const { myServices, loading } = useAppSelector((state) => state.services);
  const user = useStoredUser();
  const successMessageHandled = useRef(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [uploadServiceId, setUploadServiceId] = useState("");
  const [archiveServiceId, setArchiveServiceId] = useState("all");
  const [archiveStatus, setArchiveStatus] = useState("all");
  const [archiveType, setArchiveType] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<DashboardUploadRow[]>([createEmptyRow()]);
  const [fileErrors, setFileErrors] = useState<Record<number, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [documentToDelete, setDocumentToDelete] =
    useState<DashboardDocumentArchiveItem | null>(null);
  const [isDeletingDocument, setIsDeletingDocument] = useState(false);
  const [viewingNoteDoc, setViewingNoteDoc] =
    useState<DashboardDocumentArchiveItem | null>(null);

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
    toast.success(paymentFeedback?.message || "Payment successfully done.");
  }, [paymentFeedback?.message, paymentFeedback?.status]);

  useEffect(() => {
    if (uploadServiceId || (paymentFeedback?.serviceIds?.length ?? 0) === 0) {
      return;
    }

    const nextServiceId = paymentFeedback?.serviceIds?.[0] || "";

    if (nextServiceId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUploadServiceId((current) => current || nextServiceId);
      setArchiveServiceId((current) =>
        current === "all" ? nextServiceId || "all" : current,
      );
    }
  }, [paymentFeedback?.serviceIds, uploadServiceId]);

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

  const serviceFilterOptions = useMemo(
    () => [
      { value: "all", label: "Service" },
      ...myServices.map((service) => ({
        value: String(service.id),
        label: String(service.service?.name || ""),
      })),
    ],
    [myServices],
  );

  const typeFilterOptions = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(flatDocuments.map((doc) => getDocumentTypeLabel(doc))),
    );

    return [
      { value: "all", label: "Type" },
      ...uniqueTypes.map((type) => ({
        value: type.toLowerCase(),
        label: type,
      })),
    ];
  }, [flatDocuments]);

  const archiveStats = useMemo(() => {
    const approved = flatDocuments.filter((doc) =>
      ["verified", "approved"].includes(String(doc.status || "").toLowerCase()),
    ).length;
    const pending = flatDocuments.filter(
      (doc) => String(doc.status || "").toLowerCase() === "pending",
    ).length;
    const issue = flatDocuments.filter((doc) =>
      ["rejected", "correction"].includes(String(doc.status || "").toLowerCase()),
    ).length;

    return {
      total: flatDocuments.length,
      approved,
      pending,
      issue,
    };
  }, [flatDocuments]);

  const filteredDocs = useMemo(
    () =>
      flatDocuments.filter((doc) => {
        const matchesService =
          archiveServiceId === "all" ||
          String(doc.serviceId) === String(archiveServiceId);
        const matchesStatus =
          archiveStatus === "all" ||
          String(doc.status || "").toLowerCase() === archiveStatus;
        const matchesType =
          archiveType === "all" ||
          getDocumentTypeLabel(doc).toLowerCase() === archiveType;
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

        return matchesService && matchesStatus && matchesType && matchesSearch;
      }),
    [archiveServiceId, archiveStatus, archiveType, flatDocuments, searchQuery],
  );

  const sortedDocs = useMemo(() => {
    const docs = [...filteredDocs];

    docs.sort((left, right) => {
      const leftTime = new Date(getDocumentTimestamp(left) || 0).getTime();
      const rightTime = new Date(getDocumentTimestamp(right) || 0).getTime();

      if (sortDirection === "asc") {
        return leftTime - rightTime;
      }

      return rightTime - leftTime;
    });

    return docs;
  }, [filteredDocs, sortDirection]);

  const imageGallery = useMemo(
    () =>
      sortedDocs.reduce<
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
    [sortedDocs],
  );

  const perPage = Number(rowsPerPage);
  const totalDocuments = sortedDocs.length;
  const totalPages = Math.max(1, Math.ceil(totalDocuments / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return sortedDocs.slice(start, start + perPage);
  }, [currentPage, perPage, sortedDocs]);
  const visibleRangeStart =
    totalDocuments === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const visibleRangeEnd = Math.min(currentPage * perPage, totalDocuments);
  const activeFilterCount = [
    searchQuery.trim() ? "search" : null,
    archiveServiceId !== "all" ? "service" : null,
    archiveType !== "all" ? "type" : null,
    archiveStatus !== "all" ? "status" : null,
  ].filter(Boolean).length;

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

  const clearArchiveFilters = () => {
    setSearchQuery("");
    setArchiveServiceId("all");
    setArchiveStatus("all");
    setArchiveType("all");
    setRowsPerPage("10");
    setSortDirection("desc");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* ── Hero / Stats Card ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl lg:p-8">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 top-0 h-32 w-32 rounded-full bg-violet-500/8 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
                Client Document Workspace
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white lg:text-4xl">
              My Documents
            </h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Manage uploads, verification progress, and accountant feedback in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[520px] lg:grid-cols-4">

            {/* Total */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 pb-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/8 hover:border-blue-400/30 hover:shadow-xl hover:shadow-blue-500/10">
              {/* Glow orb */}
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-400/20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-blue-400/30" />
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 h-0.5 w-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 transition-all duration-500 group-hover:w-full" />

              <div className="relative z-10 flex flex-col">
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Total</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 transition-all duration-300 group-hover:bg-blue-500/30 group-hover:scale-110 group-hover:rotate-6">
                    <FileStack className="size-3.5" />
                  </div>
                </div>
                <p className="mt-3 text-4xl font-black tracking-tighter text-white leading-none">
                  {archiveStats.total}
                </p>
                <p className="mt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">All time</p>
              </div>
            </div>

            {/* Approved */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 pb-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/8 hover:border-emerald-400/30 hover:shadow-xl hover:shadow-emerald-500/10">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-400/20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-emerald-400/30" />
              <div className="absolute bottom-0 left-0 h-0.5 w-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500 group-hover:w-full" />

              <div className="relative z-10 flex flex-col">
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Approved</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 transition-all duration-300 group-hover:bg-emerald-500/30 group-hover:scale-110 group-hover:rotate-6">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                </div>
                <p className="mt-3 text-4xl font-black tracking-tighter text-emerald-400 leading-none">
                  {archiveStats.approved}
                </p>
                <p className="mt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Verified</p>
              </div>
            </div>

            {/* Pending */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 pb-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/8 hover:border-amber-400/30 hover:shadow-xl hover:shadow-amber-500/10">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-400/20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-amber-400/30" />
              <div className="absolute bottom-0 left-0 h-0.5 w-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500 group-hover:w-full" />

              <div className="relative z-10 flex flex-col">
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Pending</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 transition-all duration-300 group-hover:bg-amber-500/30 group-hover:scale-110 group-hover:rotate-6">
                    <Hourglass className="size-3.5" />
                  </div>
                </div>
                <p className="mt-3 text-4xl font-black tracking-tighter text-amber-400 leading-none">
                  {archiveStats.pending}
                </p>
                <p className="mt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">In review</p>
              </div>
            </div>

            {/* Issues */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 pb-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/8 hover:border-rose-400/30 hover:shadow-xl hover:shadow-rose-500/10">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-rose-400/20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-rose-400/30" />
              <div className="absolute bottom-0 left-0 h-0.5 w-0 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 transition-all duration-500 group-hover:w-full" />

              <div className="relative z-10 flex flex-col">
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Issues</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 transition-all duration-300 group-hover:bg-rose-500/30 group-hover:scale-110 group-hover:rotate-6">
                    <AlertCircle className="size-3.5" />
                  </div>
                </div>
                <p className="mt-3 text-4xl font-black tracking-tighter text-rose-400 leading-none">
                  {archiveStats.issue}
                </p>
                <p className="mt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Need action</p>
              </div>
            </div>

          </div>
        </div>
      </div>


      {/* ── Upload Card ─────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <i className="fa-solid fa-cloud-arrow-up text-lg text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add New Documents</h2>
              <p className="text-xs text-slate-500">
                Choose a service, then upload files with the correct document type.
              </p>
            </div>
          </div>

          <div className="w-full max-w-[300px]">
            <SearchableSelect
              value={uploadServiceId}
              onChange={(event) => setUploadServiceId(event.target.value)}
              options={uploadableServices.map((service) => ({
                value: String(service.id),
                label: String(service.service?.name || ""),
              }))}
              placeholder="Select Target Service"
              size="sm"
            />
          </div>
        </div>

        <div className="mt-6">
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
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200  from-slate-50/80 to-white p-12 text-center transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/20">
              <div className="relative mb-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30">
                  <i className="fa-solid fa-cloud-arrow-up text-2xl text-white" />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-blue-500 text-blue-600 text-[10px] font-black">
                  +
                </span>
              </div>
              <p className="text-sm font-bold text-slate-700">
                Select a service to begin uploads
              </p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">
                Choose the target service from the dropdown above, and we&apos;ll prepare the upload workspace.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Archive ──────────────────────────────────────────────── */}
      <div className="space-y-0">
        {loading ? (
          <PageLogoLoader label="Loading documents..." />
        ) : flatDocuments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-24 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-inner">
              <i className="fas fa-folder-open text-3xl text-slate-300" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-800">No Documents Uploaded Yet</h2>
            <p className="mx-auto max-w-sm text-sm text-slate-500">
              Start with the upload section above and your documents will appear here with verification status and actions.
            </p>
          </div>
        ) : totalDocuments === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-24 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-inner">
              <FilterX className="size-9 text-slate-300" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-800">No Documents Match</h2>
            <p className="mx-auto max-w-sm text-sm text-slate-500">
              Clear one or more filters to see more documents.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={clearArchiveFilters}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow-md transition-all duration-200"
              >
                <FilterX className="size-4" />
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm">
            <div className="px-6 pt-6 pb-5 border-b border-slate-100 bg-white">
              {/* Title + badges row */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Document Archive</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Search, filter, and review all uploaded documents in one place.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    {totalDocuments} matching
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                    <ArrowUpDown className="size-2.5" />
                    {sortDirection === "desc" ? "Newest first" : "Oldest first"}
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                      {activeFilterCount} active filter{activeFilterCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Compact horizontal filter bar */}
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                      Filters &amp; Search
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_195px_155px_165px_auto] items-end">
                    {/* Search */}
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input
                        type="text"
                        placeholder="Search documents, service or type..."
                        value={searchQuery}
                        onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }}
                        className="w-full h-9 pl-9 pr-9 text-sm rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => { setSearchQuery(""); setPage(1); }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-slate-600 transition-all"
                        >
                          <i className="fa-solid fa-xmark text-xs" />
                        </button>
                      )}
                    </div>

                    {/* Service */}
                    <SearchableSelect
                      value={archiveServiceId}
                      onChange={(event) => { setArchiveServiceId(event.target.value); setPage(1); }}
                      options={serviceFilterOptions}
                      placeholder="Service"
                      className="w-full"
                      isClearable={false}
                    />

                    {/* Type */}
                    <SearchableSelect
                      value={archiveType}
                      onChange={(event) => { setArchiveType(event.target.value); setPage(1); }}
                      options={typeFilterOptions}
                      placeholder="Type"
                      className="w-full"
                      isClearable={false}
                    />

                    {/* Status */}
                    <SearchableSelect
                      value={archiveStatus}
                      onChange={(event) => { setArchiveStatus(event.target.value); setPage(1); }}
                      options={[
                        { value: "all", label: "All Statuses" },
                        { value: "approved", label: "Approved" },
                        { value: "verified", label: "Verified" },
                        { value: "pending", label: "Pending" },
                        { value: "rejected", label: "Issue" },
                        { value: "correction", label: "Correction" },
                      ]}
                      className="w-full"
                      isClearable={false}
                    />

                    {/* Sort + Clear */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSortDirection((c) => c === "desc" ? "asc" : "desc")}
                        title={`Sort ${sortDirection === "desc" ? "oldest first" : "newest first"}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50/50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                      {activeFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={clearArchiveFilters}
                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>



            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Document
                    </th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Service
                    </th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Type
                    </th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Status
                    </th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5"
                        onClick={() => setSortDirection((c) => c === "desc" ? "asc" : "desc")}
                      >
                        Uploaded / Updated
                        <ArrowUpDown className="size-3.5" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                {paginatedDocs.map((doc) => {
                  const typeLabel = getDocumentTypeLabel(doc);
                  const noteText = getDocumentNoteText(doc);
                  const iconConfig = getDocumentIcon(
                    doc.mime_type || undefined,
                    doc.file_name || undefined,
                  );

                return (
                    <tr
                      key={doc.id}
                      className="group/row border-b border-slate-50 transition-all duration-200 hover:bg-blue-50/30 hover:shadow-[inset_3px_0_0_0_#3b82f6]"
                    >
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 ${iconConfig.bg}`}
                          >
                            <i
                              className={`fas ${iconConfig.icon} ${iconConfig.color} text-sm`}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {getArchiveDocumentLabel(doc)}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {doc.file_name || "Unnamed file"}
                            </p>
                            <p className="mt-1 text-[11px] font-medium text-slate-400">
                              {doc.file_size
                                ? formatFileSize(doc.file_size)
                                : "Size unavailable"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <p className="max-w-[180px] whitespace-normal text-sm font-medium text-slate-700">
                          {doc.serviceName || "Service unavailable"}
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <Badge
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getDocumentTypeBadgeClass(typeLabel)}`}
                        >
                          {typeLabel}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <Badge
                          className={`relative rounded-full border px-2.5 py-1 text-[11px] font-semibold flex items-center w-fit ${getDocumentStatusBadgeClass(doc.status)}`}
                        >
                          <span className="relative mr-1.5 flex h-1.5 w-1.5">
                            {["pending", "rejected", "correction"].includes(String(doc.status || "").toLowerCase()) && (
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75"></span>
                            )}
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
                          </span>
                          {getDocStatusLabel(doc.status)}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <p className="text-sm font-medium text-slate-700">
                          {formatDocumentTimestamp(doc)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          by {doc.uploaded_by?.name || "User"}
                        </p>
                      </td>

                      <td className="px-6 py-4 align-top">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150"
                              onClick={() =>
                                isImageDocument(doc)
                                  ? void handleOpenPreview(doc.id)
                                  : void handleOpenDocument(doc)
                              }
                              title={isImageDocument(doc) ? "Preview image" : "View document"}
                            >
                              <Eye className="size-4" />
                            </button>

                            {noteText ? (
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-150"
                                onClick={() => setViewingNoteDoc(doc)}
                                title="View note"
                              >
                                <MessageSquareText className="size-4" />
                              </button>
                            ) : null}

                            {!isFinalizedDocument(doc.status) ? (
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-150"
                                onClick={() => handleDeleteClick(doc)}
                                title="Delete document"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            ) : null}
                          </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between rounded-b-3xl">
              {/* Left: record count */}
              <p className="text-xs font-medium text-slate-400 leading-none">
                Showing{" "}
                <span className="font-bold text-slate-600">{visibleRangeStart}–{visibleRangeEnd}</span>{" "}
                of{" "}
                <span className="font-bold text-slate-600">{totalDocuments}</span>{" "}
                documents
              </p>

              {/* Right: rows-per-page + pill navigation */}
              <div className="flex items-center gap-4">
                {/* Rows per page */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400 whitespace-nowrap">Rows per page</span>
                  <SearchableSelect
                    value={rowsPerPage}
                    onChange={(event) => { setRowsPerPage(event.target.value); setPage(1); }}
                    options={[
                      { value: "5", label: "5" },
                      { value: "10", label: "10" },
                      { value: "20", label: "20" },
                      { value: "50", label: "50" },
                    ]}
                    className="w-[72px]"
                    size="sm"
                    isSearchable={false}
                    isClearable={false}
                  />
                </div>

                {/* Divider */}
                <div className="h-5 w-px bg-slate-200" />

                {/* Page info */}
                <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                  Page <span className="font-bold text-slate-600">{currentPage}</span> of <span className="font-bold text-slate-600">{totalPages}</span>
                </span>

                {/* Pill prev/next */}
                <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-0.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setPage((c) => Math.max(1, c - 1))}
                    disabled={currentPage === 1}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-150 active:scale-90"
                    aria-label="Previous page"
                  >
                    <i className="fas fa-chevron-left text-[10px]" />
                  </button>

                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-900 px-2 text-xs font-bold text-white leading-none">
                    {currentPage}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPage((c) => Math.min(totalPages, c + 1))}
                    disabled={currentPage === totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-150 active:scale-90"
                    aria-label="Next page"
                  >
                    <i className="fas fa-chevron-right text-[10px]" />
                  </button>
                </div>
              </div>
            </div>

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
        noteText={getDocumentNoteText(viewingNoteDoc)}
        contextName={
          viewingNoteDoc?.document_name ||
          (viewingNoteDoc?.document_category
            ? viewingNoteDoc.document_category.charAt(0).toUpperCase() +
            viewingNoteDoc.document_category.slice(1)
            : null) ||
          viewingNoteDoc?.file_name ||
          "Document"
        }
        userType="user"
        uploadedBy={
          viewingNoteDoc?.uploaded_by
            ? {
              id: viewingNoteDoc.uploaded_by.id ?? undefined,
              name: viewingNoteDoc.uploaded_by.name ?? undefined,
              role: viewingNoteDoc.uploaded_by.role ?? undefined,
            }
            : undefined
        }
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
