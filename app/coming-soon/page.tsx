import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { Clock } from "lucide-react";

export default function ComingSoonPage() {
  return (
    <ErrorPageLayout
      title="Coming Soon"
      description="This service or page is launching soon. Stay connected with Doorstep Filings."
      Icon={Clock}
      iconColorClass="text-blue-600"
      iconBgClass="bg-blue-50"
    />
  );
}
