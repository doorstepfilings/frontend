import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { Lock } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <ErrorPageLayout
      eyebrow="Sign in needed"
      title="Please sign in to continue."
      description="Please sign in again, or use an account that can open this page. We will take you to the right workspace."
      Icon={Lock}
      iconColorClass="text-slate-600"
      iconBgClass="bg-slate-100"
      primaryAction={{ label: "Go to Login", href: "/login" }}
      secondaryAction={{ label: "Go to Home", href: "/" }}
    />
  );
}
