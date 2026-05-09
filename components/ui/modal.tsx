"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = "",
  ...props
}: ModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full w-full h-full",
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-6">
        {/* Overlay with subtle blur */}
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-all duration-500 animate-in fade-in"
          onClick={closeOnOverlayClick ? onClose : undefined}
        />

        {/* Modal Panel - Simplified & Clean */}
        <div
          className={`relative z-10 transform overflow-hidden rounded-[2.5rem] bg-white text-left shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] transition-all animate-in zoom-in-95 duration-300 ${sizeClasses[size]} ${className}`}
          {...props}
        >
          {/* Header - No Border, Clean Title */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-10 pt-10 pb-2">
              {title && (
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{title}</h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
                >
                  <i className="fas fa-times text-lg"></i>
                </button>
              )}
            </div>
          )}

          {/* Content - Spacious Padding */}
          <div className="px-10 pb-10 pt-6">{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
