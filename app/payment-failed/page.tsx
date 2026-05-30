import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { XCircle } from "lucide-react";

export default function PaymentFailedPage() {
  return (
    <ErrorPageLayout
      title="Payment Failed"
      description="Your payment could not be completed. Please try again or contact support."
      Icon={XCircle}
      iconColorClass="text-red-600"
      iconBgClass="bg-red-50"
      primaryAction={{ label: "Try Again", href: "/dashboard/services" }}
      secondaryAction={{ label: "Contact Support", href: "/contact" }}
    />
  );
}
