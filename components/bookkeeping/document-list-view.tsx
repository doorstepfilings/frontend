"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  AmountCell,
  BookkeepingPageHeader,
  EmptyState,
  StatCard,
  StatusBadge,
  TableShell,
  inputClass,
} from "@/components/bookkeeping/bookkeeping-ui";
import {
  formatDisplayDate,
  getDocumentPrimaryDate,
  getDocumentSecondaryDate,
} from "@/lib/features/bookkeeping/helpers";
import { deleteDocument, readDocuments } from "@/lib/features/bookkeeping/storage";
import {
  type BookkeepingDocument,
  type BookkeepingDocumentType,
  documentConfigs,
} from "@/lib/features/bookkeeping/types";

export function DocumentListView({ type }: { type: BookkeepingDocumentType }) {
  const config = documentConfigs[type];
  const [documents, setDocuments] = useState<BookkeepingDocument[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDocuments(readDocuments(type));
      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [type]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return documents;

    return documents.filter((document) => {
      return [
        document.number,
        document.customerName,
        document.status,
        document.placeOfSupply,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [documents, search]);

  const totalAmount = documents.reduce((sum, document) => sum + document.totals.grandTotal, 0);
  const draftCount = documents.filter((document) => document.status === "draft").length;
  const sentCount = documents.filter((document) => document.status === "sent").length;
  const paidCount = documents.filter((document) => document.status === "paid").length;

  const handleDelete = (documentId: string) => {
    deleteDocument(documentId);
    setDocuments(readDocuments(type));
    toast.success(`${config.singular} deleted.`);
  };

  return (
    <div className="space-y-6">
      <BookkeepingPageHeader
        title={config.plural}
        description={`Manage ${config.plural.toLowerCase()} with customer, item, tax, total, PDF, and email actions.`}
        actionHref={`${config.route}/new`}
        actionLabel={`New ${config.singular}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Records" value={documents.length} icon="fa-file-lines" />
        <StatCard label="Draft" value={draftCount} icon="fa-pen" tone="slate" />
        <StatCard label={type === "invoices" ? "Paid" : "Sent"} value={type === "invoices" ? paidCount : sentCount} icon="fa-paper-plane" tone="emerald" />
        <StatCard label="Total Value" value={new Intl.NumberFormat("en-IN", { notation: "compact" }).format(totalAmount)} icon="fa-indian-rupee-sign" tone="amber" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${config.plural.toLowerCase()}`}
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toast.success("Bulk PDF export is ready for backend integration.")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:text-blue-800"
          >
            <i className="fas fa-file-pdf" />
            Export PDF
          </button>
          <Link
            href="/dashboard/bookkeeping/customers"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:text-blue-800"
          >
            <i className="fas fa-users" />
            Customers
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">
          Loading {config.plural.toLowerCase()}...
        </div>
      ) : filteredDocuments.length === 0 ? (
        <EmptyState
          title={config.emptyTitle}
          description={config.emptyDescription}
          actionHref={`${config.route}/new`}
          actionLabel={`New ${config.singular}`}
        />
      ) : (
        <TableShell>
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">{config.numberLabel}</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">{config.primaryDateLabel}</th>
                <th className="px-4 py-3">{config.secondaryDateLabel}</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocuments.map((document) => (
                <tr key={document.id} className="align-top">
                  <td className="px-4 py-4 font-black text-slate-950">{document.number}</td>
                  <td className="px-4 py-4 text-slate-700">{document.customerName || "-"}</td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatDisplayDate(getDocumentPrimaryDate(document))}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatDisplayDate(getDocumentSecondaryDate(document))}
                  </td>
                  <td className="px-4 py-4">
                    <AmountCell value={document.totals.grandTotal} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={document.status} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`${config.route}/${document.id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:text-blue-800"
                        title="View or edit"
                      >
                        <i className="fas fa-pen" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => toast.success("Email action is ready for backend integration.")}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:text-blue-800"
                        title="Email"
                      >
                        <i className="fas fa-envelope" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(document.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-100 text-rose-600 hover:bg-rose-50"
                        title="Delete"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
