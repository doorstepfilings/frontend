import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { Lock } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <ErrorPageLayout
      title="Login Required"
      description="Please login to access this page."
      Icon={Lock}
      iconColorClass="text-slate-600"
      iconBgClass="bg-slate-100"
      primaryAction={{ label: "Go to Login", href: "/login" }}
      secondaryAction={{ label: "Go to Home", href: "/" }}
    />
  );
}
