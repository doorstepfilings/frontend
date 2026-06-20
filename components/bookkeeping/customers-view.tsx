"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  BookkeepingPageHeader,
  EmptyState,
  FieldLabel,
  StatCard,
  TableShell,
  inputClass,
  textareaClass,
} from "@/components/bookkeeping/bookkeeping-ui";
import {
  createDefaultCustomer,
  getCustomerDisplayName,
} from "@/lib/features/bookkeeping/helpers";
import { deleteCustomer, readCustomers, upsertCustomer } from "@/lib/features/bookkeeping/storage";
import type { Customer } from "@/lib/features/bookkeeping/types";

const customerSearchFields: Array<keyof Customer> = [
  "customerName",
  "businessName",
  "email",
  "mobile",
  "gstin",
];

function validateCustomer(customer: Customer) {
  const errors: Partial<Record<keyof Customer, string>> = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!customer.customerName.trim()) errors.customerName = "Customer name is required";
  if (customer.email && !emailPattern.test(customer.email)) errors.email = "Invalid email";
  if (customer.mobile && customer.mobile.replace(/\D/g, "").length < 10) {
    errors.mobile = "Invalid mobile";
  }
  if (!customer.billingAddress.trim()) errors.billingAddress = "Billing address is required";
  if (!customer.city.trim()) errors.city = "City is required";
  if (!customer.state.trim()) errors.state = "State is required";
  if (!customer.country.trim()) errors.country = "Country is required";
  if (!customer.pincode.trim()) errors.pincode = "Pincode is required";

  return errors;
}

export function CustomersView({ initialCustomerId }: { initialCustomerId?: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<Customer>(() => createDefaultCustomer());
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedCustomers = readCustomers();
      const selectedCustomer = initialCustomerId
        ? savedCustomers.find((customer) => customer.id === initialCustomerId)
        : undefined;

      setCustomers(savedCustomers);
      if (selectedCustomer) {
        setActiveCustomer(selectedCustomer);
      }
      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialCustomerId]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) =>
      customerSearchFields.some((field) =>
        String(customer[field] ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [customers, search]);

  const updateCustomer = <K extends keyof Customer>(field: K, value: Customer[K]) => {
    setActiveCustomer((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const resetForm = () => {
    setActiveCustomer(createDefaultCustomer());
    setErrors({});
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateCustomer(activeCustomer);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the customer details.");
      return;
    }

    const nextCustomers = upsertCustomer(activeCustomer);
    setCustomers(nextCustomers);
    toast.success("Customer saved.");
    resetForm();
  };

  const handleDelete = (customerId: string) => {
    const nextCustomers = deleteCustomer(customerId);
    setCustomers(nextCustomers);
    if (activeCustomer.id === customerId) resetForm();
    toast.success("Customer deleted.");
  };

  return (
    <div className="space-y-6">
      <BookkeepingPageHeader
        title="Customers"
        description="Manage customer details used across quotations, proforma invoices, invoices, and delivery challans."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Customers" value={customers.length} icon="fa-users" />
        <StatCard
          label="GST Customers"
          value={customers.filter((customer) => customer.gstin).length}
          icon="fa-receipt"
          tone="emerald"
        />
        <StatCard
          label="With Email"
          value={customers.filter((customer) => customer.email).length}
          icon="fa-envelope"
          tone="amber"
        />
        <StatCard
          label="With Shipping"
          value={customers.filter((customer) => customer.shippingAddress).length}
          icon="fa-truck"
          tone="slate"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customers"
                className={`${inputClass} pl-9`}
              />
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:border-blue-200 hover:text-blue-800"
            >
              <i className="fas fa-plus" />
              New Customer
            </button>
          </div>

          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">
              Loading customers...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <EmptyState
              title="No customers found"
              description="Add customer details here so billing documents can reuse names, GSTIN, addresses, and contact information."
            />
          ) : (
            <TableShell>
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">GSTIN</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="align-top">
                      <td className="px-4 py-4">
                        <p className="font-black text-slate-950">
                          {getCustomerDisplayName(customer)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {customer.customerName}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        <p>{customer.mobile || "-"}</p>
                        <p className="mt-1">{customer.email || "-"}</p>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-700">
                        {customer.gstin || "-"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {customer.city || "-"}, {customer.state || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveCustomer(customer)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:text-blue-800"
                            title="Edit customer"
                          >
                            <i className="fas fa-pen" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(customer.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-100 text-rose-600 hover:bg-rose-50"
                            title="Delete customer"
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
        </section>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-black text-slate-950">
              {customers.some((customer) => customer.id === activeCustomer.id)
                ? "Edit Customer"
                : "New Customer"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Customer master details</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <InputField
              label="Customer Name"
              required
              value={activeCustomer.customerName}
              error={errors.customerName}
              onChange={(value) => updateCustomer("customerName", value)}
            />
            <InputField
              label="Business Name"
              value={activeCustomer.businessName}
              onChange={(value) => updateCustomer("businessName", value)}
            />
            <InputField
              label="Email"
              type="email"
              value={activeCustomer.email}
              error={errors.email}
              onChange={(value) => updateCustomer("email", value)}
            />
            <InputField
              label="Mobile Number"
              value={activeCustomer.mobile}
              error={errors.mobile}
              onChange={(value) => updateCustomer("mobile", value.replace(/\D/g, "").slice(0, 10))}
            />
            <InputField
              label="GSTIN"
              value={activeCustomer.gstin}
              onChange={(value) => updateCustomer("gstin", value.toUpperCase())}
            />
            <InputField
              label="PAN Number"
              value={activeCustomer.panNumber}
              onChange={(value) => updateCustomer("panNumber", value.toUpperCase())}
            />
            <TextareaField
              label="Billing Address"
              required
              value={activeCustomer.billingAddress}
              error={errors.billingAddress}
              onChange={(value) => updateCustomer("billingAddress", value)}
            />
            <TextareaField
              label="Shipping Address"
              value={activeCustomer.shippingAddress}
              onChange={(value) => updateCustomer("shippingAddress", value)}
            />
            <InputField
              label="City"
              required
              value={activeCustomer.city}
              error={errors.city}
              onChange={(value) => updateCustomer("city", value)}
            />
            <InputField
              label="State"
              required
              value={activeCustomer.state}
              error={errors.state}
              onChange={(value) => updateCustomer("state", value)}
            />
            <InputField
              label="State Code"
              value={activeCustomer.stateCode}
              onChange={(value) => updateCustomer("stateCode", value.replace(/\D/g, "").slice(0, 2))}
            />
            <InputField
              label="Country"
              required
              value={activeCustomer.country}
              error={errors.country}
              onChange={(value) => updateCustomer("country", value)}
            />
            <InputField
              label="Pincode"
              required
              value={activeCustomer.pincode}
              error={errors.pincode}
              onChange={(value) => updateCustomer("pincode", value.replace(/\D/g, "").slice(0, 6))}
            />
            <TextareaField
              label="Notes"
              value={activeCustomer.notes}
              onChange={(value) => updateCustomer("notes", value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 text-sm font-black text-white hover:bg-blue-800"
            >
              <i className="fas fa-save" />
              Save Customer
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-600 hover:text-slate-950"
              title="Clear form"
            >
              <i className="fas fa-rotate-left" />
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <div className="sm:col-span-2 xl:col-span-1">
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
