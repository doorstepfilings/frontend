export type CrmCustomerType =
  | "salaried"
  | "business_owner"
  | "professional"
  | "freelancer"
  | "company_llp";

export type CrmInquiryStage =
  | "new_inquiry"
  | "profile_verification"
  | "document_verification"
  | "assigned_to_accountant"
  | "service_identification"
  | "quotation_preparation"
  | "quotation_sent"
  | "payment_received"
  | "work_started"
  | "review"
  | "completed"
  | "delivered"
  | "closed";

export type CrmQuotationStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired";

export type CrmPaymentStatus =
  | "unpaid"
  | "partial"
  | "paid"
  | "refunded";

export type CrmDocumentType =
  | "pan_card"
  | "aadhaar_card"
  | "gst_certificate"
  | "form_16"
  | "financial_statements"
  | "other_supporting_document";

export type CrmProfileData = Record<string, string | number | boolean>;

export type CrmInquiryDocumentInput = {
  type: CrmDocumentType | "";
  file: File | null;
  notes: string;
};

export type CrmInquiryFormState = {
  fullName: string;
  mobileNumber: string;
  email: string;
  city: string;
  state: string;
  customerType: CrmCustomerType | "";
  profileData: CrmProfileData;
  documents: CrmInquiryDocumentInput[];
};

type CrmOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

export type CrmProfileField = {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  helpText?: string;
};

export const CRM_CUSTOMER_TYPE_OPTIONS: CrmOption<CrmCustomerType>[] = [
  {
    value: "salaried",
    label: "Salaried Individual",
    description: "Employees with salary income, Form 16, and personal tax needs.",
  },
  {
    value: "business_owner",
    label: "Business Owner",
    description: "Owners who may need GST, accounting, registrations, and compliance.",
  },
  {
    value: "professional",
    label: "Professional",
    description: "Doctors, consultants, architects, and similar licensed practitioners.",
  },
  {
    value: "freelancer",
    label: "Freelancer",
    description: "Independent workers handling domestic or international clients.",
  },
  {
    value: "company_llp",
    label: "Company / LLP",
    description: "Registered entities with compliance, filing, and governance requirements.",
  },
];

export const CRM_DOCUMENT_TYPE_OPTIONS: CrmOption<CrmDocumentType>[] = [
  { value: "pan_card", label: "PAN Card" },
  { value: "aadhaar_card", label: "Aadhaar Card" },
  { value: "gst_certificate", label: "GST Certificate" },
  { value: "form_16", label: "Form 16" },
  { value: "financial_statements", label: "Financial Statements" },
  { value: "other_supporting_document", label: "Other Supporting Document" },
];

export const CRM_STAGE_OPTIONS: CrmOption<CrmInquiryStage>[] = [
  { value: "new_inquiry", label: "New Inquiry" },
  { value: "profile_verification", label: "Profile Verification" },
  { value: "document_verification", label: "Document Verification" },
  { value: "assigned_to_accountant", label: "Assigned to Accountant" },
  { value: "service_identification", label: "Service Identification" },
  { value: "quotation_preparation", label: "Quotation Preparation" },
  { value: "quotation_sent", label: "Quotation Sent" },
  { value: "payment_received", label: "Payment Received" },
  { value: "work_started", label: "Work Started" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" },
  { value: "delivered", label: "Delivered" },
  { value: "closed", label: "Closed" },
];

export const CRM_PAYMENT_STATUS_OPTIONS: CrmOption<CrmPaymentStatus>[] = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
];

