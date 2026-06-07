import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { CheckCircle } from "lucide-react";

export default function ThankYouPage() {
  return (
    <ErrorPageLayout
      eyebrow="Request received"
      title="Thank you. We have received your request."
      description="Our team will review the details and contact you shortly. You can continue browsing services or return to the home page."
      Icon={CheckCircle}
      iconColorClass="text-green-600"
      iconBgClass="bg-green-50"
      primaryAction={{ label: "View Services", href: "/services" }}
      secondaryAction={{ label: "Go to Home", href: "/" }}
    />
  );
}
