"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AmountCell,
  BookkeepingPageHeader,
  EmptyState,
  StatCard,
  StatusBadge,
  TableShell,
} from "@/components/bookkeeping/bookkeeping-ui";
import { formatCurrency, formatDisplayDate } from "@/lib/features/bookkeeping/helpers";
import { readCustomers, readDocuments } from "@/lib/features/bookkeeping/storage";
import {
  type BookkeepingDocument,
  type Customer,
  documentConfigs,
} from "@/lib/features/bookkeeping/types";

export function BillingDashboardView() {
  const [documents, setDocuments] = useState<BookkeepingDocument[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDocuments(readDocuments());
      setCustomers(readCustomers());
      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const invoices = documents.filter((document) => document.type === "invoices");
  const quotations = documents.filter((document) => document.type === "quotations");
  const proformaInvoices = documents.filter((document) => document.type === "proforma-invoices");
  const deliveryChallans = documents.filter((document) => document.type === "delivery-challans");
  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");
  const unpaidInvoices = invoices.filter(
    (invoice) => !["paid", "cancelled"].includes(invoice.status),
  );
  const overdueInvoices = invoices.filter((invoice) => invoice.status === "overdue");

  const revenue = paidInvoices.reduce((sum, invoice) => sum + invoice.totals.grandTotal, 0);
  const outstanding = unpaidInvoices.reduce((sum, invoice) => sum + invoice.totals.grandTotal, 0);
  const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + invoice.totals.grandTotal, 0);

  const recentDocuments = useMemo(() => {
    return [...documents]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 8);
  }, [documents]);

  return (
    <div className="space-y-6">
      <BookkeepingPageHeader
        title="Billing"
        description="Track bookkeeping totals, recent documents, revenue, outstanding invoices, and quick creation actions."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={customers.length} icon="fa-users" />
        <StatCard label="Invoices" value={invoices.length} icon="fa-file-invoice" tone="blue" />
        <StatCard
          label="Revenue"
          value={formatCurrency(revenue)}
          icon="fa-indian-rupee-sign"
          tone="emerald"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(outstanding)}
          icon="fa-clock"
          tone="amber"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Quotations"
          value={quotations.length}
          icon="fa-briefcase"
          tone="slate"
        />
        <StatCard
          label="Proforma"
          value={proformaInvoices.length}
          icon="fa-life-ring"
          tone="slate"
        />
        <StatCard
          label="Challans"
          value={deliveryChallans.length}
          icon="fa-truck-loading"
          tone="slate"
        />
        <StatCard
          label="Overdue"
          value={formatCurrency(overdueAmount)}
          icon="fa-triangle-exclamation"
          tone="rose"
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-500">Create documents or update setup data.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickAction href="/dashboard/bookkeeping/invoices/new" icon="fa-file-invoice" label="Invoice" />
            <QuickAction href="/dashboard/bookkeeping/quotations/new" icon="fa-briefcase" label="Quotation" />
            <QuickAction href="/dashboard/bookkeeping/proforma-invoices/new" icon="fa-life-ring" label="Proforma" />
            <QuickAction href="/dashboard/bookkeeping/delivery-challans/new" icon="fa-truck-loading" label="Challan" />
            <QuickAction href="/dashboard/bookkeeping/customers" icon="fa-users" label="Customer" />
            <QuickAction href="/dashboard/bookkeeping/business-profile" icon="fa-building" label="Profile" />
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">
          Loading billing dashboard...
        </div>
      ) : recentDocuments.length === 0 ? (
        <EmptyState
          title="No billing activity yet"
          description="Create customers and billing documents to populate dashboard totals and recent activity."
          actionHref="/dashboard/bookkeeping/invoices/new"
          actionLabel="Create Invoice"
        />
      ) : (
        <TableShell>
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDocuments.map((document) => {
                const config = documentConfigs[document.type];

                return (
                  <tr key={document.id}>
                    <td className="px-4 py-4 font-black text-slate-950">{document.number}</td>
                    <td className="px-4 py-4 text-slate-600">{config.singular}</td>
                    <td className="px-4 py-4 text-slate-700">{document.customerName || "-"}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDisplayDate(document.documentDate)}
                    </td>
                    <td className="px-4 py-4">
                      <AmountCell value={document.totals.grandTotal} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={document.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <Link
                          href={`${config.route}/${document.id}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:text-blue-800"
                          title="Open document"
                        >
                          <i className="fas fa-arrow-up-right-from-square" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-black text-slate-700 hover:border-blue-200 hover:text-blue-800"
    >
      <i className={`fas ${icon}`} />
      {label}
    </Link>
  );
}
