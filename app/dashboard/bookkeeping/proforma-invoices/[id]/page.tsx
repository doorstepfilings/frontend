import { DocumentFormView } from "@/components/bookkeeping/document-form-view";

export default async function ProformaInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentFormView type="proforma-invoices" documentId={id} />;
}

