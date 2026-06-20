import { DocumentFormView } from "@/components/bookkeeping/document-form-view";

export default async function DeliveryChallanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentFormView type="delivery-challans" documentId={id} />;
}

