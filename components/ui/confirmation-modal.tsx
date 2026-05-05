"use client";

import React from "react";
import { Modal } from "./modal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  loading?: boolean;
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmationModalProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "bg-red-100 text-red-600",
          button: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          icon: "bg-amber-100 text-amber-600",
          button: "bg-amber-500 hover:bg-amber-600 text-white",
        };
      case "primary":
      default:
        return {
          icon: "bg-blue-100 text-blue-600",
          button: "bg-blue-900 hover:bg-blue-800 text-white",
        };
    }
  };

  const classes = getVariantClasses();

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} size="sm">
      <div className="py-4 text-center">
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${classes.icon}`}
        >
          <i
            className={`fas ${
              variant === "danger"
                ? "fa-exclamation-triangle"
                : variant === "warning"
                ? "fa-exclamation-circle"
                : "fa-question-circle"
            } text-2xl`}
          ></i>
        </div>

        <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
        <p className="mb-8 text-gray-500">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 font-bold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold shadow-sm transition-all disabled:opacity-50 ${classes.button}`}
          >
            {loading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