export const CRM_QUOTATION_STATUS_OPTIONS: CrmOption<CrmQuotationStatus>[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

export const CRM_STAGE_META: Record<
  CrmInquiryStage,
  { badge: string; icon: string }
> = {
  new_inquiry: {
    badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
    icon: "fa-sparkles",
  },
  profile_verification: {
    badge: "bg-sky-50 text-sky-700 border-sky-100",
    icon: "fa-id-card",
  },
  document_verification: {
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    icon: "fa-folder-open",
  },
  assigned_to_accountant: {
    badge: "bg-cyan-50 text-cyan-700 border-cyan-100",
    icon: "fa-user-check",
  },
  service_identification: {
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    icon: "fa-compass-drafting",
  },
  quotation_preparation: {
    badge: "bg-violet-50 text-violet-700 border-violet-100",
    icon: "fa-file-invoice-dollar",
  },
  quotation_sent: {
    badge: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
    icon: "fa-paper-plane",
  },
  payment_received: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: "fa-wallet",
  },
  work_started: {
    badge: "bg-teal-50 text-teal-700 border-teal-100",
    icon: "fa-play",
  },
  review: {
    badge: "bg-orange-50 text-orange-700 border-orange-100",
    icon: "fa-magnifying-glass-chart",
  },
  completed: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: "fa-check-double",
  },
  delivered: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    icon: "fa-box-open",
  },
  closed: {
    badge: "bg-slate-200 text-slate-700 border-slate-300",
    icon: "fa-lock",
  },
};

export const CRM_PROFILE_FIELDS: Record<CrmCustomerType, CrmProfileField[]> = {
  salaried: [
    { key: "employerName", label: "Employer Name", type: "text" },
    {
      key: "annualSalary",
      label: "Annual Salary",
      type: "number",
      placeholder: "e.g. 850000",
    },
    {
      key: "form16Available",
      label: "Form 16 Available",
      type: "select",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
    {
      key: "otherIncomeSources",
      label: "Other Income Sources",
      type: "textarea",
      placeholder: "Describe rental, interest, freelance, or other income if applicable.",
    },
    {
      key: "panNumber",
      label: "PAN Number",
      type: "text",
      placeholder: "ABCDE1234F",
      helpText: "Optional. We will validate the format if you provide it.",
    },
  ],
  business_owner: [
    { key: "businessName", label: "Business Name", type: "text" },
    { key: "businessType", label: "Business Type", type: "text" },
    {
      key: "gstNumber",
      label: "GST Number",
      type: "text",
      placeholder: "22AAAAA0000A1Z5",
      helpText: "Optional. Add it if your business is already registered.",
    },
    {
      key: "annualTurnover",
      label: "Annual Turnover",
      type: "number",
      placeholder: "e.g. 2500000",
    },
    {
      key: "employeeCount",
      label: "Employee Count",
      type: "number",
      placeholder: "e.g. 12",
    },
    {
      key: "businessAddress",
      label: "Business Address",
      type: "textarea",
      placeholder: "Registered office or operating address",
    },
  ],
  professional: [
    { key: "professionType", label: "Profession Type", type: "text" },
    {
      key: "annualIncome",
      label: "Annual Income",
      type: "number",
      placeholder: "e.g. 1800000",
    },
    {
      key: "gstApplicable",
      label: "GST Applicable",
      type: "select",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
    {
      key: "panNumber",
      label: "PAN Number",
      type: "text",
      placeholder: "ABCDE1234F",
      helpText: "Optional. We will validate the format if you provide it.",
    },
  ],
  freelancer: [
    { key: "workCategory", label: "Work Category", type: "text" },
    {
      key: "annualIncome",
      label: "Annual Income",
      type: "number",
      placeholder: "e.g. 950000",
    },
    {
      key: "clientCoverage",
      label: "Domestic / International Clients",
      type: "select",
      options: [
        { value: "domestic", label: "Domestic" },
        { value: "international", label: "International" },
        { value: "both", label: "Both" },
      ],
    },
    {
      key: "panNumber",
      label: "PAN Number",
      type: "text",
      placeholder: "ABCDE1234F",
      helpText: "Optional. We will validate the format if you provide it.",
    },
  ],
  company_llp: [
    { key: "companyName", label: "Company / LLP Name", type: "text" },
    { key: "cinOrLlpin", label: "CIN / LLPIN", type: "text" },
    {
      key: "gstNumber",
      label: "GST Number",
      type: "text",
      placeholder: "22AAAAA0000A1Z5",
      helpText: "Optional. Add it if the entity already has GST registration.",
    },
    {
      key: "annualTurnover",
      label: "Annual Turnover",
      type: "number",
      placeholder: "e.g. 4500000",
    },
    { key: "authorizedPerson", label: "Authorized Person", type: "text" },
  ],
};

const CUSTOMER_TYPE_LABELS: Record<CrmCustomerType, string> = {
  salaried: "Salaried Individual",
  business_owner: "Business Owner",
  professional: "Professional",
  freelancer: "Freelancer",
  company_llp: "Company / LLP",
};

const DOCUMENT_TYPE_LABELS: Record<CrmDocumentType, string> = {
  pan_card: "PAN Card",
  aadhaar_card: "Aadhaar Card",
  gst_certificate: "GST Certificate",
  form_16: "Form 16",
  financial_statements: "Financial Statements",
  other_supporting_document: "Other Supporting Document",
};

const PAYMENT_STATUS_LABELS: Record<CrmPaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  refunded: "Refunded",
};

const QUOTATION_STATUS_LABELS: Record<CrmQuotationStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
};

