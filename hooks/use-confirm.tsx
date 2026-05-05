"use client";

import { useCallback, useRef, useState } from "react";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
}

const DEFAULT_OPTIONS: ConfirmOptions = {
  title: "Confirm Action",
  message: "Are you sure you want to proceed?",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  variant: "danger",
};

export const useConfirm = () => {
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const [options, setOptions] = useState<ConfirmOptions>(DEFAULT_OPTIONS);
  const [isOpen, setIsOpen] = useState(false);

  const confirm = useCallback((nextOptions: ConfirmOptions = {}) => {
    setOptions({ ...DEFAULT_OPTIONS, ...nextOptions });
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  const approve = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  }, []);

  const ConfirmDialog = useCallback(
    () => (
      <ConfirmationModal
        isOpen={isOpen}
        onClose={close}
        onConfirm={approve}
        title={options.title}
        message={options.message}
        confirmLabel={options.confirmLabel}
        cancelLabel={options.cancelLabel}
        variant={options.variant}
      />
    ),
    [approve, close, isOpen, options]
  );

  return { confirm, ConfirmDialog };
};
