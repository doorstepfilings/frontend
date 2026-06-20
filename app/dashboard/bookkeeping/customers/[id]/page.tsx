import { CustomersView } from "@/components/bookkeeping/customers-view";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomersView initialCustomerId={id} />;
}

