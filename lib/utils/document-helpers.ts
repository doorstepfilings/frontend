import { RELATIONSHIP_MANAGER_ROLE, normalizeRole } from "@/lib/auth/redirects";

const normalizeDocumentField = (value: unknown) =>
  String(value || "").toLowerCase();

const getDocumentType = (doc: any) =>
  normalizeDocumentField(doc?.document_type);

const getDocumentCategory = (doc: any) =>
  normalizeDocumentField(doc?.document_category);

const getBooleanDocumentField = (value: unknown) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  normalizeDocumentField(value) === "true" ||
  normalizeDocumentField(value) === "yes";

export const getClientApprovalStatus = (doc: any) => {
  const status = normalizeDocumentField(doc?.status);
  const type = getDocumentType(doc);
  const role = getUploaderRole(doc);
  const isStaffRole = isStaffUploaderRole(role);

  const explicitStatus =
    doc?.client_approval_status ??
    doc?.clientApprovalStatus ??
    doc?.approval_status ??
    null;
  const normalized = normalizeDocumentField(explicitStatus);

  if (
    [
      "pending",
      "approved",
      "correction_requested",
      "not_required",
    ].includes(normalized)
  ) {
    return normalized;
  }

  if (
    [
      "client_approval_pending",
      "pending_client_approval",
      "awaiting_client_approval",
    ].includes(normalized)
  ) {
    return "pending";
  }

  if (["correction", "rejected", "changes_requested"].includes(normalized)) {
    return "correction_requested";
  }

  if (
    getBooleanDocumentField(
      doc?.requires_client_approval ?? doc?.requiresClientApproval,
    )
  ) {
    if (["approved", "verified"].includes(status)) return "approved";
    if (["rejected", "correction", "correction_requested"].includes(status)) {
      return "correction_requested";
    }
    return "pending";
  }

  if (isStaffRole && ["client", "client_document"].includes(type)) {
    if (["approved", "verified"].includes(status)) {
      return "approved";
    }

    if (
      ["rejected", "correction", "correction_requested"].includes(status)
    ) {
      return "correction_requested";
    }

    if (status === "pending") {
      return "pending";
    }
  }

  return "not_required";
};

export const requiresClientApprovalDocument = (doc: any) => {
  if (getBooleanDocumentField(doc?.requires_client_approval ?? doc?.requiresClientApproval)) {
    return true;
  }

  return getClientApprovalStatus(doc) !== "not_required";
};

export const isClientApprovalPendingDocument = (doc: any) =>
  requiresClientApprovalDocument(doc) && getClientApprovalStatus(doc) === "pending";

export const isClientApprovalApprovedDocument = (doc: any) =>
  requiresClientApprovalDocument(doc) && getClientApprovalStatus(doc) === "approved";

export const isClientApprovalCorrectionRequestedDocument = (doc: any) =>
  requiresClientApprovalDocument(doc) &&
  getClientApprovalStatus(doc) === "correction_requested";

const hasInternalDocumentMarker = (doc: any) => {
  const type = getDocumentType(doc);
  const category = getDocumentCategory(doc);

  return (
    ["internal", "internal_only", "internal_document"].includes(type) ||
    ["internal", "internal_document"].includes(category)
  );
};

const hasClientDocumentMarker = (doc: any) => {
  const type = getDocumentType(doc);
  const category = getDocumentCategory(doc);

  return (
    ["client", "client_document"].includes(type) ||
    ["client_document", "client_visible"].includes(category)
  );
};

const isImplicitClientApprovalDocument = (
  doc: any,
  userId: number | string | null,
) => {
  const status = normalizeDocumentField(doc?.status);

  return (
    status === "pending" &&
    hasClientDocumentMarker(doc) &&
    !isClientUploadedDocument(doc, userId)
  );
};

export const isClientDeliveryDocument = (doc: any) => {
  const status = normalizeDocumentField(doc?.status);
  return (
    !hasInternalDocumentMarker(doc) &&
    hasClientDocumentMarker(doc) &&
    ["approved", "verified"].includes(status)
  );
};

const getUploadedById = (doc: any) =>
  doc?.uploaded_by?.id ?? doc?.uploaded_by ?? null;

const getUploaderRole = (doc: any) =>
  normalizeDocumentField(doc?.uploaded_by?.role);

export const isStaffUploaderRole = (role: string | null | undefined) => {
  const normalizedRole = normalizeDocumentField(role);

  return (
    ["accountant", "admin", "super_admin", "employee"].includes(normalizedRole) ||
    normalizeRole(normalizedRole) === RELATIONSHIP_MANAGER_ROLE
  );
};

export const getDocumentNoteText = (doc: any) => {
  const note =
    doc?.notes ??
    doc?.remark ??
    doc?.remarks ??
    doc?.revision_notes ??
    doc?.update_note ??
    doc?.rejection_reason ??
    null;

  return typeof note === "string" && note.trim() ? note : "";
};

