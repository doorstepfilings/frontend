import { connection } from "next/server";
import { DashboardDocumentsView } from "@/components/dashboard/dashboard-documents-view";
import { normalizePaymentServiceIds } from "@/lib/utils/payment-navigation";

function readFirst(
  value: string | string[] | undefined,
  fallback = "",
) {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

export default async function DashboardDocumentsPage(
  props: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  },
) {
  await connection();
  const searchParams = await props.searchParams;

  return (
    <DashboardDocumentsView
      paymentFeedback={{
        message: readFirst(searchParams.message),
        orderId: readFirst(searchParams.order_id),
        paymentId: readFirst(searchParams.payment_id),
        serviceIds: normalizePaymentServiceIds(
          readFirst(searchParams.service_ids),
        ),
        status: readFirst(searchParams.status),
      }}
    />
  );
}
