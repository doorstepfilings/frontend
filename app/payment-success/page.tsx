import { redirect } from "next/navigation";
import { PaymentSuccessView } from "@/components/payments/payment-success-view";
import {
  buildDashboardDocumentsUrl,
  normalizePaymentServiceIds,
} from "@/lib/utils/payment-navigation";

import { readFirst } from "@/lib/utils/core";
export default async function PaymentSuccessPage(
  props: { searchParams: Promise<any> },
) {
  const searchParams = await props.searchParams;

  const status = readFirst(searchParams.status, "success");
  const message = readFirst(
    searchParams.message,
    "Payment successfully done. You can upload your documents now.",
  );
  const paymentId = readFirst(searchParams.payment_id);
  const orderId = readFirst(searchParams.order_id);
  const serviceIds = normalizePaymentServiceIds(
    readFirst(searchParams.service_ids),
  );

  if (status === "success") {
    redirect(
      buildDashboardDocumentsUrl({
        status,
        message,
        orderId,
        paymentId,
        serviceIds,
      }),
    );
  }

  return (
    <PaymentSuccessView
      message={message}
      paymentId={paymentId}
      status={status}
    />
  );
}
