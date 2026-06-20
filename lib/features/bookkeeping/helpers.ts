import {
  type BookkeepingDocument,
  type BookkeepingDocumentType,
  type Customer,
  type DocumentLineItem,
  type DocumentTotals,
  documentConfigs,
} from "@/lib/features/bookkeeping/types";

export const taxRateOptions = [0, 5, 12, 18, 28];
export const unitOptions = ["Nos", "PCS", "KG", "HR", "DAY", "MONTH", "SERVICE"];

export function createBookkeepingId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getTodayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDisplayDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function createEmptyLineItem(): DocumentLineItem {
  return {
    id: createBookkeepingId("item"),
    name: "",
    description: "",
    hsnSac: "",
    quantity: 1,
    unit: "Nos",
    rate: 0,
    discount: 0,
    taxRate: 18,
  };
}

export function calculateDocumentTotals(
  items: DocumentLineItem[],
  extraDiscount = 0,
): DocumentTotals {
  const subtotal = items.reduce((sum, item) => {
    return sum + Math.max(0, item.quantity) * Math.max(0, item.rate);
  }, 0);

  const itemDiscount = items.reduce((sum, item) => {
    return sum + Math.max(0, item.discount);
  }, 0);
  const discountTotal = itemDiscount + Math.max(0, extraDiscount);
  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const taxTotal = items.reduce((sum, item) => {
    const lineSubtotal = Math.max(0, item.quantity) * Math.max(0, item.rate);
    const lineDiscount = Math.min(Math.max(0, item.discount), lineSubtotal);
    const lineTaxable = Math.max(0, lineSubtotal - lineDiscount);
    return sum + (lineTaxable * Math.max(0, item.taxRate)) / 100;
  }, 0);

  return {
    subtotal,
    discountTotal,
    taxableAmount,
    taxTotal,
    grandTotal: taxableAmount + taxTotal,
  };
}

export function createDocumentNumber(type: BookkeepingDocumentType, count: number) {
  const config = documentConfigs[type];
  return `${config.defaultPrefix}-${String(count + 1).padStart(4, "0")}`;
}

export function createDefaultDocument(
  type: BookkeepingDocumentType,
  existingCount: number,
): BookkeepingDocument {
  const today = getTodayInputDate();
  const items = [createEmptyLineItem()];

  return {
    id: createBookkeepingId(type),
    type,
    number: createDocumentNumber(type, existingCount),
    customerId: "",
    customerName: "",
    documentDate: today,
    dueDate: today,
    validUntil: today,
    placeOfSupply: "",
    taxCalculation: "exclusive",
    status: "draft",
    items,
    extraDiscount: 0,
    notes: "",
    terms: "",
    totals: calculateDocumentTotals(items, 0),
    payment:
      type === "invoices"
        ? {
            paidAmount: 0,
            paymentMode: "upi",
            paymentDate: today,
            transactionReference: "",
            paymentNotes: "",
          }
        : undefined,
    delivery:
      type === "delivery-challans"
        ? {
            dispatchDate: today,
            deliveryAddress: "",
            vehicleNumber: "",
            transportName: "",
          }
        : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createDefaultCustomer(): Customer {
  const now = new Date().toISOString();

  return {
    id: createBookkeepingId("customer"),
    customerName: "",
    businessName: "",
    gstin: "",
    panNumber: "",
    email: "",
    mobile: "",
    billingAddress: "",
    shippingAddress: "",
    city: "",
    state: "",
    stateCode: "",
    country: "India",
    pincode: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function getCustomerDisplayName(customer: Customer) {
  return customer.businessName || customer.customerName || "Unnamed customer";
}

export function getDocumentPrimaryDate(document: BookkeepingDocument) {
  return document.documentDate;
}

export function getDocumentSecondaryDate(document: BookkeepingDocument) {
  return document.type === "invoices" ? document.dueDate : document.validUntil;
}

