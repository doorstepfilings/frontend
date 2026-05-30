import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <ErrorPageLayout
      title="Website Under Maintenance"
      description="We are improving Doorstep Filings to serve you better. Please check back soon."
      Icon={Wrench}
      iconColorClass="text-amber-600"
      iconBgClass="bg-amber-50"
      primaryAction={{ label: "Contact Support", href: "/contact" }}
      secondaryAction={undefined}
    />
  );
}
