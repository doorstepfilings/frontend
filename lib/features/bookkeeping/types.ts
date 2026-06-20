export type BookkeepingDocumentType =
  | "quotations"
  | "proforma-invoices"
  | "invoices"
  | "delivery-challans";

export type TaxCalculationMode = "inclusive" | "exclusive";
export type DocumentStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "converted"
  | "cancelled"
  | "paid"
  | "partial"
  | "overdue";
export type PaymentMode = "cash" | "bank-transfer" | "upi" | "card" | "cheque" | "other";

export type Customer = {
  id: string;
  customerName: string;
  businessName: string;
  gstin: string;
  panNumber: string;
  email: string;
  mobile: string;
  billingAddress: string;
  shippingAddress: string;
  city: string;
  state: string;
  stateCode: string;
  country: string;
  pincode: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentLineItem = {
  id: string;
  name: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxRate: number;
};

export type DocumentTotals = {
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  taxTotal: number;
  grandTotal: number;
};

export type PaymentDetails = {
  paidAmount: number;
  paymentMode: PaymentMode;
  paymentDate: string;
  transactionReference: string;
  paymentNotes: string;
};

export type DeliveryDetails = {
  dispatchDate: string;
  deliveryAddress: string;
  vehicleNumber: string;
  transportName: string;
};

export type BookkeepingDocument = {
  id: string;
  type: BookkeepingDocumentType;
  number: string;
  customerId: string;
  customerName: string;
  documentDate: string;
  dueDate: string;
  validUntil: string;
  placeOfSupply: string;
  taxCalculation: TaxCalculationMode;
  status: DocumentStatus;
  items: DocumentLineItem[];
  extraDiscount: number;
  notes: string;
  terms: string;
  totals: DocumentTotals;
  payment?: PaymentDetails;
  delivery?: DeliveryDetails;
  createdAt: string;
  updatedAt: string;
};

export type DocumentConfig = {
  type: BookkeepingDocumentType;
  singular: string;
  plural: string;
  route: string;
  numberLabel: string;
  defaultPrefix: string;
  primaryDateLabel: string;
  secondaryDateLabel: string;
  emptyTitle: string;
  emptyDescription: string;
};

export const documentConfigs: Record<BookkeepingDocumentType, DocumentConfig> = {
  quotations: {
    type: "quotations",
    singular: "Quotation",
    plural: "Quotations",
    route: "/dashboard/bookkeeping/quotations",
    numberLabel: "Quotation Number",
    defaultPrefix: "QUO",
    primaryDateLabel: "Quotation Date",
    secondaryDateLabel: "Valid Until",
    emptyTitle: "No quotations yet",
    emptyDescription: "Create the first quotation and keep pricing, tax, and terms ready.",
  },
  "proforma-invoices": {
    type: "proforma-invoices",
    singular: "Proforma Invoice",
    plural: "Proforma Invoices",
    route: "/dashboard/bookkeeping/proforma-invoices",
    numberLabel: "Proforma Number",
    defaultPrefix: "PI",
    primaryDateLabel: "Proforma Date",
    secondaryDateLabel: "Valid Until",
    emptyTitle: "No proforma invoices yet",
    emptyDescription: "Create a proforma before converting confirmed work into invoices.",
  },
  invoices: {
    type: "invoices",
    singular: "Invoice",
    plural: "Invoices",
    route: "/dashboard/bookkeeping/invoices",
    numberLabel: "Invoice Number",
    defaultPrefix: "INV",
    primaryDateLabel: "Invoice Date",
    secondaryDateLabel: "Due Date",
    emptyTitle: "No invoices yet",
    emptyDescription: "Create invoices, track payment status, and prepare receipts.",
  },
  "delivery-challans": {
    type: "delivery-challans",
    singular: "Delivery Challan",
    plural: "Delivery Challans",
    route: "/dashboard/bookkeeping/delivery-challans",
    numberLabel: "Challan Number",
    defaultPrefix: "DC",
    primaryDateLabel: "Challan Date",
    secondaryDateLabel: "Dispatch Date",
    emptyTitle: "No delivery challans yet",
    emptyDescription: "Create dispatch documents with delivery address and transport details.",
  },
};

export const customerStorageKey = "dsf_bookkeeping_customers";
export const documentStorageKey = "dsf_bookkeeping_documents";

