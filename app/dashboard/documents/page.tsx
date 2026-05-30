import { DashboardDocumentsView } from "@/components/dashboard/dashboard-documents-view";
import { normalizePaymentServiceIds } from "@/lib/utils/payment-navigation";

import { readFirst } from "@/lib/utils/core";

export default async function DashboardDocumentsPage(
  props: { searchParams: Promise<any> },
) {
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
