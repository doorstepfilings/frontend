import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { XCircle } from "lucide-react";

export default function PaymentFailedPage() {
  return (
    <ErrorPageLayout
      eyebrow="Payment not completed"
      title="Your payment did not go through."
      description="No worries. Please check your payment method and try again. If money was deducted, contact support with your transaction details and we will help verify it."
      Icon={XCircle}
      iconColorClass="text-red-600"
      iconBgClass="bg-red-50"
      primaryAction={{ label: "Review Services", href: "/dashboard/services" }}
      secondaryAction={{ label: "Contact Support", href: "/contact" }}
    />
  );
}
