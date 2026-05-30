import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { CheckCircle } from "lucide-react";

export default function ThankYouPage() {
  return (
    <ErrorPageLayout
      title="Thank You"
      description="Your request has been submitted successfully. Our expert team will contact you shortly."
      Icon={CheckCircle}
      iconColorClass="text-green-600"
      iconBgClass="bg-green-50"
      primaryAction={{ label: "View Services", href: "/services" }}
      secondaryAction={{ label: "Go to Home", href: "/" }}
    />
  );
}
