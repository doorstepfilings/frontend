import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import type { ImageLightboxSlide } from "@/components/ui/image-lightbox";
import {
  ensureDocumentAccessible,
  getDocumentSourceUrl,
  isImageDocument,
  openDocumentInNewTab,
  resolveStorageUrl,
} from "@/lib/utils/document-helpers";

export type ServiceDocument = {
  document_type?: string | null;
  document_category?: string | null;
  document_name?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  id: number | string;
  status?: string | null;
  [key: string]: unknown;
};

export type DocumentLightboxItem = {
  docId: string;
  slide: ImageLightboxSlide;
};

export function useDocumentGallery(requestDocuments: ServiceDocument[]) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const documentGallery = useMemo(
    () =>
      requestDocuments.reduce<DocumentLightboxItem[]>((gallery, doc) => {
        const fileUrl = doc.file_url ?? (doc.filePath as string) ?? null;
        const src = resolveStorageUrl(fileUrl);
        if (!src || !isImageDocument(doc as any)) {
          return gallery;
        }

        const fileName = (doc.file_name ?? doc.fileName) as string;
        const documentType = (doc.document_type ?? doc.documentType) as string;

        gallery.push({
          docId: String(doc.id),
          slide: {
            alt: documentType || fileName || "Document preview",
            download: fileName
              ? {
                  filename: fileName,
                  url: src,
                }
              : src,
            src,
          },
        });

        return gallery;
      }, []),
    [requestDocuments],
  );

  const handleOpenDocument = async (doc: ServiceDocument) => {
    try {
      const fileName = (doc.file_name ?? doc.fileName ?? doc.document_name ?? doc.documentName ?? "document") as string;
      await openDocumentInNewTab(
        getDocumentSourceUrl(doc as any),
        fileName,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to open this document.";
      toast.error(message);
    }
  };

  const handleOpenPreview = async (previewIndex: number) => {
    const slide = documentGallery[previewIndex]?.slide;
    if (!slide) {
      return;
    }

    try {
      await ensureDocumentAccessible(slide.src);
      setLightboxIndex(previewIndex);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to preview this image.";
      toast.error(message);
    }
  };

  return {
    documentGallery,
    lightboxIndex,
    setLightboxIndex,
    handleOpenDocument,
    handleOpenPreview,
  };
}
