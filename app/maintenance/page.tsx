import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <ErrorPageLayout
      eyebrow="Maintenance in progress"
      title="We are making a few improvements."
      description="Doorstep Filings is temporarily unavailable while we update the experience. If your work is urgent, our support team can still help."
      Icon={Wrench}
      iconColorClass="text-amber-600"
      iconBgClass="bg-amber-50"
      primaryAction={{ label: "Contact Support", href: "/contact" }}
      secondaryAction={{ label: "Go to Home", href: "/" }}
    />
  );
}