export type CrmPersonRecord = {
  id: number;
  name: string;
  email?: string | null;
  mobile_number?: string | null;
};

export type CrmCustomerRecord = {
  id: number;
  full_name: string;
  mobile_number: string;
  email?: string | null;
  city?: string | null;
  state?: string | null;
};

export type CrmInquiryDocumentRecord = {
  id: number;
  document_type: string;
  file_name: string;
  file_path?: string | null;
  file_url?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  notes?: string | null;
  uploaded_by?: CrmPersonRecord | null;
  created_at?: string | null;
};

export type CrmInquiryNoteRecord = {
  id: number;
  note: string;
  author?: CrmPersonRecord | null;
  created_at?: string | null;
};

export type CrmServiceRecommendationRecord = {
  id: number;
  notes?: string | null;
  quoted_amount?: number | string | null;
  service?: {
    id: number;
    name?: string | null;
    category?: { name?: string | null } | null;
  } | null;
  recommended_by?: CrmPersonRecord | null;
  created_at?: string | null;
};

export type CrmQuotationRecord = {
  id: number;
  quotation_number?: string | null;
  status: string;
  subtotal?: number | string | null;
  tax_amount?: number | string | null;
  total_amount?: number | string | null;
  notes?: string | null;
  created_at?: string | null;
  sent_at?: string | null;
};

export type CrmInquiryPaymentRecord = {
  id: number;
  amount?: number | string | null;
  payment_status: string;
  payment_method?: string | null;
  reference_number?: string | null;
  received_at?: string | null;
  created_at?: string | null;
};

export type CrmInquiryRecord = {
  id: number;
  inquiry_number?: string | null;
  current_stage: string;
  customer_type: string;
  profile_verified?: boolean;
  documents_verified?: boolean;
  quotation_status?: string | null;
  payment_status?: string | null;
  service_identification_notes?: string | null;
  profile_data: Record<string, unknown>;
  customer?: CrmCustomerRecord | null;
  assigned_accountant?: CrmPersonRecord | null;
  documents: CrmInquiryDocumentRecord[];
  notes: CrmInquiryNoteRecord[];
  recommendations: CrmServiceRecommendationRecord[];
  quotations: CrmQuotationRecord[];
  payments: CrmInquiryPaymentRecord[];
  created_at?: string | null;
  updated_at?: string | null;
};

function normalizePersonRecord(person: any): CrmPersonRecord | null {
  if (!person || typeof person !== "object") {
    return null;
  }

  return {
    id: Number(person.id ?? 0),
    name: String(person.name ?? ""),
    email: person.email ?? null,
    mobile_number: person.mobile_number ?? person.mobileNumber ?? null,
  };
}

