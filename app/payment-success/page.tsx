import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PaymentSuccessView } from "@/components/payments/payment-success-view";
import {
  buildDashboardDocumentsUrl,
  normalizePaymentServiceIds,
} from "@/lib/utils/payment-navigation";

function readFirst(
  value: string | string[] | undefined,
  fallback = "",
) {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

export default async function PaymentSuccessPage(
  props: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  },
) {
  await connection();
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
