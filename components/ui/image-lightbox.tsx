"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";

export type ImageLightboxSlide = {
    alt?: string;
    download?: string | { filename: string; url: string };
    src: string;
};

function clampIndex(index: number, total: number) {
    if (total <= 0) return 0;
    return Math.min(Math.max(index, 0), total - 1);
}

function resolveDownloadMeta(slide: ImageLightboxSlide) {
    if (!slide.download) {
        return {
            filename: "image-preview",
            url: slide.src,
        };
    }
    if (typeof slide.download === "string") {
        return {
            filename: slide.alt || "image-preview",
            url: slide.download,
        };
    }
    return slide.download;
}

export function ImageLightbox({
    index,
    onClose,
    open,
    slides,
}: {
    index: number;
    onClose: () => void;
    open: boolean;
    slides: ImageLightboxSlide[];
}) {
    const [activeIndex, setActiveIndex] = useState(index);

    useEffect(() => {
        if (open) {
            setActiveIndex(clampIndex(index, slides.length));
        }
    }, [index, open, slides.length]);

    if (!open || slides.length === 0) {
        return null;
    }

    const activeSlide = slides[activeIndex];
    if (!activeSlide) return null;

    const downloadMeta = resolveDownloadMeta(activeSlide);
    const hasMultiple = slides.length > 1;

    return (
        <Modal 
            isOpen={open} 
            onClose={onClose} 
            size="xl" 
            title={activeSlide.alt || "Document Preview"}
        >
            <div className="relative flex flex-col items-center bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                <div className="flex w-full items-center justify-center min-h-[40vh] max-h-[60vh]">
                    <Image
                        src={activeSlide.src}
                        alt={activeSlide.alt || "Document preview"}
                        width={1200}
                        height={800}
                        unoptimized
                        className="max-h-[60vh] w-auto rounded-lg object-contain shadow-sm"
                    />
                </div>
                
                {hasMultiple && (
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveIndex((i) => clampIndex(i - 1, slides.length));
                            }}
                            disabled={activeIndex === 0}
                            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition-all hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200"
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveIndex((i) => clampIndex(i + 1, slides.length));
                            }}
                            disabled={activeIndex === slides.length - 1}
                            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition-all hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200"
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-6 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-500">
                    {hasMultiple ? `Image ${activeIndex + 1} of ${slides.length}` : ''}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Close
                    </button>
                    <a
                        href={downloadMeta.url}
                        download={downloadMeta.filename}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-500"
                    >
                        <i className="fas fa-download"></i> Download
                    </a>
                </div>
            </div>
        </Modal>
    );
}