export function normalizeCrmList(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: unknown[] }).data;
  }

  return [];
}

export function normalizeCrmInquiryRecord(inquiry: any): CrmInquiryRecord {
  const documents = Array.isArray(inquiry?.documents)
    ? inquiry.documents
    : Array.isArray(inquiry?.crm_inquiry_documents)
      ? inquiry.crm_inquiry_documents
      : [];
  const notes = Array.isArray(inquiry?.notes)
    ? inquiry.notes
    : Array.isArray(inquiry?.crm_inquiry_notes)
      ? inquiry.crm_inquiry_notes
      : [];
  const recommendations = Array.isArray(inquiry?.recommendations)
    ? inquiry.recommendations
    : Array.isArray(inquiry?.crm_inquiry_service_recommendations)
      ? inquiry.crm_inquiry_service_recommendations
      : [];
  const quotations = Array.isArray(inquiry?.quotations)
    ? inquiry.quotations
    : Array.isArray(inquiry?.crm_quotations)
      ? inquiry.crm_quotations
      : [];
  const payments = Array.isArray(inquiry?.payments)
    ? inquiry.payments
    : Array.isArray(inquiry?.crm_inquiry_payments)
      ? inquiry.crm_inquiry_payments
      : [];

  return {
    id: Number(inquiry?.id ?? 0),
    inquiry_number: inquiry?.inquiry_number ?? inquiry?.inquiryNumber ?? null,
    current_stage: String(
      inquiry?.current_stage ?? inquiry?.currentStage ?? "new_inquiry",
    ),
    customer_type: String(
      inquiry?.customer_type ?? inquiry?.customerType ?? "salaried",
    ),
    profile_verified:
      inquiry?.profile_verified ?? inquiry?.profileVerified ?? false,
    documents_verified:
      inquiry?.documents_verified ?? inquiry?.documentsVerified ?? false,
    quotation_status:
      inquiry?.quotation_status ?? inquiry?.quotationStatus ?? null,
    payment_status: inquiry?.payment_status ?? inquiry?.paymentStatus ?? null,
    service_identification_notes:
      inquiry?.service_identification_notes ??
      inquiry?.serviceIdentificationNotes ??
      null,
    profile_data:
      inquiry?.profile_data && typeof inquiry.profile_data === "object"
        ? inquiry.profile_data
        : inquiry?.profileData && typeof inquiry.profileData === "object"
          ? inquiry.profileData
          : {},
    customer: inquiry?.customer
      ? {
          id: Number(inquiry.customer.id ?? 0),
          full_name:
            inquiry.customer.full_name ?? inquiry.customer.fullName ?? "",
          mobile_number:
            inquiry.customer.mobile_number ??
            inquiry.customer.mobileNumber ??
            "",
          email: inquiry.customer.email ?? null,
          city: inquiry.customer.city ?? null,
          state: inquiry.customer.state ?? null,
        }
      : null,
    assigned_accountant: normalizePersonRecord(
      inquiry?.assigned_accountant ?? inquiry?.assignedAccountant ?? null,
    ),
    documents: documents.map((document: any) => ({
      id: Number(document.id ?? 0),
      document_type:
        document.document_type ?? document.documentType ?? "other_supporting_document",
      file_name: document.file_name ?? document.fileName ?? "Untitled document",
      file_path: document.file_path ?? document.filePath ?? null,
      file_url: document.file_url ?? document.fileUrl ?? null,
      mime_type: document.mime_type ?? document.mimeType ?? null,
      file_size: document.file_size ?? document.fileSize ?? null,
      notes: document.notes ?? null,
      uploaded_by: normalizePersonRecord(
        document.uploaded_by ?? document.uploadedBy ?? null,
      ),
      created_at: document.created_at ?? document.createdAt ?? null,
    })),
    notes: notes.map((note: any) => ({
      id: Number(note.id ?? 0),
      note: String(note.note ?? ""),
      author: normalizePersonRecord(note.author ?? null),
      created_at: note.created_at ?? note.createdAt ?? null,
    })),
    recommendations: recommendations.map((item: any) => ({
      id: Number(item.id ?? 0),
      notes: item.notes ?? null,
      quoted_amount: item.quoted_amount ?? item.quotedAmount ?? null,
      service: item.service
        ? {
            id: Number(item.service.id ?? 0),
            name: item.service.name ?? null,
            category: item.service.category ?? null,
          }
        : null,
      recommended_by: normalizePersonRecord(
        item.recommended_by ?? item.recommendedBy ?? null,
      ),
      created_at: item.created_at ?? item.createdAt ?? null,
    })),
    quotations: quotations.map((quotation: any) => ({
      id: Number(quotation.id ?? 0),
      quotation_number:
        quotation.quotation_number ?? quotation.quotationNumber ?? null,
      status: String(quotation.status ?? "draft"),
      subtotal: quotation.subtotal ?? null,
      tax_amount: quotation.tax_amount ?? quotation.taxAmount ?? null,
      total_amount: quotation.total_amount ?? quotation.totalAmount ?? null,
      notes: quotation.notes ?? null,
      created_at: quotation.created_at ?? quotation.createdAt ?? null,
      sent_at: quotation.sent_at ?? quotation.sentAt ?? null,
    })),
    payments: payments.map((payment: any) => ({
      id: Number(payment.id ?? 0),
      amount: payment.amount ?? null,
      payment_status:
        payment.payment_status ?? payment.paymentStatus ?? "unpaid",
      payment_method:
        payment.payment_method ?? payment.paymentMethod ?? null,
      reference_number:
        payment.reference_number ?? payment.referenceNumber ?? null,
      received_at: payment.received_at ?? payment.receivedAt ?? null,
      created_at: payment.created_at ?? payment.createdAt ?? null,
    })),
    created_at: inquiry?.created_at ?? inquiry?.createdAt ?? null,
    updated_at: inquiry?.updated_at ?? inquiry?.updatedAt ?? null,
  };
}

