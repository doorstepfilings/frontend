import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <ErrorPageLayout
      eyebrow="Access limited"
      title="This page is not available for your account."
      description="You may be signed in with a different role, or this page may require extra permission. Go back home or contact support if you think this is a mistake."
      Icon={ShieldAlert}
      iconColorClass="text-red-600"
      iconBgClass="bg-red-50"
      primaryAction={{ label: "Go to Home", href: "/" }}
      secondaryAction={{ label: "Contact Support", href: "/contact" }}
    />
  );
}
