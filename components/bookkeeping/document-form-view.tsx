"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  BookkeepingPageHeader,
  FieldLabel,
  StatusBadge,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/bookkeeping/bookkeeping-ui";
import {
  calculateDocumentTotals,
  createDefaultDocument,
  createEmptyLineItem,
  formatCurrency,
  getCustomerDisplayName,
  taxRateOptions,
  unitOptions,
} from "@/lib/features/bookkeeping/helpers";
import { readCustomers, readDocuments, upsertDocument } from "@/lib/features/bookkeeping/storage";
import {
  type BookkeepingDocument,
  type BookkeepingDocumentType,
  type Customer,
  type DocumentLineItem,
  type DocumentStatus,
  type PaymentMode,
  type TaxCalculationMode,
  documentConfigs,
} from "@/lib/features/bookkeeping/types";

const statusOptions: DocumentStatus[] = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "converted",
  "cancelled",
  "paid",
  "partial",
  "overdue",
];

const paymentModeOptions: PaymentMode[] = [
  "cash",
  "bank-transfer",
  "upi",
  "card",
  "cheque",
  "other",
];

type DocumentErrors = Partial<Record<keyof BookkeepingDocument | "items", string>>;

export function DocumentFormView({
  type,
  documentId,
}: {
  type: BookkeepingDocumentType;
  documentId?: string;
}) {
  const router = useRouter();
  const config = documentConfigs[type];
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [document, setDocument] = useState<BookkeepingDocument>(() =>
    createDefaultDocument(type, 0),
  );
  const [errors, setErrors] = useState<DocumentErrors>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedCustomers = readCustomers();
      const savedDocuments = readDocuments(type);
      const existingDocument = documentId
        ? savedDocuments.find((item) => item.id === documentId)
        : undefined;

      setCustomers(savedCustomers);
      setDocument(existingDocument ?? createDefaultDocument(type, savedDocuments.length));
      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [documentId, type]);

  const selectedCustomer = useMemo(() => {
    return customers.find((customer) => customer.id === document.customerId);
  }, [customers, document.customerId]);

  const updateDocument = <K extends keyof BookkeepingDocument>(
    field: K,
    value: BookkeepingDocument[K],
  ) => {
    setDocument((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updateLineItem = <K extends keyof DocumentLineItem>(
    itemId: string,
    field: K,
    value: DocumentLineItem[K],
  ) => {
    setDocument((current) => {
      const items = current.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      );

      return {
        ...current,
        items,
        totals: calculateDocumentTotals(items, current.extraDiscount),
      };
    });
    setErrors((current) => ({ ...current, items: undefined }));
  };

  const addLineItem = () => {
    setDocument((current) => {
      const items = [...current.items, createEmptyLineItem()];
      return {
        ...current,
        items,
        totals: calculateDocumentTotals(items, current.extraDiscount),
      };
    });
  };

  const removeLineItem = (itemId: string) => {
    setDocument((current) => {
      const items = current.items.filter((item) => item.id !== itemId);
      const safeItems = items.length > 0 ? items : [createEmptyLineItem()];
      return {
        ...current,
        items: safeItems,
        totals: calculateDocumentTotals(safeItems, current.extraDiscount),
      };
    });
  };

  const updateExtraDiscount = (value: number) => {
    setDocument((current) => ({
      ...current,
      extraDiscount: value,
      totals: calculateDocumentTotals(current.items, value),
    }));
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((item) => item.id === customerId);
    setDocument((current) => ({
      ...current,
      customerId,
      customerName: customer ? getCustomerDisplayName(customer) : "",
      placeOfSupply: customer?.state || current.placeOfSupply,
      delivery:
        current.delivery && customer
          ? {
              ...current.delivery,
              deliveryAddress: customer.shippingAddress || customer.billingAddress,
            }
          : current.delivery,
    }));
    setErrors((current) => ({ ...current, customerId: undefined }));
  };

  const validateDocument = () => {
    const nextErrors: DocumentErrors = {};

    if (!document.number.trim()) nextErrors.number = `${config.numberLabel} is required`;
    if (!document.customerId) nextErrors.customerId = "Customer is required";
    if (!document.documentDate) nextErrors.documentDate = `${config.primaryDateLabel} is required`;
    if (type === "invoices" && !document.dueDate) nextErrors.dueDate = "Due date is required";
    if (type !== "invoices" && !document.validUntil) {
      nextErrors.validUntil = `${config.secondaryDateLabel} is required`;
    }
    if (!document.items.some((item) => item.name.trim() && item.quantity > 0)) {
      nextErrors.items = "At least one valid item is required";
    }
    if (type === "delivery-challans" && !document.delivery?.deliveryAddress.trim()) {
      nextErrors.delivery = "Delivery address is required";
    }

    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateDocument();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const nextDocument = {
      ...document,
      customerName: selectedCustomer ? getCustomerDisplayName(selectedCustomer) : document.customerName,
      totals: calculateDocumentTotals(document.items, document.extraDiscount),
      updatedAt: new Date().toISOString(),
    };

    upsertDocument(nextDocument);
    toast.success(`${config.singular} saved.`);
    router.push(config.route);
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">
        Loading {config.singular.toLowerCase()}...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BookkeepingPageHeader
        title={documentId ? `Edit ${config.singular}` : `New ${config.singular}`}
        description={`Create and maintain ${config.singular.toLowerCase()} details with customer, tax, items, totals, and terms.`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <StatusBadge status={document.status} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toast.success("PDF action is ready for backend integration.")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-black text-slate-700 hover:text-blue-800"
          >
            <i className="fas fa-file-pdf" />
            PDF
          </button>
          <button
            type="button"
            onClick={() => toast.success("Email action is ready for backend integration.")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-black text-slate-700 hover:text-blue-800"
          >
            <i className="fas fa-envelope" />
            Email
          </button>
          <Link
            href={config.route}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-black text-slate-700 hover:text-slate-950"
          >
            <i className="fas fa-arrow-left" />
            Back
          </Link>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <InputField
            label={config.numberLabel}
            required
            value={document.number}
            error={errors.number}
            onChange={(value) => updateDocument("number", value.toUpperCase())}
          />
          <SelectField
            label="Customer"
            required
            value={document.customerId}
            error={errors.customerId}
            onChange={handleCustomerChange}
            options={[
              { value: "", label: customers.length ? "Select customer" : "No customers added" },
              ...customers.map((customer) => ({
                value: customer.id,
                label: getCustomerDisplayName(customer),
              })),
            ]}
          />
          <SelectField
            label="Status"
            value={document.status}
            onChange={(value) => updateDocument("status", value as DocumentStatus)}
            options={statusOptions.map((status) => ({
              value: status,
              label: status.replace("-", " "),
            }))}
          />
          <InputField
            label={config.primaryDateLabel}
            required
            type="date"
            value={document.documentDate}
            error={errors.documentDate}
            onChange={(value) => updateDocument("documentDate", value)}
          />
          <InputField
            label={config.secondaryDateLabel}
            required
            type="date"
            value={type === "invoices" ? document.dueDate : document.validUntil}
            error={type === "invoices" ? errors.dueDate : errors.validUntil}
            onChange={(value) =>
              type === "invoices"
                ? updateDocument("dueDate", value)
                : updateDocument("validUntil", value)
            }
          />
          <InputField
            label="Place of Supply"
            value={document.placeOfSupply}
            onChange={(value) => updateDocument("placeOfSupply", value)}
          />
          <SelectField
            label="Tax Calculation"
            value={document.taxCalculation}
            onChange={(value) => updateDocument("taxCalculation", value as TaxCalculationMode)}
            options={[
              { value: "exclusive", label: "Exclusive" },
              { value: "inclusive", label: "Inclusive" },
            ]}
          />
        </div>
      </section>

      {type === "delivery-challans" ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Delivery Details</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <InputField
              label="Dispatch Date"
              type="date"
              value={document.delivery?.dispatchDate ?? ""}
              onChange={(value) =>
                updateDocument("delivery", {
                  dispatchDate: value,
                  deliveryAddress: document.delivery?.deliveryAddress ?? "",
                  vehicleNumber: document.delivery?.vehicleNumber ?? "",
                  transportName: document.delivery?.transportName ?? "",
                })
              }
            />
            <InputField
              label="Vehicle Number"
              value={document.delivery?.vehicleNumber ?? ""}
              onChange={(value) =>
                updateDocument("delivery", {
                  dispatchDate: document.delivery?.dispatchDate ?? "",
                  deliveryAddress: document.delivery?.deliveryAddress ?? "",
                  vehicleNumber: value.toUpperCase(),
                  transportName: document.delivery?.transportName ?? "",
                })
              }
            />
            <InputField
              label="Transport Name"
              value={document.delivery?.transportName ?? ""}
              onChange={(value) =>
                updateDocument("delivery", {
                  dispatchDate: document.delivery?.dispatchDate ?? "",
                  deliveryAddress: document.delivery?.deliveryAddress ?? "",
                  vehicleNumber: document.delivery?.vehicleNumber ?? "",
                  transportName: value,
                })
              }
            />
            <TextareaField
              label="Delivery Address"
              required
              value={document.delivery?.deliveryAddress ?? ""}
              error={errors.delivery}
              onChange={(value) =>
                updateDocument("delivery", {
                  dispatchDate: document.delivery?.dispatchDate ?? "",
                  deliveryAddress: value,
                  vehicleNumber: document.delivery?.vehicleNumber ?? "",
                  transportName: document.delivery?.transportName ?? "",
                })
              }
            />
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Line Items</h2>
            {errors.items ? <p className="mt-1 text-xs font-bold text-rose-600">{errors.items}</p> : null}
          </div>
          <button
            type="button"
            onClick={addLineItem}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 px-3 text-sm font-black text-blue-800 hover:bg-blue-50"
          >
            <i className="fas fa-plus" />
            Add Item
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[980px] table-fixed divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="w-52 px-3 py-3">Item</th>
                <th className="w-56 px-3 py-3">Description</th>
                <th className="w-28 px-3 py-3">HSN/SAC</th>
                <th className="w-24 px-3 py-3">Qty</th>
                <th className="w-28 px-3 py-3">Unit</th>
                <th className="w-28 px-3 py-3">Rate</th>
                <th className="w-28 px-3 py-3">Discount</th>
                <th className="w-24 px-3 py-3">Tax</th>
                <th className="w-32 px-3 py-3">Total</th>
                <th className="w-14 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {document.items.map((item) => {
                const lineSubtotal = item.quantity * item.rate;
                const lineTaxable = Math.max(0, lineSubtotal - item.discount);
                const lineTotal = lineTaxable + (lineTaxable * item.taxRate) / 100;

                return (
                  <tr key={item.id}>
                    <td className="px-3 py-3">
                      <input
                        value={item.name}
                        onChange={(event) => updateLineItem(item.id, "name", event.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        value={item.description}
                        onChange={(event) =>
                          updateLineItem(item.id, "description", event.target.value)
                        }
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        value={item.hsnSac}
                        onChange={(event) =>
                          updateLineItem(item.id, "hsnSac", event.target.value.toUpperCase())
                        }
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(event) =>
                          updateLineItem(item.id, "quantity", Number(event.target.value))
                        }
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={item.unit}
                        onChange={(event) => updateLineItem(item.id, "unit", event.target.value)}
                        className={selectClass}
                      >
                        {unitOptions.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        value={item.rate}
                        onChange={(event) =>
                          updateLineItem(item.id, "rate", Number(event.target.value))
                        }
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        value={item.discount}
                        onChange={(event) =>
                          updateLineItem(item.id, "discount", Number(event.target.value))
                        }
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={item.taxRate}
                        onChange={(event) =>
                          updateLineItem(item.id, "taxRate", Number(event.target.value))
                        }
                        className={selectClass}
                      >
                        {taxRateOptions.map((rate) => (
                          <option key={rate} value={rate}>
                            {rate}%
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 font-black text-slate-950">
                      {formatCurrency(lineTotal)}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-100 text-rose-600 hover:bg-rose-50"
                        title="Remove item"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <TextareaField
              label="Terms"
              value={document.terms}
              onChange={(value) => updateDocument("terms", value)}
            />
            <TextareaField
              label="Notes"
              value={document.notes}
              onChange={(value) => updateDocument("notes", value)}
            />
          </div>

          {type === "invoices" ? (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h2 className="text-lg font-black text-slate-950">Payment Details</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <InputField
                  label="Paid Amount"
                  type="number"
                  value={String(document.payment?.paidAmount ?? 0)}
                  onChange={(value) =>
                    updateDocument("payment", {
                      paidAmount: Number(value),
                      paymentMode: document.payment?.paymentMode ?? "upi",
                      paymentDate: document.payment?.paymentDate ?? "",
                      transactionReference: document.payment?.transactionReference ?? "",
                      paymentNotes: document.payment?.paymentNotes ?? "",
                    })
                  }
                />
                <SelectField
                  label="Payment Mode"
                  value={document.payment?.paymentMode ?? "upi"}
                  onChange={(value) =>
                    updateDocument("payment", {
                      paidAmount: document.payment?.paidAmount ?? 0,
                      paymentMode: value as PaymentMode,
                      paymentDate: document.payment?.paymentDate ?? "",
                      transactionReference: document.payment?.transactionReference ?? "",
                      paymentNotes: document.payment?.paymentNotes ?? "",
                    })
                  }
                  options={paymentModeOptions.map((mode) => ({
                    value: mode,
                    label: mode.replace("-", " "),
                  }))}
                />
                <InputField
                  label="Payment Date"
                  type="date"
                  value={document.payment?.paymentDate ?? ""}
                  onChange={(value) =>
                    updateDocument("payment", {
                      paidAmount: document.payment?.paidAmount ?? 0,
                      paymentMode: document.payment?.paymentMode ?? "upi",
                      paymentDate: value,
                      transactionReference: document.payment?.transactionReference ?? "",
                      paymentNotes: document.payment?.paymentNotes ?? "",
                    })
                  }
                />
                <InputField
                  label="Transaction Reference"
                  value={document.payment?.transactionReference ?? ""}
                  onChange={(value) =>
                    updateDocument("payment", {
                      paidAmount: document.payment?.paidAmount ?? 0,
                      paymentMode: document.payment?.paymentMode ?? "upi",
                      paymentDate: document.payment?.paymentDate ?? "",
                      transactionReference: value,
                      paymentNotes: document.payment?.paymentNotes ?? "",
                    })
                  }
                />
                <TextareaField
                  label="Payment Notes"
                  value={document.payment?.paymentNotes ?? ""}
                  onChange={(value) =>
                    updateDocument("payment", {
                      paidAmount: document.payment?.paidAmount ?? 0,
                      paymentMode: document.payment?.paymentMode ?? "upi",
                      paymentDate: document.payment?.paymentDate ?? "",
                      transactionReference: document.payment?.transactionReference ?? "",
                      paymentNotes: value,
                    })
                  }
                />
              </div>
            </div>
          ) : null}
        </section>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Totals</h2>
          <div className="mt-5 space-y-3 text-sm">
            <SummaryRow label="Subtotal" value={document.totals.subtotal} />
            <div>
              <FieldLabel label="Extra Discount" />
              <input
                type="number"
                min="0"
                value={document.extraDiscount}
                onChange={(event) => updateExtraDiscount(Number(event.target.value))}
                className={inputClass}
              />
            </div>
            <SummaryRow label="Discount" value={document.totals.discountTotal} />
            <SummaryRow label="Taxable" value={document.totals.taxableAmount} />
            <SummaryRow label="Tax" value={document.totals.taxTotal} />
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-lg font-black text-slate-950">
              <span>Total</span>
              <span>{formatCurrency(document.totals.grandTotal)}</span>
            </div>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/95 py-4 backdrop-blur">
        <Link
          href={config.route}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:text-slate-950"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-900 px-5 text-sm font-black text-white hover:bg-blue-800"
        >
          <i className="fas fa-save" />
          Save {config.singular}
        </button>
      </div>
    </form>
  );
}

function InputField({
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
      {error ? <p className="mt-1 text-xs font-bold text-rose-600">{error}</p> : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs font-bold text-rose-600">{error}</p> : null}
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={textareaClass}
      />
      {error ? <p className="mt-1 text-xs font-bold text-rose-600">{error}</p> : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-slate-600">
      <span>{label}</span>
      <span className="font-black text-slate-950">{formatCurrency(value)}</span>
    </div>
  );
}
