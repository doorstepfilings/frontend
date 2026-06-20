export type TaxCalculation = "inclusive" | "exclusive";
export type PaperSize = "A4" | "A5" | "Thermal 80mm";

export type BusinessProfileFormValues = {
  businessName: string;
  legalName: string;
  businessType: string;
  industryType: string;
  panNumber: string;
  email: string;
  mobile: string;
  website: string;
  gstRegistered: boolean;
  gstin: string;
  gstState: string;
  stateCode: string;
  taxCalculation: TaxCalculation;
  defaultTaxRate: string;
  hsnSacEnabled: boolean;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  logo: string;
  letterhead: string;
  signature: string;
  stamp: string;
  brandColor: string;
  showBankDetails: boolean;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  upiQrCode: string;
  financialYear: string;
  invoicePrefix: string;
  invoiceStartNo: number;
  quotationPrefix: string;
  quotationStartNo: number;
  proformaPrefix: string;
  proformaStartNo: number;
  receiptPrefix: string;
  resetNumberYearly: boolean;
  invoiceTerms: string;
  quotationTerms: string;
  proformaTerms: string;
  footerNote: string;
  paperSize: PaperSize;
  showLogo: boolean;
  showGstin: boolean;
  showPan: boolean;
  showBankDetailsPdf: boolean;
  showSignature: boolean;
  showAmountWords: boolean;
};

export type BusinessProfileErrors = Partial<
  Record<keyof BusinessProfileFormValues, string>
>;

export const BUSINESS_PROFILE_STORAGE_KEY = "dsf_business_profile";

export const defaultBusinessProfileValues: BusinessProfileFormValues = {
  businessName: "",
  legalName: "",
  businessType: "",
  industryType: "",
  panNumber: "",
  email: "",
  mobile: "",
  website: "",

  gstRegistered: false,
  gstin: "",
  gstState: "",
  stateCode: "",
  taxCalculation: "exclusive",
  defaultTaxRate: "18",
  hsnSacEnabled: true,

  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",

  logo: "",
  letterhead: "",
  signature: "",
  stamp: "",
  brandColor: "#2563eb",

  showBankDetails: true,
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  upiId: "",
  upiQrCode: "",

  financialYear: "2026-27",
  invoicePrefix: "INV",
  invoiceStartNo: 1,
  quotationPrefix: "QUO",
  quotationStartNo: 1,
  proformaPrefix: "PI",
  proformaStartNo: 1,
  receiptPrefix: "REC",
  resetNumberYearly: true,

  invoiceTerms: "",
  quotationTerms: "",
  proformaTerms: "",
  footerNote: "",

  paperSize: "A4",
  showLogo: true,
  showGstin: true,
  showPan: true,
  showBankDetailsPdf: true,
  showSignature: true,
  showAmountWords: true,
};

export const businessTypeOptions = [
  "Proprietorship",
  "Partnership",
  "LLP",
  "Private Limited",
  "Public Limited",
  "Trust / NGO",
  "Other",
];

export const industryTypeOptions = [
  "Accounting",
  "Consulting",
  "E-commerce",
  "Education",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Services",
  "Technology",
  "Other",
];

export const taxRateOptions = ["0", "5", "12", "18", "28"];
export const paperSizeOptions: PaperSize[] = ["A4", "A5", "Thermal 80mm"];

function isBlank(value: string) {
  return !value.trim();
}

function isPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0;
}

export function normalizeBusinessProfile(
  value: Partial<BusinessProfileFormValues> | null | undefined,
): BusinessProfileFormValues {
  return {
    ...defaultBusinessProfileValues,
    ...value,
    invoiceStartNo: Number(value?.invoiceStartNo ?? defaultBusinessProfileValues.invoiceStartNo),
    quotationStartNo: Number(
      value?.quotationStartNo ?? defaultBusinessProfileValues.quotationStartNo,
    ),
    proformaStartNo: Number(
      value?.proformaStartNo ?? defaultBusinessProfileValues.proformaStartNo,
    ),
  };
}

export function validateBusinessProfile(
  values: BusinessProfileFormValues,
): BusinessProfileErrors {
  const errors: BusinessProfileErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobilePattern = /^[+]?[\d\s-]{8,15}$/;
  const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;

  if (isBlank(values.businessName)) errors.businessName = "Required";
  if (isBlank(values.legalName)) errors.legalName = "Required";
  if (isBlank(values.businessType)) errors.businessType = "Required";
  if (isBlank(values.email)) {
    errors.email = "Required";
  } else if (!emailPattern.test(values.email)) {
    errors.email = "Invalid email";
  }

  if (isBlank(values.mobile)) {
    errors.mobile = "Required";
  } else if (!mobilePattern.test(values.mobile)) {
    errors.mobile = "Invalid mobile";
  }

  if (values.gstRegistered && isBlank(values.gstin)) {
    errors.gstin = "Required";
  } else if (values.gstRegistered && !gstinPattern.test(values.gstin)) {
    errors.gstin = "Invalid GSTIN";
  }

  if (isBlank(values.addressLine1)) errors.addressLine1 = "Required";
  if (isBlank(values.city)) errors.city = "Required";
  if (isBlank(values.state)) errors.state = "Required";
  if (isBlank(values.country)) errors.country = "Required";
  if (isBlank(values.pincode)) errors.pincode = "Required";
  if (isBlank(values.financialYear)) errors.financialYear = "Required";
  if (isBlank(values.invoicePrefix)) errors.invoicePrefix = "Required";
  if (!isPositiveInteger(values.invoiceStartNo)) errors.invoiceStartNo = "Required";
  if (isBlank(values.quotationPrefix)) errors.quotationPrefix = "Required";
  if (!isPositiveInteger(values.quotationStartNo)) errors.quotationStartNo = "Required";
  if (isBlank(values.proformaPrefix)) errors.proformaPrefix = "Required";
  if (!isPositiveInteger(values.proformaStartNo)) errors.proformaStartNo = "Required";
  if (isBlank(values.paperSize)) errors.paperSize = "Required";

  return errors;
}

export function hasBusinessProfileErrors(errors: BusinessProfileErrors) {
  return Object.keys(errors).length > 0;
}
