import { DocumentFormView } from "@/components/bookkeeping/document-form-view";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentFormView type="quotations" documentId={id} />;
}