export function getCrmCustomerTypeLabel(value?: string | null) {
  if (!value) {
    return "Not classified";
  }

  return CUSTOMER_TYPE_LABELS[value as CrmCustomerType] ?? value;
}

export function getCrmDocumentTypeLabel(value?: string | null) {
  if (!value) {
    return "Supporting Document";
  }

  return DOCUMENT_TYPE_LABELS[value as CrmDocumentType] ?? value;
}

export function getCrmStageLabel(value?: string | null) {
  if (!value) {
    return "Stage Pending";
  }

  const match = CRM_STAGE_OPTIONS.find((item) => item.value === value);
  return match?.label ?? value;
}

export function getCrmProfileFieldLabel(customerType: string, key: string) {
  const fields = CRM_PROFILE_FIELDS[customerType as CrmCustomerType] ?? [];
  const match = fields.find((field) => field.key === key);
  return match?.label ?? key;
}

export function getCrmPaymentStatusLabel(value?: string | null) {
  if (!value) {
    return "Unpaid";
  }

  return PAYMENT_STATUS_LABELS[value as CrmPaymentStatus] ?? value;
}

export function getCrmQuotationStatusLabel(value?: string | null) {
  if (!value) {
    return "Draft";
  }

  return QUOTATION_STATUS_LABELS[value as CrmQuotationStatus] ?? value;
}

export function formatCurrency(value?: number | string | null) {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : null;

  if (amount === null || Number.isNaN(amount)) {
    return "Rs 0";
  }

  return `Rs ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export const CRM_INITIAL_FORM_STATE: CrmInquiryFormState = {
  fullName: "",
  mobileNumber: "",
  email: "",
  city: "",
  state: "",
  customerType: "",
  profileData: {},
  documents: [{ type: "", file: null, notes: "" }],
};