export const isClientUploadedDocument = (doc: any, userId: number | string | null) => {
  if (userId === null || userId === undefined) return false;
  const uploadedById = getUploadedById(doc);
  if (uploadedById === null || uploadedById === undefined) return false;
  return String(uploadedById) === String(userId);
};

export const getClientUploadedDocuments = (docs: any[], userId: number | string | null) => {
  if (!Array.isArray(docs)) return [];
  return docs.filter((doc) => isClientUploadedDocument(doc, userId));
};

export const isClientDocument = (doc: any) => {
  const type = getDocumentType(doc);
  const category = getDocumentCategory(doc);
  const role = getUploaderRole(doc);
  const status = normalizeDocumentField(doc?.status);
  const isStaffRole = isStaffUploaderRole(role);

  // 1. Explicit Internal markers (Sole Source of Truth - hide always)
  if (hasInternalDocumentMarker(doc)) {
    return false;
  }

  if (
    requiresClientApprovalDocument(doc) &&
    !isClientApprovalApprovedDocument(doc)
  ) {
    return false;
  }

  // 2. User/Customer Role (Clients always see their own uploads)
  if (role === "user" || role === "customer") return true;

  // For any staff/fallback uploads, certificates and reports MUST be approved or verified to be visible to the client
  const isDeliverable =
    ["certificate", "report"].includes(category) ||
    looksLikeCertificate(doc) ||
    looksLikeReport(doc);

  if (isDeliverable) {
    const isReady = ["approved", "verified"].includes(status);
    if (!isReady) return false;
  }

  // 3. Staff Uploads (Accountant/Admin/RM)
  if (isStaffRole) {

    // Only show if explicitly marked as client visible
    if (type === "client" || type === "client_document") return true;
    if (category === "client_document" || category === "client_visible")
      return true;

    // Certificates and Reports are usually deliverables
    if (["certificate", "report"].includes(category)) return true;

    // Explicit final deliveries
    if (doc?.is_final === 1 || doc?.is_final === true) return true;

    // Heuristics (ONLY if no explicit type is set)
    // We trust file names for reports/certificates if type is missing
    if (!type || type === "null" || type === "undefined") {
      if (looksLikeReport(doc) || looksLikeCertificate(doc)) return true;
    }

    // Default for staff: Internal
    return false;
  }

  // 4. Fallback for legacy data where role might be missing
  if (type === "client" || type === "client_document") return true;
  if (["certificate", "report", "other"].includes(category)) return true;

  return false;
};

export const isClientManagedDocument = (doc: any) => {
  const role = getUploaderRole(doc);

  if (hasInternalDocumentMarker(doc)) {
    return false;
  }

  if (hasClientDocumentMarker(doc)) {
    return true;
  }

  if (role === "user" || role === "customer") {
    return true;
  }

  return isClientDocument(doc);
};

export const isInternalDocument = (doc: any) => {
  const role = getUploaderRole(doc);

  // 1. Explicit Internal markers (Sole Source of Truth)
  if (hasInternalDocumentMarker(doc)) {
    return true;
  }

  if (hasClientDocumentMarker(doc)) {
    return false;
  }

  const isInternalRole = isStaffUploaderRole(role);

  // 2. It's internal if uploaded by staff and NOT categorized as a client document
  return isInternalRole && !isClientDocument(doc);
};

export const splitDocumentsByOwner = (docs: any[], clientUserId: number | string | null) => {
  if (!Array.isArray(docs)) return { clientDocs: [], internalDocs: [] };

  const currentDocuments = docs.filter(
    (doc) =>
      !["replaced", "superseded"].includes(
        normalizeDocumentField(doc?.status),
      ),
  );

  return {
    clientDocs: currentDocuments.filter((doc) => isClientManagedDocument(doc)),
    internalDocs: currentDocuments.filter((doc) => isInternalDocument(doc)),
  };
};

export const getClientApprovalDocuments = (
  docs: any[],
  userId: number | string | null = null,
) => {
  if (!Array.isArray(docs)) return [];
  return docs.filter(
    (doc) =>
      isClientApprovalPendingDocument(doc) ||
      isImplicitClientApprovalDocument(doc, userId),
  );
};

export const getClientArchiveDocuments = (
  docs: any[],
  userId: number | string | null,
) => {
  if (!Array.isArray(docs)) return [];

  return docs.filter((doc) => {
    if (isClientApprovalPendingDocument(doc)) return false;
    if (isImplicitClientApprovalDocument(doc, userId)) return false;
    if (isClientUploadedDocument(doc, userId)) return true;
    if (isClientApprovalApprovedDocument(doc)) return true;
    if (isClientApprovalCorrectionRequestedDocument(doc)) return true;
    return isClientDocument(doc);
  });
};

