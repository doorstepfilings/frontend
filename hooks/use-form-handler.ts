"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

interface FormHandlerOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  validate?: (values: T) => string | null;
  successMessage?: string;
  errorMessage?: string;
}

export function useFormHandler<T>({
  initialValues,
  onSubmit,
  validate,
  successMessage = "Saved successfully",
  errorMessage = "An error occurred",
}: FormHandlerOptions<T>) {
  const [form, setForm] = useState<T>(initialValues);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof T, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleListUpdate = (field: keyof T, index: number, subField: string, value: any) => {
    setForm((prev: any) => {
      const newList = [...prev[field]];
      newList[index] = { ...newList[index], [subField]: value };
      return { ...prev, [field]: newList };
    });
  };

  const handleListAdd = (field: keyof T, defaultValue: any) => {
    setForm((prev: any) => ({
      ...prev,
      [field]: [...prev[field], defaultValue],
    }));
  };

  const handleListRemove = (field: keyof T, index: number) => {
    setForm((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index),
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (validate) {
      const error = validate(form);
      if (error) {
        toast.error(error);
        return;
      }
    }

    setSaving(true);
    try {
      await onSubmit(form);
      toast.success(successMessage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || errorMessage);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    setForm,
    loading,
    setLoading,
    saving,
    setSaving,
    handleChange,
    handleListUpdate,
    handleListAdd,
    handleListRemove,
    handleSubmit,
  };
}
