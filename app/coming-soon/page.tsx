import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { Clock } from "lucide-react";

export default function ComingSoonPage() {
  return (
    <ErrorPageLayout
      eyebrow="Almost ready"
      title="This page is coming soon."
      description="We are still preparing this page. In the meantime, you can explore our available services or contact the team for help with your filing."
      Icon={Clock}
      iconColorClass="text-blue-600"
      iconBgClass="bg-blue-50"
      primaryAction={{ label: "Browse Services", href: "/services" }}
      secondaryAction={{ label: "Contact Support", href: "/contact" }}
    />
  );
}