export const looksLikeCertificate = (doc: any) => {
  if (doc?.document_category === "certificate") return true;
  const haystack = `${doc.document_type || ""} ${doc.document_category || ""} ${doc.file_name || ""
    }`.toLowerCase();
  return haystack.includes("certificate");
};

export const looksLikeReport = (doc: any) => {
  if (doc?.document_category === "report") return true;
  const haystack = `${doc.document_type || ""} ${doc.document_category || ""} ${doc.file_name || ""
    }`.toLowerCase();
  return haystack.includes("report");
};

export const getDocumentTimestamp = (doc: any) =>
  doc?.uploaded_at || doc?.created_at || null;

export const resolveStorageUrl = (url: string | null) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  const cleanUrl = String(url)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  if (!cleanUrl) return null;

  const encodeSegment = (segment: string) => {
    try {
      return encodeURIComponent(decodeURIComponent(segment));
    } catch {
      return encodeURIComponent(segment);
    }
  };

  const encodePath = (value: string) =>
    value
      .split("/")
      .filter(Boolean)
      .map(encodeSegment)
      .join("/");

  // If the path already begins with "storage/", we just ensure it has a leading slash
  if (cleanUrl.startsWith("storage/")) {
    return `/${encodePath(cleanUrl)}`;
  }

  return `/storage/${encodePath(cleanUrl)}`;
};

export const getDocumentSourceUrl = (doc: any) => {
  const candidates = [
    doc?.file_url,
    doc?.fileUrl,
    doc?.file_path,
    doc?.filePath,
    doc?.url,
    doc?.path,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return null;
};

async function verifyDocumentAccess(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    method: "HEAD",
  });

  if (response.ok || response.status === 405) {
    return;
  }

  if (response.status === 404) {
    throw new Error(
      "This file is not available in current or legacy storage yet.",
    );
  }

  throw new Error("Unable to open this document right now.");
}

export const ensureDocumentAccessible = async (url: string | null) => {
  const resolvedUrl = resolveStorageUrl(url);
  if (!resolvedUrl) {
    throw new Error("Document link is missing.");
  }

  if (/^https?:\/\//i.test(resolvedUrl) || typeof window === "undefined") {
    return resolvedUrl;
  }

  await verifyDocumentAccess(resolvedUrl);
  return resolvedUrl;
};

export const openDocumentInNewTab = (
  url: string | null,
  fileName?: string | null,
) => {
  const resolvedUrl = resolveStorageUrl(url);
  if (!resolvedUrl) {
    throw new Error("Document link is missing.");
  }

  if (typeof window === "undefined") {
    return resolvedUrl;
  }

  try {
    const link = document.createElement("a");
    link.href = resolvedUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    // Fallback to window.open if the programmatic click fails for any reason
    const popup = window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    if (!popup) {
      throw new Error(
        "Your browser blocked the document window. Please allow pop-ups for this site, then try opening the document again.",
      );
    }
  }

  return resolvedUrl;
};

export const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const isImageDocument = (doc: any) => {
  const mime = doc?.mime_type || doc?.type || "";
  if (mime.startsWith("image/")) return true;
  const name = doc?.file_name || doc?.name || "";
  return /\.(png|jpe?g|gif|webp)$/i.test(name);
};

export const getDocumentIcon = (mimeType = "", fileName = "") => {
  const m = (mimeType || "").toLowerCase();
  const f = (fileName || "").toLowerCase();

  if (m.includes("pdf") || f.endsWith(".pdf"))
    return { icon: "fa-file-pdf", color: "text-rose-500", bg: "bg-rose-50" };

  if (m.includes("image") || /\.(png|jpe?g|gif|webp)$/i.test(f))
    return { icon: "fa-file-image", color: "text-blue-500", bg: "bg-blue-50" };

  if (
    m.includes("excel") ||
    m.includes("spreadsheet") ||
    m.includes("csv") ||
    /\.(xlsx?|csv)$/i.test(f)
  )
    return {
      icon: "fa-file-excel",
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    };

  if (m.includes("word") || m.includes("document") || /\.(docx?)$/i.test(f))
    return {
      icon: "fa-file-word",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    };

  if (m.includes("zip") || m.includes("archive") || /\.(zip|rar|7z)$/i.test(f))
    return { icon: "fa-file-archive", color: "text-amber-600", bg: "bg-amber-50" };

  return { icon: "fa-file-alt", color: "text-gray-400", bg: "bg-gray-50" };
};

export const forceDownload = (url: string | null, fileName: string) => {
  const resolvedUrl = resolveStorageUrl(url);
  if (!resolvedUrl) return;
  const link = document.createElement("a");
  link.href = resolvedUrl;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const openBlobInNewTabOrDownload = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");

  if (!opened) {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 60_000);
};
