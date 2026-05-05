export const isClientDeliveryDocument = (doc: any) => {
  const status = String(doc?.status || "").toLowerCase();
  return (
    doc?.document_type === "client" && ["approved", "verified"].includes(status)
  );
};

const getUploadedById = (doc: any) =>
  doc?.uploaded_by?.id ?? doc?.uploaded_by ?? null;

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
  if (doc?.document_type === "client") return true;
  if (doc?.document_category === "client_document") return true;
  if (["certificate", "report", "other"].includes(doc?.document_category))
    return true;
  if (looksLikeReport(doc)) return true;
  return doc?.uploaded_by?.role === "user";
};

export const isInternalDocument = (doc: any) => {
  if (doc?.document_type === "internal") return true;
  if (doc?.document_category === "internal_document") return true;
  if (isClientDocument(doc)) return false;
  return doc?.uploaded_by?.role === "accountant";
};

export const splitDocumentsByOwner = (docs: any[], clientUserId: number | string | null) => {
    if (!Array.isArray(docs)) return { clientDocs: [], internalDocs: [] };
    
    return {
        clientDocs: docs.filter(doc => isClientDocument(doc)),
        internalDocs: docs.filter(doc => isInternalDocument(doc))
    };
};

export const looksLikeCertificate = (doc: any) => {
  if (doc?.document_category === "certificate") return true;
  const haystack = `${doc.document_type || ""} ${doc.document_category || ""} ${
    doc.file_name || ""
  }`.toLowerCase();
  return haystack.includes("certificate");
};

export const looksLikeReport = (doc: any) => {
  if (doc?.document_category === "report") return true;
  const haystack = `${doc.document_type || ""} ${doc.document_category || ""} ${
    doc.file_name || ""
  }`.toLowerCase();
  return haystack.includes("report");
};

export const getDocumentTimestamp = (doc: any) =>
  doc?.uploaded_at || doc?.created_at || null;

export const resolveStorageUrl = (url: string | null) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  
  const cleanUrl = String(url).replace(/^\/+/, "");
  // If the path already begins with "storage/", we just ensure it has a leading slash
  if (cleanUrl.startsWith("storage/")) {
    return `/${cleanUrl}`;
  }
  
  return `/storage/${cleanUrl}`;
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
  if (!url) return;
  const link = document.createElement("a");
  link.href = url;
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
