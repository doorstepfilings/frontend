import { notFound, redirect } from "next/navigation";
import { ProtectedPlaceholder } from "@/components/migration/protected-placeholder";

const dashboardMap: Record<
  string,
  {
    title: string;
    subtitle: string;
    sourcePath: string;
    nextSteps: string[];
  }
> = {
  services: {
    title: "My Services",
    subtitle: "Protected user dashboard route scaffold in Next.js.",
    sourcePath: "resources/js/pages/Dashboard/MyServices.jsx",
    nextSteps: [
      "Move active service listings and status tracking.",
      "Preserve links back into the user workflow.",
    ],
  },
  "bookkeeping/business-profile": {
    title: "Business Profile",
    subtitle: "Bookkeeping business profile workspace scaffold in Next.js.",
    sourcePath: "resources/js/pages/Dashboard/Bookkeeping/BusinessProfile.jsx",
    nextSteps: [
      "Connect business registration list and create flows.",
      "Preserve company details, owner details, and document tracking behavior.",
    ],
  },
  "bookkeeping/customers": {
    title: "Customers",
    subtitle: "Bookkeeping customer master workspace scaffold in Next.js.",
    sourcePath: "resources/js/pages/Dashboard/Bookkeeping/Customers.jsx",
    nextSteps: [
      "Connect customer list, search, and create flows.",
      "Reuse customers inside quotations, proforma invoices, invoices, and delivery challans.",
    ],
  },
  "bookkeeping/quotations": {
    title: "Quotations",
    subtitle: "Bookkeeping quotation workspace scaffold in Next.js.",
    sourcePath: "resources/js/pages/Dashboard/Bookkeeping/Quotations.jsx",
    nextSteps: [
      "Connect quotation list and create flows.",
      "Preserve customer, tax, and line item entry behavior.",
    ],
  },
  "bookkeeping/proforma-invoices": {
    title: "Proforma Invoices",
    subtitle: "Bookkeeping proforma invoice workspace scaffold in Next.js.",
    sourcePath: "resources/js/pages/Dashboard/Bookkeeping/ProformaInvoices.jsx",
    nextSteps: [
      "Connect proforma invoice list and create flows.",
      "Preserve conversion paths into final invoices.",
    ],
  },
  "bookkeeping/invoices": {
    title: "Invoices",
    subtitle: "Bookkeeping invoice workspace scaffold in Next.js.",
    sourcePath: "resources/js/pages/Dashboard/Bookkeeping/Invoices.jsx",
    nextSteps: [
      "Connect invoice list, creation, and payment status flows.",
      "Preserve customer, tax, and ledger integration behavior.",
    ],
  },
  "bookkeeping/delivery-challans": {
    title: "Delivery Challans",
    subtitle: "Bookkeeping delivery challan workspace scaffold in Next.js.",
    sourcePath: "resources/js/pages/Dashboard/Bookkeeping/DeliveryChallans.jsx",
    nextSteps: [
      "Connect delivery challan list and create flows.",
      "Preserve dispatch, item, and linked invoice behavior.",
    ],
  },
  "bookkeeping/billing": {
    title: "Billing",
    subtitle: "Bookkeeping billing workspace scaffold in Next.js.",
    sourcePath: "resources/js/pages/Dashboard/Bookkeeping/Billing.jsx",
    nextSteps: [
      "Connect billing list and create flows.",
      "Preserve customer balances, due dates, and payment tracking behavior.",
    ],
  },
};

export default async function DashboardCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const key = slug.join("/");

  if (key === "applications") {
    redirect("/dashboard/services");
  }

  if (key === "services") {
    redirect("/dashboard/services");
  }

  if (key === "ydocuments") {
    redirect("/dashboard/documents");
  }

  if (key === "bookkeeping/business-registration") {
    redirect("/dashboard/bookkeeping/business-profile");
  }

  if (key.startsWith("bookkeeping/company/")) {
    redirect(`/dashboard/bookkeeping/${key.replace("bookkeeping/company/", "")}`);
  }

  const config = dashboardMap[key];

  if (!config) {
    notFound();
  }

  return (
    <ProtectedPlaceholder
      title={config.title}
      subtitle={config.subtitle}
      sourcePath={config.sourcePath}
      nextSteps={config.nextSteps}
      embedded
    />
  );
}
