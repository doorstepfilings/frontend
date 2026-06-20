import { DocumentFormView } from "@/components/bookkeeping/document-form-view";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentFormView type="invoices" documentId={id} />;
}

